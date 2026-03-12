import jwt, { JwtPayload } from 'jsonwebtoken'
import { auth as adminAuth, isFirebaseAdminConfigured } from './firebase-admin'

const DEFAULT_FIREBASE_PROJECT_ID = 'kalakraft-b41a3'
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const DEFAULT_CERT_CACHE_TTL_MS = 60 * 60 * 1000

type FirebaseJwtPayload = JwtPayload & {
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  user_id?: string
}

export type VerifiedFirebaseToken = {
  uid: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export class FirebaseTokenVerificationError extends Error {
  code: 'project_mismatch' | 'invalid_token' | 'config_error'
  statusCode: number

  constructor(
    code: 'project_mismatch' | 'invalid_token' | 'config_error',
    message: string,
    statusCode = 401,
  ) {
    super(message)
    this.name = 'FirebaseTokenVerificationError'
    this.code = code
    this.statusCode = statusCode
  }
}

let certCache:
  | {
      certs: Record<string, string>
      expiresAt: number
    }
  | null = null

function parseProjectIdFromAuthDomain(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^([a-z0-9-]+)\.(?:firebaseapp\.com|web\.app)$/i)
  return match?.[1] || null
}

function getAllowedFirebaseProjectIds(): string[] {
  const fromAllowlist = (process.env.FIREBASE_ALLOWED_PROJECT_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const configured = [
    ...fromAllowlist,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    process.env.FIREBASE_PROJECT_ID?.trim(),
    parseProjectIdFromAuthDomain(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(configured.length > 0 ? configured : [DEFAULT_FIREBASE_PROJECT_ID]))
}

function getDecodedProjectId(payload: JwtPayload | null): string | null {
  if (!payload) return null
  if (typeof payload.aud === 'string' && payload.aud.trim()) {
    return payload.aud.trim()
  }
  if (typeof payload.iss === 'string') {
    const match = payload.iss.match(/https:\/\/securetoken\.google\.com\/([^/]+)$/i)
    return match?.[1] || null
  }
  return null
}

function normalizeVerifiedToken(payload: FirebaseJwtPayload & { uid?: string }): VerifiedFirebaseToken {
  const uid =
    (typeof payload.uid === 'string' && payload.uid) ||
    (typeof payload.user_id === 'string' && payload.user_id) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    ''

  if (!uid || uid.length > 128) {
    throw new Error('Firebase token subject is invalid')
  }

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    email_verified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}

function getCertCacheTtlMs(cacheControl: string | null): number {
  const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/i)
  const maxAgeSeconds = maxAgeMatch ? Number.parseInt(maxAgeMatch[1], 10) : 0
  return Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0
    ? maxAgeSeconds * 1000
    : DEFAULT_CERT_CACHE_TTL_MS
}

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) {
    return certCache.certs
  }

  const response = await fetch(FIREBASE_CERT_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase public certs (${response.status})`)
  }

  const certs = (await response.json()) as Record<string, string>
  if (!certs || typeof certs !== 'object') {
    throw new Error('Firebase public cert response was invalid')
  }

  certCache = {
    certs,
    expiresAt: Date.now() + getCertCacheTtlMs(response.headers.get('cache-control')),
  }

  return certs
}

function verifyFirebaseTokenAgainstProject(
  idToken: string,
  signingCert: string,
  projectId: string,
): VerifiedFirebaseToken {
  const verified = jwt.verify(idToken, signingCert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  }) as FirebaseJwtPayload

  return normalizeVerifiedToken(verified)
}

async function verifyFirebaseIdTokenWithGoogleCerts(idToken: string): Promise<VerifiedFirebaseToken> {
  const decoded = jwt.decode(idToken, { complete: true })
  if (!decoded || typeof decoded !== 'object' || !decoded.header) {
    throw new FirebaseTokenVerificationError('invalid_token', 'Firebase token could not be decoded')
  }

  const header = decoded.header
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new FirebaseTokenVerificationError('invalid_token', 'Firebase token header is invalid')
  }

  const allowedProjectIds = getAllowedFirebaseProjectIds()
  const certs = await getFirebasePublicCerts()
  const signingCert = certs[header.kid]

  if (!signingCert) {
    certCache = null
    const refreshedCerts = await getFirebasePublicCerts()
    const refreshedSigningCert = refreshedCerts[header.kid]
    if (!refreshedSigningCert) {
      throw new FirebaseTokenVerificationError('invalid_token', 'Firebase token signing key was not recognized')
    }
    return verifyFirebaseIdTokenWithCertForAllowedProjects(idToken, refreshedSigningCert, allowedProjectIds)
  }

  return verifyFirebaseIdTokenWithCertForAllowedProjects(idToken, signingCert, allowedProjectIds)
}

function verifyFirebaseIdTokenWithCertForAllowedProjects(
  idToken: string,
  signingCert: string,
  allowedProjectIds: string[],
): VerifiedFirebaseToken {
  for (const projectId of allowedProjectIds) {
    try {
      return verifyFirebaseTokenAgainstProject(idToken, signingCert, projectId)
    } catch {
      // Try the next configured project ID.
    }
  }

  const payload = jwt.decode(idToken) as JwtPayload | null
  const actualProjectId = getDecodedProjectId(payload)

  if (actualProjectId && !allowedProjectIds.includes(actualProjectId)) {
    throw new FirebaseTokenVerificationError(
      'project_mismatch',
      `Firebase token project "${actualProjectId}" does not match configured project IDs: ${allowedProjectIds.join(', ')}`,
    )
  }

  throw new FirebaseTokenVerificationError('invalid_token', 'Firebase token could not be verified')
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (isFirebaseAdminConfigured) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      return normalizeVerifiedToken(decoded as FirebaseJwtPayload & { uid?: string })
    } catch (adminError) {
      try {
        return await verifyFirebaseIdTokenWithGoogleCerts(idToken)
      } catch (fallbackError) {
        throw fallbackError instanceof Error ? fallbackError : adminError
      }
    }
  }

  return verifyFirebaseIdTokenWithGoogleCerts(idToken)
}

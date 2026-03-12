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

let certCache:
  | {
      certs: Record<string, string>
      expiresAt: number
    }
  | null = null

function getExpectedFirebaseProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_PROJECT_ID
  )
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

async function verifyFirebaseIdTokenWithGoogleCerts(idToken: string): Promise<VerifiedFirebaseToken> {
  const decoded = jwt.decode(idToken, { complete: true })
  if (!decoded || typeof decoded !== 'object' || !decoded.header) {
    throw new Error('Firebase token could not be decoded')
  }

  const header = decoded.header
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('Firebase token header is invalid')
  }

  const projectId = getExpectedFirebaseProjectId()
  const certs = await getFirebasePublicCerts()
  const signingCert = certs[header.kid]

  if (!signingCert) {
    certCache = null
    const refreshedCerts = await getFirebasePublicCerts()
    const refreshedSigningCert = refreshedCerts[header.kid]
    if (!refreshedSigningCert) {
      throw new Error('Firebase token signing key was not recognized')
    }

    const verified = jwt.verify(idToken, refreshedSigningCert, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    }) as FirebaseJwtPayload

    return normalizeVerifiedToken(verified)
  }

  const verified = jwt.verify(idToken, signingCert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  }) as FirebaseJwtPayload

  return normalizeVerifiedToken(verified)
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

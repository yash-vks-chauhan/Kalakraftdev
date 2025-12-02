import { NextResponse } from 'next/server'
import { AuthContext, getAuthContext } from './auth'

type RateBucket = {
  count: number
  resetAt: number
}

export type ValidatedUpload = {
  buffer: Buffer
  filename: string
  mimeType: string
  size: number
}

type GuardFailure = { ok: false; response: NextResponse }
type GuardSuccess = { ok: true; auth: AuthContext; upload: ValidatedUpload }

const rateBuckets = new Map<string, RateBucket>()

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024
export const DEFAULT_RATE_LIMIT = 10
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[/\\]/g, ' ').replace(/\s+/g, '-')
  const safe = trimmed.replace(/[^A-Za-z0-9._-]/g, '')
  return safe || 'upload'
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif'
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    const marker = buffer.subarray(8, 12).toString('ascii')
    if (marker === 'WEBP') return 'image/webp'
  }
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = buffer.subarray(8, 12).toString('ascii')
    if (brand.toLowerCase().startsWith('avif')) return 'image/avif'
  }

  return null
}

function scanForMalware(buffer: Buffer): string | null {
  const blockedMagic = [
    { sig: Buffer.from([0x4d, 0x5a]), reason: 'Executable content blocked' }, // MZ
    { sig: Buffer.from([0x50, 0x4b, 0x03, 0x04]), reason: 'Archive uploads are not allowed' }, // ZIP
    { sig: Buffer.from('%PDF-'), reason: 'PDF uploads are not allowed' },
    { sig: Buffer.from([0x25, 0x21]), reason: 'PostScript uploads are not allowed' },
  ]

  for (const { sig, reason } of blockedMagic) {
    if (buffer.subarray(0, sig.length).equals(sig)) return reason
  }

  const asciiSample = buffer.subarray(0, 4096).toString('utf8').toLowerCase()
  const suspiciousMarkers = ['<script', '<?php', '<html', 'eval(', 'bash -c', 'powershell']
  if (suspiciousMarkers.some((marker) => asciiSample.includes(marker))) {
    return 'Suspicious executable content detected'
  }

  return null
}

function getClientIdentifier(request: Request, auth?: AuthContext): string {
  if (auth?.userId) return auth.userId
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return 'unknown'
}

function applyRateLimit(
  key: string,
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  rateBuckets.set(key, bucket)
  return { allowed: true }
}

async function extractFileFromRequest(
  request: Request,
  {
    maxSizeBytes = MAX_UPLOAD_SIZE_BYTES,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
  }: { maxSizeBytes?: number; allowedMimeTypes?: string[] },
): Promise<{ ok: true; upload: ValidatedUpload } | GuardFailure> {
  const { searchParams } = new URL(request.url)
  const contentTypeHeader = request.headers.get('content-type') || ''

  let buffer: Buffer | null = null
  let filename = searchParams.get('filename') || ''
  let mimeFromHeader = contentTypeHeader.split(';')[0].trim().toLowerCase()

  if (contentTypeHeader.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'No file field named "file" found in form data.' }, { status: 400 }),
      }
    }
    buffer = Buffer.from(await file.arrayBuffer())
    filename = file.name || filename
    mimeFromHeader = (file.type || mimeFromHeader).toLowerCase()
  } else {
    const arrayBuffer = await request.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return { ok: false, response: NextResponse.json({ error: 'Request body is empty.' }, { status: 400 }) }
    }
    buffer = Buffer.from(arrayBuffer)
  }

  if (!buffer || buffer.byteLength === 0) {
    return { ok: false, response: NextResponse.json({ error: 'No file content received.' }, { status: 400 }) }
  }

  const detectedMime = detectMimeFromBuffer(buffer)
  const mimeType = (detectedMime || mimeFromHeader || '').toLowerCase()

  if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Unsupported file type.',
          allowed: allowedMimeTypes,
          detected: mimeType || 'unknown',
        },
        { status: 415 },
      ),
    }
  }

  if (!filename) filename = `upload.${MIME_EXTENSION_MAP[mimeType] || 'bin'}`
  filename = sanitizeFilename(filename)
  const hasExtension = /\.[A-Za-z0-9]+$/.test(filename)
  if (!hasExtension) filename = `${filename}.${MIME_EXTENSION_MAP[mimeType] || 'bin'}`

  if (buffer.byteLength > maxSizeBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `File size exceeds limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`,
          receivedBytes: buffer.byteLength,
          limitBytes: maxSizeBytes,
        },
        { status: 413 },
      ),
    }
  }

  const malwareReason = scanForMalware(buffer)
  if (malwareReason) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Upload blocked due to security checks.',
          reason: malwareReason,
        },
        { status: 400 },
      ),
    }
  }

  return {
    ok: true,
    upload: {
      buffer,
      filename,
      mimeType,
      size: buffer.byteLength,
    },
  }
}

export async function guardUploadRequest(
  request: Request,
  {
    routeKey,
    maxSizeBytes = MAX_UPLOAD_SIZE_BYTES,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    requireAdmin = false,
    rateLimit = DEFAULT_RATE_LIMIT,
    rateWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
  }: {
    routeKey: string
    maxSizeBytes?: number
    allowedMimeTypes?: string[]
    requireAdmin?: boolean
    rateLimit?: number
    rateWindowMs?: number
  },
): Promise<GuardSuccess | GuardFailure> {
  const auth = getAuthContext(request)
  if (!auth?.userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (requireAdmin && auth.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  const rateKey = `${routeKey}:${getClientIdentifier(request, auth)}`
  const rateResult = applyRateLimit(rateKey, rateLimit, rateWindowMs)
  if (!rateResult.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many upload attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': `${rateResult.retryAfterSeconds}` },
        },
      ),
    }
  }

  const parsed = await extractFileFromRequest(request, { maxSizeBytes, allowedMimeTypes })
  if (!parsed.ok) return parsed

  return { ok: true, auth, upload: parsed.upload }
}

export function shouldUsePrivateAccess(): boolean {
  return process.env.ENFORCE_PRIVATE_UPLOADS !== 'false'
}

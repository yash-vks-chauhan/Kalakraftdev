import { resolveSupportAttachmentUrl, type SupportAttachmentStorageProvider } from './supportUploadStorage'
import { verifySupportAttachmentToken } from './supportAttachmentTokens'

export type SupportAttachment = {
  url: string
  type: 'image'
  mimeType?: string
  size?: number
  width?: number
  height?: number
  name?: string
  storageProvider?: SupportAttachmentStorageProvider
  storageKey?: string
  storageToken?: string
}

export const MAX_SUPPORT_ATTACHMENTS = 4
export const MAX_SUPPORT_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024
export const MAX_SUPPORT_ATTACHMENT_DIMENSION = 1080

const isImageLike = (value?: string) => (value || '').toLowerCase().startsWith('image')

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>()

  for (const candidate of [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL, process.env.IMAGEKIT_URL_ENDPOINT]) {
    const value = candidate?.trim()
    if (!value) continue
    try {
      hosts.add(new URL(value).host)
    } catch {
      // Ignore malformed environment values.
    }
  }

  return hosts
}

function getAllowedLegacyBlobHosts(): Set<string> {
  return new Set(
    (process.env.SUPPORT_ATTACHMENT_LEGACY_HOSTS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

function normalizeStorageKey(value: string): string {
  return value.trim()
}

function hasTrustedManagedStorage(
  provider: SupportAttachmentStorageProvider,
  storageKey: string,
): boolean {
  const normalized = normalizeStorageKey(storageKey)
  if (!normalized || normalized.includes('..')) return false

  if (provider === 'cloudinary') {
    return normalized.startsWith('support/')
  }

  if (provider === 'imagekit') {
    return normalized.startsWith('/support/') || normalized.startsWith('support/')
  }

  return false
}

function isTrustedLegacyAttachmentUrl(value: string): boolean {
  if (!value) return false
  if (value.startsWith('/api/uploads/')) return true

  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false

    const allowedHosts = getAllowedHosts()
    if (allowedHosts.has(parsed.host)) {
      return parsed.pathname.startsWith('/api/uploads/')
    }

    if (getAllowedLegacyBlobHosts().has(parsed.host.toLowerCase())) return true

    if (parsed.host === 'res.cloudinary.com') {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      return cloudName ? parsed.pathname.startsWith(`/${cloudName}/`) : false
    }
  } catch {
    return false
  }

  return false
}

function isLocalSignedAttachmentUrl(value: string): boolean {
  if (!value) return false
  if (value.startsWith('/api/uploads/')) return true

  try {
    const parsed = new URL(value)
    const allowedHosts = getAllowedHosts()
    return allowedHosts.has(parsed.host) && parsed.pathname.startsWith('/api/uploads/')
  } catch {
    return false
  }
}

export function sanitizeSupportAttachments(
  raw: any,
  options: { includeStorageKey?: boolean } = {},
): SupportAttachment[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((att) => {
      if (!att || typeof att !== 'object') return null

      const mimeType = typeof att.mimeType === 'string' ? att.mimeType : undefined
      const type = typeof att.type === 'string' ? att.type : ''
      const isImage = isImageLike(type) || isImageLike(mimeType)
      if (!isImage) return null

      const storageProvider =
        att.storageProvider === 'cloudinary' || att.storageProvider === 'imagekit'
          ? (att.storageProvider as SupportAttachmentStorageProvider)
          : undefined
      const storageKey =
        typeof att.storageKey === 'string' && att.storageKey.trim()
          ? normalizeStorageKey(att.storageKey)
          : undefined

      const resolvedUrl =
        storageProvider && storageKey && hasTrustedManagedStorage(storageProvider, storageKey)
          ? resolveSupportAttachmentUrl(storageProvider, storageKey)
          : null
      const legacyUrl =
        typeof att.url === 'string' && isTrustedLegacyAttachmentUrl(att.url) ? att.url : null
      const url = resolvedUrl || legacyUrl

      if (!url) return null

      return {
        url,
        type: 'image' as const,
        mimeType,
        size: typeof att.size === 'number' ? att.size : undefined,
        width: typeof att.width === 'number' ? att.width : undefined,
        height: typeof att.height === 'number' ? att.height : undefined,
        name: typeof att.name === 'string' ? att.name : undefined,
        storageProvider,
        ...(options.includeStorageKey ? { storageKey } : {}),
      }
    })
    .filter(Boolean) as SupportAttachment[]
}

export function validateSupportAttachments(
  raw: any,
  ownerUserId?: string,
): { ok: true; attachments: SupportAttachment[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Attachments must be an array' }
  }

  if (raw.length > MAX_SUPPORT_ATTACHMENTS) {
    return { ok: false, error: `Maximum ${MAX_SUPPORT_ATTACHMENTS} images allowed` }
  }

  for (const att of raw) {
    if (!att || typeof att !== 'object') {
      return { ok: false, error: 'Invalid attachment payload' }
    }

    const mimeType = typeof att.mimeType === 'string' ? att.mimeType : undefined
    const type = typeof att.type === 'string' ? att.type : ''
    const isImage = isImageLike(type) || isImageLike(mimeType)
    if (!isImage) {
      return { ok: false, error: 'Only image attachments are allowed' }
    }

    const hasManagedStorage =
      (att.storageProvider === 'cloudinary' || att.storageProvider === 'imagekit') &&
      typeof att.storageKey === 'string' &&
      hasTrustedManagedStorage(att.storageProvider, att.storageKey) &&
      (!ownerUserId ||
        (typeof att.storageToken === 'string' &&
          verifySupportAttachmentToken({
            provider: att.storageProvider,
            storageKey: att.storageKey,
            userId: ownerUserId,
            token: att.storageToken,
          })))
    const hasLocalSignedUrl = typeof att.url === 'string' && isLocalSignedAttachmentUrl(att.url)

    if (!hasManagedStorage && !hasLocalSignedUrl) {
      return { ok: false, error: 'Invalid or untrusted attachment payload' }
    }
  }

  const attachments = sanitizeSupportAttachments(raw, { includeStorageKey: true })
  if (attachments.length !== raw.length) {
    return { ok: false, error: 'Invalid or untrusted attachment payload' }
  }

  for (const att of attachments) {
    if (typeof att.size === 'number' && att.size > MAX_SUPPORT_ATTACHMENT_SIZE_BYTES) {
      return { ok: false, error: 'Each image must be 3MB or smaller' }
    }
    if (typeof att.width === 'number' && att.width > MAX_SUPPORT_ATTACHMENT_DIMENSION) {
      return { ok: false, error: 'Images must be at most 1080px in width' }
    }
    if (typeof att.height === 'number' && att.height > MAX_SUPPORT_ATTACHMENT_DIMENSION) {
      return { ok: false, error: 'Images must be at most 1080px in height' }
    }
  }

  return { ok: true, attachments }
}

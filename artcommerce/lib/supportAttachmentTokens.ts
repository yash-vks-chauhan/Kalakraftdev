import { createHmac, timingSafeEqual } from 'crypto'
import type { SupportAttachmentStorageProvider } from './supportUploadStorage'

const SIGNING_SECRET =
  process.env.SUPPORT_ATTACHMENT_SIGNING_SECRET ||
  process.env.UPLOAD_SIGNING_SECRET ||
  process.env.JWT_SECRET ||
  ''

function buildPayload(
  provider: SupportAttachmentStorageProvider,
  storageKey: string,
  userId: string,
): string {
  return `${provider}:${storageKey}:${userId}`
}

export function signSupportAttachment(
  provider: SupportAttachmentStorageProvider,
  storageKey: string,
  userId: string,
): string {
  if (!SIGNING_SECRET) {
    throw new Error('Support attachment signing secret is not configured')
  }

  return createHmac('sha256', SIGNING_SECRET)
    .update(buildPayload(provider, storageKey, userId))
    .digest('hex')
}

export function verifySupportAttachmentToken({
  provider,
  storageKey,
  userId,
  token,
}: {
  provider: SupportAttachmentStorageProvider
  storageKey: string
  userId: string
  token: string
}): boolean {
  if (!SIGNING_SECRET || !token) return false

  const expected = signSupportAttachment(provider, storageKey, userId)
  if (token.length !== expected.length) return false

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

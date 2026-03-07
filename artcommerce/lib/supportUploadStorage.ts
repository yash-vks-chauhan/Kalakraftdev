import { Readable } from 'stream'
import sharp from 'sharp'
import cloudinary from './cloudinary'
import { getImageKitClient, isImageKitConfigured } from './imagekit'
import { sanitizeFilename, SIGNED_URL_TTL_SECONDS } from './uploadGuard'

export type SupportAttachmentStorageProvider = 'cloudinary' | 'imagekit'

export type StoredSupportAttachment = {
  url: string
  type: 'image'
  mimeType: string
  size: number
  width?: number
  height?: number
  name: string
  storageProvider: SupportAttachmentStorageProvider
  storageKey: string
}

export const MAX_SUPPORT_ATTACHMENT_DIMENSION = 1080

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}

export function hasSecureSupportAttachmentStorage(): boolean {
  return isCloudinaryConfigured() || isImageKitConfigured()
}

function baseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

function buildCloudinaryUrl(publicId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS
  return cloudinary.url(publicId, {
    secure: true,
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    resource_type: 'image',
  })
}

function buildImageKitUrl(filePath: string): string | null {
  const imagekit = getImageKitClient()
  if (!imagekit) return null

  return imagekit.url({
    path: filePath,
    signed: true,
    expireSeconds: SIGNED_URL_TTL_SECONDS,
  })
}

export function resolveSupportAttachmentUrl(
  provider: SupportAttachmentStorageProvider,
  storageKey: string,
): string | null {
  if (!storageKey) return null

  if (provider === 'cloudinary') {
    return isCloudinaryConfigured() ? buildCloudinaryUrl(storageKey) : null
  }

  if (provider === 'imagekit') {
    return buildImageKitUrl(storageKey)
  }

  return null
}

export async function storeSupportAttachment({
  buffer,
  filename,
  mimeType,
  userId,
}: {
  buffer: Buffer
  filename: string
  mimeType: string
  userId: string
}): Promise<StoredSupportAttachment> {
  const safeName = sanitizeFilename(filename)
  const ownerSegment = sanitizeFilename(userId)
  const imageMeta = (await sharp(buffer).metadata().catch(() => null)) as
    | { width?: number; height?: number }
    | null
  const width = typeof imageMeta?.width === 'number' ? imageMeta.width : undefined
  const height = typeof imageMeta?.height === 'number' ? imageMeta.height : undefined
  if (
    (typeof width === 'number' && width > MAX_SUPPORT_ATTACHMENT_DIMENSION) ||
    (typeof height === 'number' && height > MAX_SUPPORT_ATTACHMENT_DIMENSION)
  ) {
    throw new Error('Images must be at most 1080px in width and height')
  }
  const publicBaseName = `${ownerSegment}-${Date.now()}-${baseName(safeName)}`

  if (isCloudinaryConfigured()) {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'support',
          public_id: publicBaseName,
          resource_type: 'image',
          access_mode: 'authenticated',
          type: 'authenticated',
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )

      Readable.from(buffer).pipe(uploadStream)
    })

    return {
      url: buildCloudinaryUrl(uploadResult.public_id),
      type: 'image',
      mimeType,
      size: buffer.byteLength,
      width: uploadResult.width ?? width,
      height: uploadResult.height ?? height,
      name: safeName,
      storageProvider: 'cloudinary',
      storageKey: uploadResult.public_id,
    }
  }

  const imagekit = getImageKitClient()
  if (imagekit) {
    const uploadResult = await imagekit.upload({
      file: buffer,
      fileName: publicBaseName,
      folder: '/support',
      useUniqueFileName: false,
      isPrivateFile: true,
    })

    const signedUrl = buildImageKitUrl(uploadResult.filePath)
    if (!signedUrl) {
      throw new Error('ImageKit private delivery URL could not be generated')
    }

    return {
      url: signedUrl,
      type: 'image',
      mimeType,
      size: buffer.byteLength,
      width: uploadResult.width ?? width,
      height: uploadResult.height ?? height,
      name: safeName,
      storageProvider: 'imagekit',
      storageKey: uploadResult.filePath,
    }
  }

  throw new Error('Secure support attachment storage is not configured')
}

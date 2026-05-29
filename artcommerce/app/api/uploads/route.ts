// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import {
  guardUploadRequest,
  sanitizeFilename,
} from '@/lib/uploadGuard'

export const runtime = 'nodejs'

const MAX_AVATAR_UPLOAD_SIZE_BYTES = 3 * 1024 * 1024
const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request): Promise<NextResponse> {
  const guarded = await guardUploadRequest(request, {
    routeKey: 'uploads:avatar',
    maxSizeBytes: MAX_AVATAR_UPLOAD_SIZE_BYTES,
    allowedMimeTypes: AVATAR_ALLOWED_MIME_TYPES,
  })

  if ('response' in guarded) return guarded.response

  const { auth, upload } = guarded

  try {
    const processedBuffer = await sharp(upload.buffer)
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const access = 'public' as const
    const ownerSegment = sanitizeFilename(auth.userId)
    const baseName = sanitizeFilename(upload.filename.replace(/\.[^/.]+$/, ''))
    const uniqueFilename = `${ownerSegment}/avatars/${Date.now()}-${baseName}.webp`

    const blob = await put(uniqueFilename, processedBuffer, {
      access,
      contentType: 'image/webp',
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: processedBuffer.byteLength,
      originalSize: upload.size,
      mimeType: 'image/webp',
      access,
    })
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        message: 'Error uploading file.',
        error: errorMessage,
        details:
          error instanceof Error
            ? {
                name: error.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
              }
            : undefined,
      },
      { status: 500 },
    )
  }
}

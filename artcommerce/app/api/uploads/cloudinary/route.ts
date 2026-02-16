import { NextResponse } from 'next/server'
import { Readable } from 'stream'
import cloudinary from '@/lib/cloudinary'
import { optimizeImageIfNeeded, MAX_FILE_SIZE } from '@/lib/imageOptimizer'
import {
  guardUploadRequest,
  sanitizeFilename,
  shouldUsePrivateAccess,
  SIGNED_URL_TTL_SECONDS,
} from '@/lib/uploadGuard'

export const runtime = 'nodejs'
export const maxDuration = 60 // Extend timeout to 60 seconds for large image processing

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const folder = sanitizeFolder(searchParams.get('folder') || 'products')

  const guarded = await guardUploadRequest(request, {
    routeKey: 'uploads:cloudinary',
    maxSizeBytes: MAX_FILE_SIZE,
    requireAdmin: true,
  })

  if ('response' in guarded) return guarded.response

  const { upload, auth } = guarded
  const ownerSegment = sanitizeFilename(auth.userId)

  try {
    const { buffer: processedBuffer, optimized, originalSize, optimizedSize } = await optimizeImageIfNeeded(
      upload.buffer,
      upload.filename,
    )

    if (processedBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Image is still too large after optimization. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`,
          details: {
            originalSize,
            optimizedSize,
            maxSize: MAX_FILE_SIZE,
          },
        },
        { status: 413 },
      )
    }

    const readable = new Readable({
      read() {
        this.push(processedBuffer)
        this.push(null)
      },
    })

    const usePrivate = shouldUsePrivateAccess()
    const uniquePublicId = `${folder}/${ownerSegment}-${Date.now()}-${upload.filename.replace(/\.[^/.]+$/, '')}`

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: uniquePublicId,
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          access_mode: usePrivate ? 'authenticated' : 'public',
          type: usePrivate ? 'authenticated' : 'upload',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        },
      )

      readable.pipe(uploadStream)
    })

    const expiresAt = usePrivate ? Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS : undefined
    const deliveryUrl = usePrivate
      ? cloudinary.url(uploadResult.public_id, {
          secure: true,
          type: 'authenticated',
          sign_url: true,
          expires_at: expiresAt,
          resource_type: 'image',
        })
      : uploadResult.secure_url

    return NextResponse.json({
      url: deliveryUrl,
      access: usePrivate ? 'authenticated' : 'public',
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      originalSize,
      uploadedSize: processedBuffer.byteLength,
      wasOptimized: optimized,
      expiresAt,
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        message: 'Error uploading file to Cloudinary.',
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

function sanitizeFolder(folder: string): string {
  const safe = folder.replace(/[^A-Za-z0-9/_-]/g, '')
  const parts = safe.split('/').filter(Boolean)
  return parts.slice(0, 3).join('/') || 'uploads'
}

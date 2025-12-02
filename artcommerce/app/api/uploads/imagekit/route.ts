import { NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'
import { optimizeImageIfNeeded, MAX_FILE_SIZE } from '@/lib/imageOptimizer'
import {
  guardUploadRequest,
  sanitizeFilename,
  shouldUsePrivateAccess,
  SIGNED_URL_TTL_SECONDS,
} from '@/lib/uploadGuard'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const folder = sanitizeFolder(searchParams.get('folder') || 'products')

  const guarded = await guardUploadRequest(request, {
    routeKey: 'uploads:imagekit',
    maxSizeBytes: MAX_FILE_SIZE,
    requireAdmin: true,
  })

  if (!guarded.ok) return guarded.response

  const { upload, auth } = guarded
  const ownerSegment = sanitizeFilename(auth.userId)

  try {
    const { buffer: processedBuffer, optimized } = await optimizeImageIfNeeded(upload.buffer, upload.filename)

    if (processedBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Image is still too large after optimization. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`,
        },
        { status: 413 },
      )
    }

    const usePrivate = shouldUsePrivateAccess()
    const uploadResponse = await imagekit.upload({
      file: processedBuffer,
      fileName: `${ownerSegment}-${Date.now()}-${upload.filename.replace(/\.[^/.]+$/, '')}`,
      folder: folder.startsWith('/') ? folder : `/${folder}`,
      useUniqueFileName: false,
      isPrivateFile: usePrivate,
    })

    const expiresIn = usePrivate ? SIGNED_URL_TTL_SECONDS : undefined
    const deliveryUrl = usePrivate
      ? imagekit.url({
          path: uploadResponse.filePath,
          signed: true,
          expireSeconds: expiresIn,
        })
      : uploadResponse.url

    return NextResponse.json({
      url: deliveryUrl,
      fileId: uploadResponse.fileId,
      width: uploadResponse.width,
      height: uploadResponse.height,
      originalSize: upload.size,
      uploadedSize: processedBuffer.byteLength,
      wasOptimized: optimized,
      access: usePrivate ? 'private' : 'public',
      expiresIn,
    })
  } catch (error: any) {
    console.error('Error uploading to ImageKit:', error)
    return NextResponse.json(
      { message: 'Error uploading file to ImageKit.', error: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}

function sanitizeFolder(folder: string): string {
  const safe = folder.replace(/[^A-Za-z0-9/_-]/g, '')
  const parts = safe.split('/').filter(Boolean)
  return parts.slice(0, 3).join('/') || 'uploads'
}

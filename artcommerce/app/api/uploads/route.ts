// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import {
  guardUploadRequest,
  MAX_UPLOAD_SIZE_BYTES,
  sanitizeFilename,
  shouldUsePrivateAccess,
} from '@/lib/uploadGuard'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<NextResponse> {
  const guarded = await guardUploadRequest(request, {
    routeKey: 'uploads:blob',
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
  })

  if (!guarded.ok) return guarded.response

  const { auth, upload } = guarded

  try {
    const access = shouldUsePrivateAccess() ? 'private' : 'public'
    const ownerSegment = sanitizeFilename(auth.userId)
    const uniqueFilename = `${ownerSegment}/${Date.now()}-${upload.filename}`

    const blob = await put(uniqueFilename, upload.buffer, {
      access,
      contentType: upload.mimeType,
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: upload.size,
      mimeType: upload.mimeType,
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

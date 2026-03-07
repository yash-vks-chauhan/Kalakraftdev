import { NextResponse } from 'next/server'
import { isAllowedOrigin } from '@/lib/security'
import { storeSupportAttachment } from '@/lib/supportUploadStorage'
import { guardUploadRequest } from '@/lib/uploadGuard'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const guarded = await guardUploadRequest(request, {
    routeKey: 'support:attachments',
    maxSizeBytes: 3 * 1024 * 1024,
  })

  if ('response' in guarded) return guarded.response

  try {
    const attachment = await storeSupportAttachment({
      buffer: guarded.upload.buffer,
      filename: guarded.upload.filename,
      mimeType: guarded.upload.mimeType,
      userId: guarded.auth.userId,
    })

    return NextResponse.json(attachment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = /not configured/i.test(message)
      ? 503
      : /1080px/i.test(message)
        ? 400
        : 500

    return NextResponse.json(
      {
        error:
          status === 503
            ? 'Support attachments are temporarily unavailable'
            : status === 400
              ? message
            : 'Failed to upload support attachment',
      },
      { status },
    )
  }
}

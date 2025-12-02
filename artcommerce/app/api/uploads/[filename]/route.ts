import { NextResponse } from 'next/server'
import path from 'path'
import { readFile, stat } from 'fs/promises'
import { createHmac, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'

const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads')
const SIGNING_SECRET = process.env.UPLOAD_SIGNING_SECRET || process.env.JWT_SECRET
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

function isValidSignature(filename: string, expires: number, signature: string) {
  if (!SIGNING_SECRET) return false
  const expected = createHmac('sha256', SIGNING_SECRET)
    .update(`${filename}:${expires}`)
    .digest('hex')
  if (signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  if (!SIGNING_SECRET) {
    return NextResponse.json({ error: 'Server not configured for signed URLs' }, { status: 500 })
  }

  const url = new URL(request.url)
  const expires = Number(url.searchParams.get('expires'))
  const signature = url.searchParams.get('signature') || ''
  const safeName = path.basename(params.filename || '')
  if (!safeName || safeName !== params.filename) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
  }

  if (!expires || Date.now() > expires) {
    return NextResponse.json({ error: 'Link expired' }, { status: 403 })
  }
  if (!isValidSignature(safeName, expires, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const filePath = path.join(STORAGE_ROOT, safeName)
  try {
    await stat(filePath)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const file = await readFile(filePath)
  const ext = safeName.split('.').pop()?.toLowerCase() || ''
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream'

  return new NextResponse(file, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=31536000',
      'Content-Disposition': `inline; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

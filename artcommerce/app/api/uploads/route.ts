// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { createHmac } from 'crypto'
import { requireAdminFromRequest } from '@/lib/auth-helpers'

export const runtime = 'nodejs'

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads')
const SIGNING_SECRET = process.env.UPLOAD_SIGNING_SECRET || process.env.JWT_SECRET
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365

function buildSignedUrl(filename: string) {
  if (!SIGNING_SECRET) throw new Error('Signing secret not configured')
  const expires = Date.now() + ONE_YEAR_MS
  const signature = createHmac('sha256', SIGNING_SECRET)
    .update(`${filename}:${expires}`)
    .digest('hex')
  return `/api/uploads/${filename}?expires=${expires}&signature=${signature}`
}

export async function POST(request: Request) {
  if (!requireAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!SIGNING_SECRET) {
    return NextResponse.json({ error: 'Upload signing not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  const baseName = path.basename(file.name || '')
  const ext = (baseName.split('.').pop() || '').toLowerCase()
  const mimeType = file.type
  if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(mimeType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }
  if (baseName.includes('..')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
  }

  const filename = `${uuidv4()}.${ext}`
  await mkdir(STORAGE_ROOT, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(STORAGE_ROOT, filename), buffer)

  const signedUrl = buildSignedUrl(filename)
  return NextResponse.json({ url: signedUrl })
}

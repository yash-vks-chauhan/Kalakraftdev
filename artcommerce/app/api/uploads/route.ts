// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

// 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const JWT_SECRET = process.env.JWT_SECRET!
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function getAuthFromRequest(request: Request): { userId: number; role: string } | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
  let token = bearer
  if (!token) {
    const cookie = request.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // Require auth (any logged-in user). For stricter control, require admin: auth.role === 'admin'
  const auth = getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json(
      { error: 'No filename provided in the request parameters.' },
      { status: 400 },
    )
  }

  if (!request.body) {
    return NextResponse.json(
      { error: 'Request body is empty. No file content received.' },
      { status: 400 },
    )
  }

  try {
    // Check content length if available
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      const sizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { 
          error: `File size exceeds the 5MB limit. Received: ${sizeMB}MB`,
          details: {
            receivedSize: parseInt(contentLength),
            maxSize: MAX_FILE_SIZE,
            receivedSizeMB: sizeMB,
            maxSizeMB: '5MB'
          }
        },
        { status: 413 }, // Payload Too Large
      )
    }

    // Validate content type
    const contentType = request.headers.get('content-type') || ''
    if (!ALLOWED_MIME.has(contentType)) {
      return NextResponse.json(
        { error: `Unsupported content-type. Allowed: ${Array.from(ALLOWED_MIME).join(', ')}` },
        { status: 415 },
      )
    }

    // Create a user-scoped filename to prevent collisions and help traceability
    const uniqueFilename = `${Date.now()}-${filename}`;

    const blob = await put(`u_${auth.userId}/${uniqueFilename}`, request.body, {
      access: 'public',
      contentType,
    })

    console.log('Successfully uploaded file to Vercel Blob:', blob.url);

    // Return the blob object which includes the URL
    return NextResponse.json(blob)
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        message: 'Error uploading file.',
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : undefined
      },
      { status: 500 },
    )
  }
}

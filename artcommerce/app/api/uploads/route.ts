// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
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

    // Create a unique filename to prevent overwriting
    const uniqueFilename = `${Date.now()}-${filename}`;

    const blob = await put(uniqueFilename, request.body, {
      access: 'public',
      contentType: request.headers.get('content-type') || undefined,
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
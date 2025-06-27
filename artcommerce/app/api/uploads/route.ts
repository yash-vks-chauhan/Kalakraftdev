// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename || !request.body) {
    return NextResponse.json(
      { error: 'No filename provided or request body is empty.' },
      { status: 400 },
    )
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    })

    // Return the blob object which includes the URL
    return NextResponse.json(blob)
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { message: 'Error uploading file.', error: errorMessage },
      { status: 500 },
    )
  }
}
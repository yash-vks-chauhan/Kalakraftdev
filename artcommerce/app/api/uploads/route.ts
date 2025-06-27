// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { Blob } from 'buffer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided or file is a string.' }, { status: 400 });
  }

  // The 'file' from formData is a Blob in this environment.
  // We can get the name from the headers or just create a name.
  // For simplicity, we'll get the extension from its type.
  const originalFilename = file.name || 'untitled';
  const ext = path.extname(originalFilename);
  const filename = `${uuidv4()}${ext}`;

  // 3) write to public/uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const uploadPath = path.join(uploadDir, filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(uploadPath, buffer);
  } catch (error) {
    console.error('Failed to write file:', error);
    return NextResponse.json({ error: 'Failed to save file.' }, { status: 500 });
  }

  // 4) return the public URL
  return NextResponse.json({ url: `/uploads/${filename}` })
}
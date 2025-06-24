// File: app/api/uploads/route.ts
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // 1) grab the File from form-data
  const formData = await request.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // 2) generate a unique name & determine extension
  const ext = file.name.split('.').pop()
  const filename = `${uuidv4()}.${ext}`

  // 3) write to public/uploads
  const uploadPath = path.resolve(process.cwd(), 'public', 'uploads', filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(uploadPath, buffer)

  // 4) return the public URL
  return NextResponse.json({ url: `/uploads/${filename}` })
}
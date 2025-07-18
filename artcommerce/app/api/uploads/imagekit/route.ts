import { NextResponse } from 'next/server';
import imagekit from '../../../../lib/imagekit';
import { optimizeImageIfNeeded, MAX_FILE_SIZE } from '../../../../lib/imageOptimizer';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const folder = searchParams.get('folder') || 'products';

  if (!filename) {
    return NextResponse.json({ error: 'No filename provided in the request parameters.' }, { status: 400 });
  }
  if (!request.body) {
    return NextResponse.json({ error: 'Request body is empty. No file content received.' }, { status: 400 });
  }

  try {
    const buffer = await request.arrayBuffer();
    const originalSize = buffer.byteLength;

    // Quick validation – ensure this looks like an image
    const isImage = isImageBuffer(Buffer.from(buffer.slice(0, 4)));
    if (!isImage) {
      return NextResponse.json({ error: 'The uploaded file is not a valid image.' }, { status: 400 });
    }

    const { buffer: processedBuffer, optimized } = await optimizeImageIfNeeded(buffer, filename);

    if (processedBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Image is still too large after optimization. Maximum size is 10MB, got ${(processedBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB.` }, { status: 413 });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: processedBuffer,          // Pass binary buffer directly
      fileName: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
      folder: folder.startsWith('/') ? folder : `/${folder}`,
      useUniqueFileName: false,
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      width: uploadResponse.width,
      height: uploadResponse.height,
      originalSize,
      uploadedSize: processedBuffer.byteLength,
      wasOptimized: optimized,
    });
  } catch (error: any) {
    console.error('Error uploading to ImageKit:', error);
    return NextResponse.json({ message: 'Error uploading file to ImageKit.', error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  // WebP (RIFF)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;
  return false;
} 
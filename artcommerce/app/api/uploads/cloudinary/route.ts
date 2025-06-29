import { NextResponse } from 'next/server'
import cloudinary from '../../../../lib/cloudinary'
import { Readable } from 'stream'

export const runtime = 'nodejs'

// 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  const folder = searchParams.get('folder') || 'products'

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
          error: `File size exceeds the 10MB limit. Received: ${sizeMB}MB`,
          details: {
            receivedSize: parseInt(contentLength),
            maxSize: MAX_FILE_SIZE,
            receivedSizeMB: sizeMB,
            maxSizeMB: '10MB'
          }
        },
        { status: 413 }, // Payload Too Large
      )
    }

    // Generate a unique public ID for the file
    const uniquePublicId = `${folder}/${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`

    // Convert request body to buffer
    const buffer = await request.arrayBuffer();
    
    // Create a readable stream from the buffer
    const readable = new Readable({
      read() {
        this.push(Buffer.from(buffer));
        this.push(null);
      }
    });

    // Upload to Cloudinary using stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: uniquePublicId,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      readable.pipe(uploadStream);
    });

    const result = await uploadPromise as any;
    
    console.log('Successfully uploaded file to Cloudinary:', result.secure_url);

    // Return the result which includes the URL
    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        message: 'Error uploading file to Cloudinary.',
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
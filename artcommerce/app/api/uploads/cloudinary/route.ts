import { NextResponse } from 'next/server'
import cloudinary from '../../../../lib/cloudinary'
import { Readable } from 'stream'
import { optimizeImageIfNeeded, MAX_FILE_SIZE } from '../../../../lib/imageOptimizer'

export const runtime = 'nodejs'
export const maxDuration = 60; // Extend timeout to 60 seconds for large image processing

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
    // Convert request body to buffer
    const buffer = await request.arrayBuffer();
    const originalSize = buffer.byteLength;
    
    // Check if the file is an image by checking the first few bytes (magic numbers)
    const isImage = isImageBuffer(Buffer.from(buffer.slice(0, 4)));
    if (!isImage) {
      return NextResponse.json(
        { error: 'The uploaded file is not a valid image.' },
        { status: 400 },
      )
    }
    
    // Optimize the image if needed
    const { 
      buffer: processedBuffer, 
      optimized,
      originalSize: origSize,
      optimizedSize
    } = await optimizeImageIfNeeded(buffer, filename);
    
    // If the image is still too large after optimization
    if (processedBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `Image is still too large after optimization. Maximum size is 10MB, got ${(processedBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB.`,
          details: {
            originalSize: origSize,
            optimizedSize: optimizedSize,
            maxSize: MAX_FILE_SIZE,
            originalSizeMB: (origSize / (1024 * 1024)).toFixed(2) + 'MB',
            optimizedSizeMB: (optimizedSize / (1024 * 1024)).toFixed(2) + 'MB',
            maxSizeMB: '10MB'
          }
        },
        { status: 413 }, // Payload Too Large
      )
    }
    
    // Create a readable stream from the buffer
    const readable = new Readable({
      read() {
        this.push(processedBuffer);
        this.push(null);
      }
    });

    // Generate a unique public ID for the file
    const uniquePublicId = `${folder}/${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`

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
    
    // Log upload details
    const optimizationInfo = optimized 
      ? `Image was optimized: ${(originalSize / (1024 * 1024)).toFixed(2)}MB → ${(processedBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB (${Math.round((1 - processedBuffer.byteLength / originalSize) * 100)}% reduction)`
      : 'Image was under size limit, no optimization needed';
      
    console.log(`Successfully uploaded to Cloudinary: ${result.secure_url} - ${optimizationInfo}`);

    // Return the result which includes the URL
    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      originalSize: originalSize,
      uploadedSize: processedBuffer.byteLength,
      wasOptimized: optimized
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

/**
 * Check if a buffer is an image by examining the magic numbers
 * @param buffer The buffer to check (just the first few bytes)
 * @returns Whether the buffer appears to be an image
 */
function isImageBuffer(buffer: Buffer): boolean {
  // Check for common image formats by their magic numbers
  if (buffer.length < 4) return false;
  
  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }
  
  // PNG: starts with 89 50 4E 47 (89 P N G)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }
  
  // GIF: starts with 47 49 46 38 (G I F 8)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }
  
  // WebP: starts with 52 49 46 46 (R I F F) and has "WEBP" at offset 8
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    // We'd need more bytes to check for WEBP at offset 8, but this is a good start
    return true;
  }
  
  return false;
} 
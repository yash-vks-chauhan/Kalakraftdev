import sharp from 'sharp';

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Target size for large images (8MB)
 */
export const TARGET_SIZE = 8 * 1024 * 1024;

/**
 * Optimize an image buffer if it exceeds the maximum file size
 * @param buffer The image buffer to optimize
 * @param filename The original filename
 * @returns An object containing the optimized buffer and metadata
 */
export async function optimizeImageIfNeeded(buffer: ArrayBuffer, filename: string): Promise<{
  buffer: Buffer,
  optimized: boolean,
  originalSize: number,
  optimizedSize: number,
  width?: number,
  height?: number,
  format?: string
}> {
  const originalSize = buffer.byteLength;
  
  // If the image is already under the limit, return it as is
  if (originalSize <= MAX_FILE_SIZE) {
    return {
      buffer: Buffer.from(buffer),
      optimized: false,
      originalSize,
      optimizedSize: originalSize
    };
  }
  
  try {
    // Create a sharp instance from the buffer
    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();
    
    // Calculate the quality reduction needed based on file size
    // The larger the file, the more aggressive the compression
    const sizeRatio = originalSize / MAX_FILE_SIZE;
    const baseQuality = Math.min(90, Math.floor(100 / sizeRatio));
    const quality = Math.max(60, baseQuality); // Don't go below 60% quality
    
    // Determine if we need to resize the image
    let width = metadata.width;
    let height = metadata.height;
    
    // If the image is very large, resize it while maintaining aspect ratio
    if (width && height && (width > 2000 || height > 2000)) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = Math.min(width, 2000);
        height = Math.round(width / aspectRatio);
      } else {
        height = Math.min(height, 2000);
        width = Math.round(height * aspectRatio);
      }
      
      image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Determine the output format based on the input
    let outputFormat: keyof sharp.FormatEnum = 'jpeg';
    let outputOptions: any = { quality };
    
    // Keep original format for PNG and WebP, but optimize
    if (metadata.format === 'png') {
      outputFormat = 'png';
      outputOptions = {
        compressionLevel: 9,
        palette: true
      };
    } else if (metadata.format === 'webp') {
      outputFormat = 'webp';
      outputOptions = { quality };
    }
    
    // Process the image
    const optimizedBuffer = await image.toFormat(outputFormat, outputOptions).toBuffer();
    const optimizedSize = optimizedBuffer.byteLength;
    
    console.log(`Image optimized: ${filename} - Original: ${originalSize / 1024}KB, Optimized: ${optimizedSize / 1024}KB, Reduction: ${Math.round((1 - optimizedSize / originalSize) * 100)}%`);
    
    return {
      buffer: optimizedBuffer,
      optimized: true,
      originalSize,
      optimizedSize,
      width: width || metadata.width,
      height: height || metadata.height,
      format: outputFormat
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    
    // If optimization fails, return the original buffer
    return {
      buffer: Buffer.from(buffer),
      optimized: false,
      originalSize,
      optimizedSize: originalSize
    };
  }
} 
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;

// Helper function to get video URL
export function getVideoUrl(publicId: string, options = {}) {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    ...options
  });
}

// Helper function to get optimized video URL with transformations
export function getOptimizedVideoUrl(publicId: string) {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    quality: 'auto',
    format: 'auto',
    flags: 'streaming_attachment'
  });
} 
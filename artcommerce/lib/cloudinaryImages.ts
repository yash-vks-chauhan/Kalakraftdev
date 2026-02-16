// This file provides helper functions to access Cloudinary images

// Import the mapping if available
let imageUrlMapping: Record<string, string> = {};
try {
  imageUrlMapping = require('./cloudinaryImageUrls.json');
} catch (error) {
  // File doesn't exist yet, will use environment variables
}

/**
 * Get the Cloudinary URL for an image, falling back to the local path if not available
 * @param imageName The name of the image file (e.g., 'logo.png')
 * @returns The Cloudinary URL or local path
 */
export function getImageUrl(imageName: string): string {
  // First check if we have the URL in our mapping
  if (imageUrlMapping[imageName]) {
    return imageUrlMapping[imageName];
  }
  
  // Then check if we have an environment variable for this image
  const envVarName = `NEXT_PUBLIC_CLOUDINARY_${imageName.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`;
  const envUrl = process.env[envVarName];
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fall back to the local path
  return `/images/${imageName}`;
}

/**
 * Get the Cloudinary URL for an image with transformations
 * @param imageName The name of the image file
 * @param transformations Cloudinary transformations to apply
 * @returns The transformed Cloudinary URL or local path
 */
export function getOptimizedImageUrl(imageName: string, transformations: string): string {
  const baseUrl = getImageUrl(imageName);
  
  // If it's a Cloudinary URL, apply transformations
  if (baseUrl.includes('res.cloudinary.com')) {
    // Insert transformations before the upload part
    return baseUrl.replace('/upload/', `/upload/${transformations}/`);
  }
  
  // If it's a local URL, return as is
  return baseUrl;
} 
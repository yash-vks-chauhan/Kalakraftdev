// This file provides helper functions to access Cloudinary images

// Import the mapping if available
let imageUrlMapping: Record<string, string> = {};
try {
  imageUrlMapping = require('./cloudinaryImageUrls.json');
} catch (error) {
  // File doesn't exist yet, will use environment variables
}

const bundledImageNames = new Set([
  'category1.png',
  'category2.png',
  'category3.png',
  'category4.png',
  'category5.png',
  'category6.png',
  'category7.png',
  'category8.png',
  'collectionwall.png',
  'imageclock.png',
  'imagecollection1.png',
  'imagecollection99.png',
  'trayscollection.png',
  'vases.png',
  'featured1.png',
  'featured2.png',
  'featured3.JPG',
  'DSC01366.JPG',
])

/**
 * Get the Cloudinary URL for an image, falling back to the local path if not available
 * @param imageName The name of the image file (e.g., 'logo.png')
 * @returns The Cloudinary URL or local path
 */
export function getImageUrl(imageName: string): string {
  if (imageName.startsWith('http://') || imageName.startsWith('https://') || imageName.startsWith('/')) {
    return imageName
  }

  if (bundledImageNames.has(imageName)) {
    return `/images/${imageName}`
  }

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
 * Every place one image can be found, best first.
 *
 * getImageUrl has to answer with a single string, so for anything in
 * bundledImageNames it commits to the copy under public/images — and that
 * short-circuit sits *above* the CDN mapping, so the eighteen stills that do
 * have a CDN URL never get offered it. public/images is tracked with Git LFS,
 * and a checkout or deploy that does not fetch the LFS objects serves a
 * 132-byte pointer file in place of the PNG: the browser cannot decode it and
 * next/image rejects it with a 400. That is how a whole row of category
 * thumbnails goes blank while the logo beside it — the one name *not* in the
 * bundled set, so the one that does reach the mapping — is fine.
 *
 * Callers that can retry (see app/components/CategoryImage) take the list
 * instead of the string, so neither a missing LFS object nor an unreachable
 * CDN can empty a frame on its own.
 */
export function getImageSources(imageName: string): string[] {
  if (
    imageName.startsWith('http://') ||
    imageName.startsWith('https://') ||
    imageName.startsWith('/')
  ) {
    return [imageName]
  }

  const sources: string[] = []

  if (imageUrlMapping[imageName]) sources.push(imageUrlMapping[imageName])

  const envVarName = `NEXT_PUBLIC_CLOUDINARY_${imageName.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`
  const envUrl = process.env[envVarName]
  if (envUrl) sources.push(envUrl)

  sources.push(`/images/${imageName}`)

  return Array.from(new Set(sources))
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

require('dotenv').config({ path: 'artcommerce/.env' });
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Debug: Check if environment variables are loaded
console.log('Checking environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Found' : 'Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Found' : 'Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Found' : 'Missing');

// If any required variable is missing, exit
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Error: Missing required Cloudinary credentials in artcommerce/.env file');
  console.error('Please make sure you have added the following to your artcommerce/.env file:');
  console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.error('CLOUDINARY_API_KEY=your_api_key');
  console.error('CLOUDINARY_API_SECRET=your_api_secret');
  process.exit(1);
}

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// List of images to upload
const images = [
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
  'logo.png',
  'trayscollection.png',
  'vases.png',
  'featured1.png',
  'featured2.png',
  'featured3.JPG',
  'DSC01366.JPG'
];

// Object to store the URLs of uploaded images
const imageUrls = {};

// Function to upload a single image
async function uploadImage(imageName) {
  return new Promise((resolve, reject) => {
    const imagePath = path.join(__dirname, '../public/images', imageName);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`File not found: ${imagePath}`);
      return resolve(null);
    }
    
    // Upload to Cloudinary
    console.log(`Uploading ${imageName}...`);
    cloudinary.uploader.upload(
      imagePath,
      {
        public_id: `kalakraft/${imageName.replace(/\.[^/.]+$/, '')}`, // Remove extension
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error(`Error uploading ${imageName}:`, error);
          return resolve(null);
        }
        
        console.log(`✅ ${imageName} uploaded successfully`);
        return resolve({
          name: imageName,
          url: result.secure_url
        });
      }
    );
  });
}

// Upload all images
async function uploadAllImages() {
  console.log('Starting upload of all images to Cloudinary...');
  
  const results = await Promise.all(images.map(uploadImage));
  
  // Filter out null results and store URLs
  results.filter(Boolean).forEach(result => {
    imageUrls[result.name] = result.url;
  });
  
  // Generate environment variables for the URLs
  console.log('\n=== CLOUDINARY IMAGE URLS ===');
  console.log('Add these to your artcommerce/.env file:');
  
  Object.entries(imageUrls).forEach(([name, url]) => {
    const varName = `NEXT_PUBLIC_CLOUDINARY_${name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`;
    console.log(`${varName}=${url}`);
  });
  
  // Generate a JSON mapping for easier use in code
  const jsonMapping = JSON.stringify(imageUrls, null, 2);
  fs.writeFileSync(path.join(__dirname, '../lib/cloudinaryImageUrls.json'), jsonMapping);
  console.log('\nImage URL mapping saved to artcommerce/lib/cloudinaryImageUrls.json');
  
  console.log('\nTo use these images in your code, update the image src attributes to use the environment variables or import the JSON mapping.');
}

// Run the upload
uploadAllImages().catch(error => {
  console.error('Upload failed:', error);
  process.exit(1);
}); 
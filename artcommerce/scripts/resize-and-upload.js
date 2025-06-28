require('dotenv').config({ path: 'artcommerce/.env' });
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// List of large images to resize and upload
const largeImages = [
  'featured1.png',
  'featured2.png'
];

// Function to resize and upload an image
async function resizeAndUpload(imageName) {
  try {
    const imagePath = path.join(__dirname, '../public/images', imageName);
    const outputPath = path.join(__dirname, '../public/images', `resized_${imageName}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`File not found: ${imagePath}`);
      return null;
    }
    
    console.log(`Resizing ${imageName}...`);
    
    // Resize the image to reduce file size
    await sharp(imagePath)
      .resize({ width: 1200 }) // Resize to 1200px width, maintaining aspect ratio
      .toFile(outputPath);
      
    console.log(`Uploading resized ${imageName}...`);
    
    // Upload the resized image to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        outputPath,
        {
          public_id: `kalakraft/${imageName.replace(/\.[^/.]+$/, '')}`, // Remove extension
          resource_type: 'auto'
        },
        (error, result) => {
          // Delete the temporary resized file
          fs.unlinkSync(outputPath);
          
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
  } catch (error) {
    console.error(`Error processing ${imageName}:`, error);
    return null;
  }
}

// Process all large images
async function processLargeImages() {
  console.log('Starting to process large images...');
  
  // Check if sharp is installed
  try {
    require('sharp');
  } catch (error) {
    console.error('The "sharp" package is not installed. Installing it now...');
    console.error('Please run: npm install sharp');
    process.exit(1);
  }
  
  const results = [];
  
  // Process images one by one
  for (const imageName of largeImages) {
    const result = await resizeAndUpload(imageName);
    if (result) {
      results.push(result);
    }
  }
  
  // Print results
  if (results.length > 0) {
    console.log('\n=== CLOUDINARY IMAGE URLS FOR LARGE IMAGES ===');
    console.log('Add these to your artcommerce/.env file:');
    
    results.forEach(result => {
      const varName = `NEXT_PUBLIC_CLOUDINARY_${result.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_URL`;
      console.log(`${varName}=${result.url}`);
    });
    
    // Update the JSON mapping
    const jsonPath = path.join(__dirname, '../lib/cloudinaryImageUrls.json');
    let imageUrlMapping = {};
    
    // Read existing mapping if it exists
    if (fs.existsSync(jsonPath)) {
      imageUrlMapping = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    
    // Add new URLs
    results.forEach(result => {
      imageUrlMapping[result.name] = result.url;
    });
    
    // Write updated mapping
    fs.writeFileSync(jsonPath, JSON.stringify(imageUrlMapping, null, 2));
    console.log('\nImage URL mapping updated in artcommerce/lib/cloudinaryImageUrls.json');
  } else {
    console.log('No images were successfully processed.');
  }
}

// Run the process
processLargeImages().catch(error => {
  console.error('Process failed:', error);
  process.exit(1);
}); 
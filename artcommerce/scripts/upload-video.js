require('dotenv').config({ path: 'artcommerce/.env' });
const cloudinary = require('cloudinary').v2;
const path = require('path');

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

// Path to the video file
const videoPath = path.join(__dirname, '../public/images/homepage_video.mp4');

// Video public ID - this is how you'll reference the video in your code
const publicId = 'kalakraft/homepage_video';

console.log('Starting video upload to Cloudinary...');
console.log('This may take a few minutes depending on your internet connection and video size.');

// Upload the video
cloudinary.uploader.upload(videoPath, 
  { 
    resource_type: "video",
    public_id: publicId,
    chunk_size: 6000000, // 6MB chunks for faster upload
    eager: [
      // Create different formats for optimal delivery
      { streaming_profile: "full_hd", format: "m3u8" }, // HLS streaming format
      { transformation: { quality: "auto" } } // Auto-optimized version
    ],
    eager_async: true,
    eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL // Optional webhook for notification
  }, 
  function(error, result) {
    if (error) {
      console.error("Upload error:", error);
    } else {
      console.log("Upload successful!");
      console.log("Video URL:", result.secure_url);
      
      // If HLS streaming URL is available
      if (result.eager && result.eager[0] && result.eager[0].secure_url) {
        console.log("HLS URL (for streaming):", result.eager[0].secure_url);
      }
      
      console.log("\nTo use this video in your application:");
      console.log(`1. Add this to your artcommerce/.env file:`);
      console.log(`NEXT_PUBLIC_CLOUDINARY_VIDEO_URL=${result.secure_url}`);
      console.log(`\n2. Update your video component to use this URL.`);
    }
  }
); 
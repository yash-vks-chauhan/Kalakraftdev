const cloudinary = require('cloudinary').v2;
const path = require('path');

// IMPORTANT: Replace these with your actual Cloudinary credentials
const CLOUD_NAME = 'your_cloud_name';
const API_KEY = 'your_api_key';
const API_SECRET = 'your_api_secret';

// Configure Cloudinary directly
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
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
    eager_async: true
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
      console.log(`Add this to your .env file:`);
      console.log(`NEXT_PUBLIC_CLOUDINARY_VIDEO_URL=${result.secure_url}`);
    }
  }
); 
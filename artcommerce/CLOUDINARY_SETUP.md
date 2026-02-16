# Cloudinary Setup Instructions

## 1. Create a Cloudinary Account
- Go to https://cloudinary.com/users/register/free
- Sign up for a free account
- After signing up, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials
From your Cloudinary dashboard, note down:
- Cloud Name
- API Key
- API Secret

## 3. Create a .env.local File
Create a file named `.env.local` in the root of your project with the following content:

```
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_VIDEO_URL=
```

Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with your actual Cloudinary credentials.

## 4. Upload Your Video
Run the upload script:

```
node scripts/upload-video.js
```

This will upload your video to Cloudinary and print the URL to use in your application.

## 5. Update Your .env.local File
After uploading, update your `.env.local` file with the video URL:

```
NEXT_PUBLIC_CLOUDINARY_VIDEO_URL=https://res.cloudinary.com/your_cloud_name/video/upload/v1234567890/kalakraft/homepage_video.mp4
```

## 6. Restart Your Development Server
Stop and restart your Next.js development server to apply the changes:

```
npm run dev
``` 
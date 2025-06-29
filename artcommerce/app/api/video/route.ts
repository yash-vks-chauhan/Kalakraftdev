import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the video file path
    const videoPath = path.join(process.cwd(), 'public', 'images', 'homepage_video.mp4');
    
    // Check if the file exists
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }
    
    // Get the file size
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    
    // Get the range from the request header
    const range = request.headers.get('range');
    
    if (range) {
      // Parse the range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Calculate the chunk size
      const chunkSize = end - start + 1;
      
      // Create the file stream
      const file = fs.createReadStream(videoPath, { start, end });
      
      // Set the headers
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'video/mp4',
      };
      
      // Return the response with the file stream
      return new NextResponse(file as any, {
        status: 206,
        headers,
      });
    } else {
      // Set the headers for the full file
      const headers = {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
      };
      
      // Return the response with the full file
      const file = fs.createReadStream(videoPath);
      return new NextResponse(file as any, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
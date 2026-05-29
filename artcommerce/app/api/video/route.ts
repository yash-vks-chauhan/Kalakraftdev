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
      const invalidRange = () =>
        new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });

      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (!match) return invalidRange();

      let start: number;
      let end: number;

      if (match[1] === '' && match[2] === '') return invalidRange();

      if (match[1] === '') {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return invalidRange();
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        end < start ||
        start >= fileSize
      ) {
        return invalidRange();
      }

      end = Math.min(end, fileSize - 1);
      
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

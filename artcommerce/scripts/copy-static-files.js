const fs = require('fs-extra');
const path = require('path');

async function copyStaticFiles() {
  try {
    console.log('Starting to copy static files...');
    
    // Define source and destination directories
    const sourcePublic = path.join(__dirname, '..', 'public');
    const destPublic = path.join(__dirname, '..', '.next', 'static', 'public');
    
    // Create destination directory if it doesn't exist
    await fs.ensureDir(destPublic);
    
    // Copy public directory
    console.log(`Copying from ${sourcePublic} to ${destPublic}`);
    await fs.copy(sourcePublic, destPublic, {
      overwrite: true,
      errorOnExist: false,
      recursive: true,
    });
    
    console.log('Successfully copied static files');
  } catch (error) {
    console.error('Error copying static files:', error);
    process.exit(1);
  }
}

copyStaticFiles(); 
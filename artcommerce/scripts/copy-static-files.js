const fs = require('fs-extra');
const path = require('path');

async function copyStaticFiles() {
  try {
    console.log('Starting to copy static files...');
    
    // Define source and destination directories
    const sourcePublic = path.join(__dirname, '..', 'public');
    const destPublic = path.join(__dirname, '..', '.next', 'static', 'public');
    const destStandalone = path.join(__dirname, '..', '.next', 'standalone', 'public');
    
    // Create destination directories if they don't exist
    await fs.ensureDir(destPublic);
    await fs.ensureDir(destStandalone);
    
    // Copy public directory to static/public
    console.log(`Copying from ${sourcePublic} to ${destPublic}`);
    await fs.copy(sourcePublic, destPublic, {
      overwrite: true,
      errorOnExist: false,
      recursive: true,
    });
    
    // Copy public directory to standalone/public for standalone output
    console.log(`Copying from ${sourcePublic} to ${destStandalone}`);
    await fs.copy(sourcePublic, destStandalone, {
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
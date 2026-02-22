const fs = require('fs-extra');
const path = require('path');

async function cleanupOldFiles(directory, maxAgeMinutes) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = await fs.stat(filePath);
      const fileAge = now - stat.mtime.getTime();
      
      if (fileAge > maxAge) {
        await fs.remove(filePath);
        console.log(`🗑️ Deleted old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = { cleanupOldFiles };
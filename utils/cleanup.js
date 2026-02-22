const fs = require('fs-extra');
const path = require('path');

/**
 * Clean up files older than specified minutes
 */
async function cleanupOldFiles(directory, maxAgeMinutes) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      const fileAge = now - stats.mtime.getTime();

      if (fileAge > maxAge) {
        await fs.remove(filePath);
        deletedCount++;
        console.log(`🗑️  Deleted old file: ${file}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleanup complete: ${deletedCount} files removed`);
    }

  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = {
  cleanupOldFiles
};

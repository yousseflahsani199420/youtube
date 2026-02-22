#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking System Requirements...\n');

let hasErrors = false;

// Check Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 16) {
    console.log('✅ Node.js:', nodeVersion);
  } else {
    console.log('❌ Node.js:', nodeVersion, '(Requires v16+)');
    hasErrors = true;
  }
} catch (error) {
  console.log('❌ Node.js: Not found');
  hasErrors = true;
}

// Check FFmpeg
try {
  const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
  console.log('✅ FFmpeg:', ffmpegVersion.split(' ')[2]);
} catch (error) {
  console.log('❌ FFmpeg: Not installed');
  hasErrors = true;
}

// Check disk space
try {
  const stats = fs.statSync('/');
  console.log('✅ Disk: Accessible');
} catch (error) {
  console.log('⚠️  Disk: Cannot check');
}

// Check if downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log('✅ Downloads directory: Created');
} else {
  console.log('✅ Downloads directory: Exists');
}

// Check environment file
const envFile = path.join(__dirname, '.env');
if (!fs.existsSync(envFile)) {
  console.log('⚠️  Environment file: Not found (copy .env.example to .env)');
} else {
  console.log('✅ Environment file: Exists');
}

console.log('\n' + (hasErrors ? '❌ Please fix the errors above before starting.' : '✅ All requirements met! Ready to start.'));
process.exit(hasErrors ? 1 : 0);

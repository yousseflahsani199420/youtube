const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');
const { getVideoInfo, downloadVideo } = require('../utils/youtube');
const cache = require('../utils/cache');

const downloadsDir = path.join(__dirname, '..', 'downloads');
fs.ensureDirSync(downloadsDir);

// Helper functions
function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

// POST /api/info
router.post('/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!isValidYouTubeUrl(url)) return res.status(400).json({ error: 'Invalid YouTube URL' });

    const cached = cache.get(url);
    if (cached) return res.json(cached);

    const info = await getVideoInfo(url);
    cache.set(url, info, 600);
    res.json(info);

  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ error: 'Failed to fetch video info', message: error.message });
  }
});

// POST /api/download
router.post('/download', async (req, res) => {
  try {
    const { url, quality, format } = req.body;
    
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!isValidYouTubeUrl(url)) return res.status(400).json({ error: 'Invalid YouTube URL' });

    const allowedFormats = ['mp4', 'mp3', 'webm'];
    const selectedFormat = format || 'mp4';
    if (!allowedFormats.includes(selectedFormat)) {
      return res.status(400).json({ error: 'Invalid format. Allowed: mp4, mp3, webm' });
    }

    const downloadId = uuidv4();
    const outputPath = path.join(downloadsDir, `${downloadId}.${selectedFormat}`);

    // Start download in background (don't await)
    downloadVideo({
      url,
      outputPath,
      format: selectedFormat,
      downloadId
    }).catch(err => {
      console.error('Background download error:', err);
    });

    // Return immediately with download ID
    res.json({
      success: true,
      downloadId,
      downloadUrl: `/api/file/${downloadId}`,
     expiresIn: '10 minutes'  // was '1 hour'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', message: error.message });
  }
});

// GET /api/file/:downloadId
router.get('/file/:downloadId', async (req, res) => {
  try {
    const { downloadId } = req.params;
    const files = await fs.readdir(downloadsDir);
    const file = files.find(f => f.startsWith(downloadId));
    
    if (!file) return res.status(404).json({ error: 'File not found or expired' });

    const filePath = path.join(downloadsDir, file);
    const stat = await fs.stat(filePath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    // Delete file after sending (with delay to ensure download starts)
    stream.on('close', () => {
      setTimeout(() => {
        fs.remove(filePath).catch(err => console.error('Failed to delete file:', err));
      }, 5000);
    });

  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// GET /api/progress/:downloadId
router.get('/progress/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const progress = global.downloadProgress?.[downloadId];
  
  if (!progress) return res.json({ status: 'unknown' });
  
  res.json(progress);
});

// GET /api/formats
router.get('/formats', (req, res) => {
  res.json({
    video: ['360p', '480p', '720p', '1080p'],
    audio: ['MP3']
  });
});

module.exports = router;
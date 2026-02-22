const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sanitize = require('sanitize-filename');
const path = require('path');
const fs = require('fs-extra');

const { getVideoInfo, downloadVideo } = require('../utils/youtube');
const cache = require('../utils/cache');

const downloadsDir = path.join(__dirname, '..', 'downloads');
fs.ensureDirSync(downloadsDir); // Ensure folder exists

// ----------------------- Helper -----------------------
function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

// Pick closest available video quality
function pickQuality(availableQualities, requestedQuality) {
  if (availableQualities.includes(requestedQuality)) return requestedQuality;
  return availableQualities[0] || '720p';
}

// ----------------------- Routes -----------------------

// POST /api/info
router.post('/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!isValidYouTubeUrl(url)) return res.status(400).json({ error: 'Invalid YouTube URL' });

    const cached = cache.get(url);
    if (cached) return res.json(cached);

    const info = await getVideoInfo(url);
    cache.set(url, info, 600); // cache 10 minutes
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

    const allowedFormats = ['mp4', 'mp3', 'webm', 'm4a'];
    const selectedFormat = format || 'mp4';
    if (!allowedFormats.includes(selectedFormat)) {
      return res.status(400).json({ error: 'Invalid format. Allowed: mp4, mp3, webm, m4a' });
    }

    // Get video info
    const info = await getVideoInfo(url);

    let finalQuality = quality || '720p';
    // Only pick quality for video downloads
    if (selectedFormat !== 'mp3' && selectedFormat !== 'm4a') {
      const availableQualities = info.formats.video.map(f => f.quality).filter(Boolean);
      finalQuality = pickQuality(availableQualities, finalQuality);
    }

    // Generate output path
    const downloadId = uuidv4();
    const safeTitle = sanitize(info.title);
    const outputPath = path.join(downloadsDir, `${downloadId}.${selectedFormat}`);

    // Start download
    const downloadInfo = await downloadVideo({
      url,
      outputPath,
      quality: finalQuality,
      format: selectedFormat,
      downloadId
    });

    res.json({
      success: true,
      downloadId,
      downloadUrl: `/api/file/${downloadId}`,
      filename: downloadInfo.filename,
      expiresIn: '1 hour'
    });

  } catch (error) {
    console.error('Download route error:', error);
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

    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('File download error:', error);
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
    video: [
      { format: 'mp4', qualities: ['360p','480p','720p','1080p','1440p','2160p'], description: 'Best compatibility' },
      { format: 'webm', qualities: ['720p','1080p','1440p','2160p'], description: 'Better compression' }
    ],
    audio: [
      { format: 'mp3', qualities: ['64kbps','128kbps','192kbps','256kbps','320kbps'], description: 'Most compatible' },
      { format: 'm4a', qualities: ['128kbps','256kbps'], description: 'Apple devices' }
    ]
  });
});

module.exports = router;
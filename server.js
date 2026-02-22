// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const downloadRoutes = require('./routes/download');
const { cleanupOldFiles } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3000; // Use Render-assigned PORT

// ---------------- SECURITY ----------------
app.use(helmet({ contentSecurityPolicy: false }));

// ---------------- CORS ----------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------------- RATE LIMIT ----------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ---------------- BODY PARSER ----------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------- DOWNLOADS DIRECTORY ----------------
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);

// Serve downloads statically
app.use('/downloads', express.static(downloadsDir, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// ---------------- HEALTH CHECK ----------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ---------------- ROUTES ----------------
app.use('/api', downloadRoutes);

// ---------------- FRONTEND ----------------
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---------------- 404 HANDLER ----------------
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ---------------- START SERVER ----------------
const server = app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API running on port ${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Prevent crash on port errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// ---------------- CLEANUP OLD FILES ----------------
setInterval(() => cleanupOldFiles(downloadsDir, 5), 5 * 60 * 1000);

module.exports = app;
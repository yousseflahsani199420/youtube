const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const downloadRoutes = require('./routes/download');
const { cleanupOldFiles } = require('./utils/cleanup');

const app = express();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// prevent crash on render
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));



// CORS - allow frontend domain
app.use(cors({
  origin: '*',
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15*60*1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Downloads directory
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname,'downloads');
fs.ensureDirSync(downloadsDir);

// Serve downloads statically
app.use('/downloads', express.static(downloadsDir, {
  maxAge: '1h',
  setHeaders: (res, path) => { res.setHeader('Content-Disposition','attachment'); }
}));

// Health check
app.get('/api/health', (req,res) => {
  res.json({ status:'OK', timestamp: new Date().toISOString(), version:'1.0.0' });
});

// Routes
app.use('/api', downloadRoutes);

// Error handling
app.use((err, req,res,next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error:'Internal server error',
    message: process.env.NODE_ENV==='development'? err.message : 'Something went wrong'
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname,'public')));
app.get('/', (req,res) => { res.sendFile(path.join(__dirname,'public','index.html')); });

// 404
app.use((req,res)=>res.status(404).json({ error:'Endpoint not found' }));

// Start server
app.listen(PORT, ()=> {
  console.log(`🚀 YouTube Downloader API running on port ${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV||'development'}`);
});

// Cleanup old files every 30 mins
setInterval(()=>cleanupOldFiles(downloadsDir,5),5*60*1000);
module.exports = app;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const downloadRoutes = require('./routes/download');
const { cleanupOldFiles } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3000; // <--- define PORT here

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));

// Rate limiter
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Downloads folder
const downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);
app.use('/downloads', express.static(downloadsDir));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Routes
app.use('/api', downloadRoutes);

// Frontend
app.use(express.static(path.join(__dirname,'public')));
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

// 404
app.use((req,res) => res.status(404).json({ error:'Endpoint not found' }));

// Error handler
app.use((err, req,res,next) => {
  console.error(err);
  res.status(500).json({ error:'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Cleanup old files every 5 mins
setInterval(() => cleanupOldFiles(downloadsDir, 5), 5*60*1000);

module.exports = app;
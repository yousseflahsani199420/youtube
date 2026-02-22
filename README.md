# YouTube Downloader - Full Stack Application

A complete YouTube video and audio downloader with modern web interface and powerful Node.js backend.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Core Features
- ✅ **Video Downloads** - MP4, WEBM formats (360p to 4K)
- ✅ **Audio Extraction** - MP3, M4A formats (up to 320kbps)
- ✅ **No Watermark** - Clean downloads
- ✅ **Fast Processing** - Optimized servers
- ✅ **Progress Tracking** - Real-time download progress
- ✅ **Batch Info** - Get video details before downloading

### Security & Performance
- 🔒 Rate limiting (50 requests per 15 minutes)
- 🛡️ Helmet.js security headers
- 🌐 CORS protection
- 💾 In-memory caching (10 min TTL)
- 🗑️ Automatic file cleanup (60 min)
- 📊 Health check endpoint

### Frontend Features
- 📱 Fully responsive design
- 🎨 Modern UI with animations
- ⚡ Real-time progress bar
- 🎯 Format selection (Video/Audio tabs)
- 💡 URL shortcut tip (like Y2Mate)
- 🔍 Video preview with thumbnail

## 📁 Project Structure

```
youtube-downloader-backend/
├── server.js                 # Main entry point
├── package.json              # Dependencies
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── README.md                 # This file
├── INSTALL.md                # Detailed installation guide
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose setup
├── deploy.sh                 # Automated deployment script
├── nginx.conf                # Nginx reverse proxy config
├── ecosystem.config.js       # PM2 configuration
├── check-requirements.js     # System requirements check
├── test.js                   # API test script
├── routes/
│   └── download.js           # API routes
├── utils/
│   ├── youtube.js            # YouTube extraction logic
│   ├── cache.js              # Caching utilities
│   └── cleanup.js            # File cleanup utilities
├── middleware/
│   └── (empty)               # Custom middleware
└── public/
    └── index.html            # Frontend application
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- FFmpeg installed
- 2GB RAM minimum

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Install FFmpeg:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Check requirements:**
```bash
node check-requirements.js
```

5. **Start server:**
```bash
npm start
```

6. **Test API:**
```bash
node test.js
```

## 📡 API Endpoints

### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Get Video Info
```http
POST /api/info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "id": "VIDEO_ID",
  "title": "Video Title",
  "description": "Video description...",
  "duration": "10:30",
  "durationSeconds": 630,
  "thumbnail": "https://i.ytimg.com/vi/...",
  "author": {
    "name": "Channel Name",
    "channelUrl": "https://www.youtube.com/channel/..."
  },
  "viewCount": "1000000",
  "qualities": ["360p", "720p", "1080p"],
  "formats": {
    "video": [...],
    "audio": [...]
  }
}
```

### 3. Start Download
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "720p",
  "format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "downloadId": "uuid-string",
  "downloadUrl": "/api/file/uuid-string",
  "filename": "Video Title.mp4",
  "expiresIn": "1 hour"
}
```

### 4. Download File
```http
GET /api/file/:downloadId
```

### 5. Check Progress
```http
GET /api/progress/:downloadId
```

**Response:**
```json
{
  "status": "downloading",
  "progress": 45,
  "downloaded": 24576000,
  "total": 52428800
}
```

### 6. Get Supported Formats
```http
GET /api/formats
```

## 🏗️ Deployment Options

### Option 1: Docker (Recommended)
```bash
docker-compose up -d --build
```

### Option 2: PM2 (Production)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Automated Script (Ubuntu/Debian)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 4: Manual Setup
See [INSTALL.md](INSTALL.md) for detailed instructions.

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `FRONTEND_URL` | * | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 50 | Max requests per window |
| `CLEANUP_INTERVAL_MINUTES` | 30 | Cleanup interval |
| `FILE_MAX_AGE_MINUTES` | 60 | File expiration time |

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/youtube-downloader/public;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

## 🔒 Security Considerations

1. **Rate Limiting** - Prevents abuse (50 req/15min per IP)
2. **Input Validation** - URL validation and sanitization
3. **Helmet.js** - Security headers
4. **CORS** - Configurable origin whitelist
5. **File Cleanup** - Automatic deletion of old files
6. **No Storage** - Files not stored permanently

## ⚠️ Legal Notice

This tool is for **educational purposes only**. 

- Downloading copyrighted content without permission violates YouTube's Terms of Service
- Users are responsible for complying with local copyright laws
- Only download content you own or have permission to download
- Respect content creators' rights

## 🐛 Troubleshooting

### Common Issues

**FFmpeg not found:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

**Port already in use:**
```bash
# Change port in .env
PORT=3001
```

**Permission denied:**
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/youtube-downloader
```

**Downloads failing:**
- Check disk space: `df -h`
- Check logs: `pm2 logs`
- Verify FFmpeg installation

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status              # View status
pm2 logs                # View logs
pm2 monit               # Monitor resources
pm2 reload all          # Reload all apps
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube video downloader
- [FFmpeg](https://ffmpeg.org/) - Video/audio processing
- [Express.js](https://expressjs.com/) - Web framework
- [PM2](https://pm2.keymetrics.io/) - Process manager

---

**Made with ❤️ for educational purposes**

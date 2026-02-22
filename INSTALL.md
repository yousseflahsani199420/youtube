# Installation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install FFmpeg
Ubuntu/Debian:
```bash
sudo apt install ffmpeg
```

macOS:
```bash
brew install ffmpeg
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env file
```

### 4. Start Server
```bash
npm start
```

Server runs on http://localhost:3000

## Production Deployment

### Using Docker
```bash
docker-compose up -d
```

### Using PM2
```bash
npm install -g pm2
pm2 start server.js
```

## API Endpoints

- POST /api/info - Get video info
- POST /api/download - Start download
- GET /api/file/:id - Download file
- GET /api/progress/:id - Check progress

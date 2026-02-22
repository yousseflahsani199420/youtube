#!/bin/bash

echo "🚀 YouTube Downloader Deployment Script"
echo "========================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
echo "📦 Installing FFmpeg..."
sudo apt install -y ffmpeg

# Verify installations
echo "✅ Verifying installations..."
node --version
npm --version
ffmpeg -version | head -1

# Create app directory
echo "📁 Setting up application directory..."
APP_DIR="/var/www/youtube-downloader"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy files (assuming you're in the project directory)
echo "📂 Copying application files..."
cp -r * $APP_DIR/
cd $APP_DIR

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create downloads directory
mkdir -p downloads

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration"
fi

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Start application with PM2
echo "🚀 Starting application..."
pm2 start server.js --name "youtube-downloader"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application running on http://localhost:3000"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs youtube-downloader"

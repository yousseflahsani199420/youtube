#!/bin/bash
# Install ffmpeg on Render
curl -L -o /tmp/ffmpeg-release.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz
tar -xJf /tmp/ffmpeg-release.tar.xz -C /tmp
cp /tmp/ffmpeg-*/ffmpeg /usr/local/bin/
cp /tmp/ffmpeg-*/ffprobe /usr/local/bin/
chmod +x /usr/local/bin/ffmpeg
chmod +x /usr/local/bin/ffprobe
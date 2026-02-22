const ytdl = require('@distube/ytdl-core');
const fs = require('fs-extra');
const sanitize = require('sanitize-filename');

// Remove duplicate: const ytdl = require('@distube/ytdl-core');

// Set user agent to avoid 403
const agent = ytdl.createAgent([
  {
    domain: "youtube.com",
    expirationDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
    hostOnly: false,
    httpOnly: false,
    name: "CONSENT",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    value: "YES+ES.en+20190818-16-0"
  }
]);
if (!global.downloadProgress) global.downloadProgress = {};

async function getVideoInfo(url) {
  try {
    // ADD AGENT HERE - Line 28
    const info = await ytdl.getInfo(url, { agent });
    const videoDetails = info.videoDetails;
    
    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    
    const audioFormats = info.formats
      .filter(f => !f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    return {
      id: videoDetails.videoId,
      title: sanitize(videoDetails.title),
      duration: formatDuration(videoDetails.lengthSeconds),
      thumbnail: videoDetails.thumbnails.pop()?.url,
      author: videoDetails.author?.name || 'Unknown',
      viewCount: videoDetails.viewCount,
      formats: {
        video: videoFormats.map(f => ({
          itag: f.itag,
          quality: f.qualityLabel,
          container: f.container,
          height: f.height
        })),
        audio: audioFormats.map(f => ({
          itag: f.itag,
          audioBitrate: f.audioBitrate,
          container: f.container
        }))
      }
    };
  } catch (err) {
    console.error('Info error:', err);
    throw err;
  }
}

async function downloadVideo({ url, outputPath, format, downloadId }) {
  return new Promise(async (resolve, reject) => {
    try {
      global.downloadProgress[downloadId] = {
        status: 'starting',
        progress: 0,
        downloaded: 0,
        total: 0
      };

      // ADD AGENT HERE - Line 75
      const info = await ytdl.getInfo(url, { agent });
      const title = sanitize(info.videoDetails.title);

      let selectedFormat;

      if (format === 'mp3' || format === 'm4a') {
        selectedFormat = ytdl.chooseFormat(info.formats, { 
          quality: 'highestaudio',
          filter: 'audioonly'
        });
      } else {
        selectedFormat = ytdl.chooseFormat(info.formats, { 
          quality: 'highest',
          filter: 'audioandvideo'
        });
      }

      if (!selectedFormat) {
        throw new Error('No suitable format found');
      }

      global.downloadProgress[downloadId] = {
        status: 'downloading',
        progress: 0,
        downloaded: 0,
        total: parseInt(selectedFormat.contentLength) || 0
      };

      // ADD AGENT HERE - Line 102
      const stream = ytdl(url, { 
        format: selectedFormat,
        agent: agent,  // <-- ADD THIS
        highWaterMark: 1024 * 1024
      });

      const writeStream = fs.createWriteStream(outputPath);

      let downloadedBytes = 0;
      const totalBytes = parseInt(selectedFormat.contentLength) || 0;

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 
          ? Math.round((downloadedBytes / totalBytes) * 100) 
          : Math.min(Math.round((downloadedBytes / (1024 * 1024)) * 10), 99);
        
        global.downloadProgress[downloadId] = {
          status: 'downloading',
          progress: progress,
          downloaded: downloadedBytes,
          total: totalBytes
        };
      });

      stream.on('error', (err) => {
        global.downloadProgress[downloadId].status = 'error';
        writeStream.destroy();
        reject(err);
      });

      writeStream.on('finish', () => {
        global.downloadProgress[downloadId] = {
          status: 'completed',
          progress: 100,
          downloaded: downloadedBytes,
          total: totalBytes
        };
        resolve({ 
          path: outputPath,
          filename: `${title}.${format}`
        });
      });

      writeStream.on('error', (err) => {
        global.downloadProgress[downloadId].status = 'error';
        reject(err);
      });

      stream.pipe(writeStream);

    } catch(err) {
      global.downloadProgress[downloadId] = {
        status: 'error',
        error: err.message
      };
      reject(err);
    }
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = { getVideoInfo, downloadVideo };
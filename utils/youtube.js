// utils/youtube.js
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');

// ---------------- FFMPEG PATH SETUP ----------------
let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
let ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ---------------- GLOBAL DOWNLOAD PROGRESS ----------------
if (!global.downloadProgress) {
  global.downloadProgress = {};
}

// ---------------- HELPER: FORMAT DURATION ----------------
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0
    ? `${hrs}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
    : `${mins}:${secs.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// ---------------- GET VIDEO INFO ----------------
async function getVideoInfo(url) {
  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .sort((a,b) => (b.height || 0) - (a.height || 0));

    const audioFormats = info.formats
      .filter(f => !f.hasVideo && f.hasAudio)
      .sort((a,b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    const qualities = [...new Set(videoFormats.map(f => f.qualityLabel))].filter(Boolean);

    return {
      id: videoDetails.videoId,
      title: sanitize(videoDetails.title),
      description: videoDetails.description?.substring(0,200)+'...',
      duration: formatDuration(videoDetails.lengthSeconds),
      durationSeconds: parseInt(videoDetails.lengthSeconds),
      thumbnail: videoDetails.thumbnails.pop()?.url,
      author: {
        name: videoDetails.author.name,
        channelUrl: videoDetails.author.channel_url
      },
      viewCount: videoDetails.viewCount,
      publishDate: videoDetails.publishDate,
      qualities,
      formats: {
        video: videoFormats.slice(0,10),
        audio: audioFormats.slice(0,5)
      }
    };
  } catch (err) {
    console.error('Info error:', err);
    throw new Error('Failed to fetch video info');
  }
}

// ---------------- DOWNLOAD VIDEO OR AUDIO ----------------
async function downloadVideo({ url, outputPath, format, downloadId }) {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await ytdl.getInfo(url);
      const title = sanitize(info.videoDetails.title);

      global.downloadProgress[downloadId] = {
        status: 'starting',
        progress: 0,
        downloaded: 0,
        total: 0,
        startTime: Date.now()
      };

      let selectedFormat;
      if (format === 'mp3' || format === 'm4a') {
        selectedFormat = info.formats
          .filter(f => !f.hasVideo && f.hasAudio)
          .sort((a,b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      } else {
        selectedFormat = info.formats
          .filter(f => f.hasVideo && f.hasAudio)
          .sort((a,b) => (b.height || 0) - (a.height || 0))[0];
      }

      if (!selectedFormat) return reject(new Error('No suitable format found'));

      const streamOptions = { format: selectedFormat, highWaterMark: 1024*1024*2 };
      const videoStream = ytdl(url, streamOptions);

      let downloadedBytes = 0;
      const totalBytes = parseInt(selectedFormat.contentLength) || 0;

      videoStream.on('data', chunk => {
        downloadedBytes += chunk.length;
        const progress = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
        global.downloadProgress[downloadId] = {
          ...global.downloadProgress[downloadId],
          status: 'downloading',
          progress: Math.min(progress, 100),
          downloaded: downloadedBytes,
          total: totalBytes
        };
      });

      videoStream.on('error', err => {
        global.downloadProgress[downloadId].status = 'error';
        reject(new Error(`Download failed: ${err.message}`));
      });

      if (format === 'mp3' || format === 'm4a') {
        global.downloadProgress[downloadId].status = 'converting';
        ffmpeg(videoStream)
          .toFormat(format)
          .audioBitrate(format === 'mp3' ? 192 : 256)
          .on('progress', p => {
            global.downloadProgress[downloadId].convertProgress = Math.round(p.percent);
          })
          .on('end', () => {
            global.downloadProgress[downloadId].status = 'completed';
            global.downloadProgress[downloadId].progress = 100;
            resolve({ filename: `${title}.${format}`, path: outputPath });
          })
          .on('error', err => {
            global.downloadProgress[downloadId].status = 'error';
            reject(new Error(`Audio conversion failed: ${err.message}`));
          })
          .save(outputPath);
      } else {
        const writeStream = fs.createWriteStream(outputPath);
        videoStream.pipe(writeStream);
        writeStream.on('finish', () => {
          global.downloadProgress[downloadId].status = 'completed';
          global.downloadProgress[downloadId].progress = 100;
          resolve({ filename: `${title}.${format}`, path: outputPath });
        });
        writeStream.on('error', err => {
          global.downloadProgress[downloadId].status = 'error';
          reject(new Error(`Write failed: ${err.message}`));
        });
      }
    } catch (err) {
      if (global.downloadProgress[downloadId]) global.downloadProgress[downloadId].status = 'error';
      reject(err);
    }
  });
}

module.exports = { getVideoInfo, downloadVideo };
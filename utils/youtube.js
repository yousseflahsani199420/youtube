// utils/youtube.js
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');

// -------------------- FFMPEG SETUP --------------------
let ffmpegPath = process.env.FFMPEG_PATH || null;
let ffprobePath = process.env.FFPROBE_PATH || null;

// For Render / Unix
if (!ffmpegPath) ffmpegPath = process.platform === 'win32' ? 'ffmpeg' : '/usr/local/bin/ffmpeg';
if (!ffprobePath) ffprobePath = process.platform === 'win32' ? 'ffprobe' : '/usr/local/bin/ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// -------------------- GLOBAL DOWNLOAD PROGRESS --------------------
if (!global.downloadProgress) global.downloadProgress = {};

// -------------------- HELPER --------------------
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0
    ? `${hrs}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
    : `${mins}:${secs.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// -------------------- GET VIDEO INFO --------------------
async function getVideoInfo(url) {
  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    const audioFormats = info.formats
      .filter(f => !f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    const qualities = [...new Set(videoFormats.map(f => f.qualityLabel))].filter(Boolean);

    return {
      id: videoDetails.videoId,
      title: sanitize(videoDetails.title),
      description: videoDetails.description?.substring(0,200) + '...',
      duration: formatDuration(videoDetails.lengthSeconds),
      durationSeconds: parseInt(videoDetails.lengthSeconds),
      thumbnail: videoDetails.thumbnails.pop()?.url,
      author: { name: videoDetails.author.name, channelUrl: videoDetails.author.channel_url },
      viewCount: videoDetails.viewCount,
      publishDate: videoDetails.publishDate,
      qualities,
      formats: { video: videoFormats.slice(0,10), audio: audioFormats.slice(0,5) }
    };
  } catch (err) {
    throw new Error(`Failed to get video info: ${err.message}`);
  }
}

// -------------------- DOWNLOAD VIDEO / AUDIO --------------------
async function downloadVideo({ url, outputPath, format='mp4', downloadId }) {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await ytdl.getInfo(url);
      const title = sanitize(info.videoDetails.title);

      global.downloadProgress[downloadId] = { status: 'starting', progress: 0 };

      // Choose format
      let selectedFormat;
      if (format === 'mp3' || format === 'm4a') {
        selectedFormat = info.formats
          .filter(f => !f.hasVideo && f.hasAudio)
          .sort((a,b) => (b.audioBitrate||0)-(a.audioBitrate||0))[0];
      } else {
        selectedFormat = info.formats
          .filter(f => f.hasVideo && f.hasAudio)
          .sort((a,b) => (b.height||0)-(a.height||0))[0];
      }

      if (!selectedFormat) return reject(new Error('No suitable format found'));

      const streamOptions = { format: selectedFormat, highWaterMark: 1 << 25 };
      const videoStream = ytdl(url, streamOptions);

      if (format === 'mp3' || format === 'm4a') {
        global.downloadProgress[downloadId].status = 'converting';

        ffmpeg(videoStream)
          .toFormat(format)
          .audioBitrate(format==='mp3'?192:256)
          .on('progress', p => {
            global.downloadProgress[downloadId].progress = Math.round(p.percent || 0);
          })
          .on('end', () => {
            global.downloadProgress[downloadId].status = 'completed';
            global.downloadProgress[downloadId].progress = 100;
            resolve({ filename: `${title}.${format}`, path: outputPath });
          })
          .on('error', err => {
            global.downloadProgress[downloadId].status = 'error';
            reject(new Error(`Conversion failed: ${err.message}`));
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

      videoStream.on('error', err => {
        global.downloadProgress[downloadId].status = 'error';
        reject(new Error(`Stream failed: ${err.message}`));
      });

    } catch (err) {
      if (global.downloadProgress[downloadId]) global.downloadProgress[downloadId].status='error';
      reject(err);
    }
  });
}

module.exports = { getVideoInfo, downloadVideo };
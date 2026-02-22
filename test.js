const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

console.log('🧪 Testing YouTube Downloader API...\n');
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

async function runTests() {
  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is running:', health.data.status);
    console.log();

    // Test 2: Get video info
    console.log('Test 2: Get Video Info');
    const info = await axios.post(`${API_URL}/info`, { url: TEST_VIDEO });
    console.log('✅ Video title:', info.data.title.substring(0, 50) + '...');
    console.log('✅ Duration:', info.data.duration);
    console.log('✅ Qualities available:', info.data.qualities?.length || 0);
    console.log();

    // Test 3: Get formats
    console.log('Test 3: Get Supported Formats');
    const formats = await axios.get(`${API_URL}/formats`);
    console.log('✅ Video formats:', formats.data.video.length);
    console.log('✅ Audio formats:', formats.data.audio.length);
    console.log();

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();

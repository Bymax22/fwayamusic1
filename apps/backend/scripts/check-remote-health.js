const https = require('https');
https.get('https://fwayamusic1-backend.vercel.app/health', res => {
  console.log('status', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => {
  console.error('error', err.message);
  process.exit(1);
});

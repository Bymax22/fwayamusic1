const https = require('https');
const urls = [
  'https://fwaya.net/track/i-am-a-winner-22',
  'https://fwaya.net/track/come-back-home-13'
];
const apiUrls = [
  'https://fwaya.net/api/v1/media/22',
  'https://fwaya.net/api/v1/media/13'
];
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}
(async () => {
  for (const url of urls) {
    const res = await fetch(url);
    console.log('PAGE', url, 'status', res.status);
    const head = res.body.split('</head>')[0];
    const regex = /(<title[^>]*>.*?<\/title>|<meta[^>]+(?:og:|twitter:|canonical)[^>]*>)/gi;
    let match;
    while ((match = regex.exec(head))) {
      console.log(match[1]);
    }
    console.log('---');
  }
  for (const apiUrl of apiUrls) {
    const res = await fetch(apiUrl);
    console.log('API', apiUrl, 'status', res.status);
    console.log(res.body);
    console.log('---');
  }
})();

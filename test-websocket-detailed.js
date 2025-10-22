const http = require('http');

console.log('Testing WebSocket upgrade request...');

const options = {
  hostname: 'localhost',
  port: 10112,
  path: '/ws?token=6760298907&type=notifications',
  method: 'GET',
  headers: {
    'Connection': 'Upgrade',
    'Upgrade': 'websocket',
    'Sec-WebSocket-Version': '13',
    'Sec-WebSocket-Key': 'x3JJHMbDL1EzLkh9GBhXDw==',
    'Origin': 'http://localhost:5173'
  }
};

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);

  res.on('data', (chunk) => {
    console.log('Response body:', chunk.toString());
  });

  res.on('end', () => {
    console.log('Response ended');
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.end();

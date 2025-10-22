const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:10112/ws?token=6760298907&type=notifications');

ws.on('open', function open() {
  console.log('✅ WebSocket connection established successfully!');
  console.log('Connection ready state:', ws.readyState);

  // Send a test message
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket closed:', code, reason.toString());
});

// Close connection after 5 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 5000);

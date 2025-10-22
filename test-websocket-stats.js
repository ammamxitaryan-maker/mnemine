const WebSocket = require('ws');

console.log('Connecting to WebSocket server...');

// Use the same connection pattern as the client
const ws = new WebSocket('ws://localhost:10112/ws?type=userstats&token=anonymous');

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
  console.log('Waiting for user statistics...');
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.type === 'user_stats_update' || parsed.type === 'userStats') {
      console.log('\n=== USER STATISTICS ===');
      console.log('Total Users:', parsed.data.totalUsers?.toLocaleString() || 'N/A');
      console.log('Online Users:', parsed.data.onlineUsers?.toLocaleString() || 'N/A');
      console.log('New Users Today:', parsed.data.newUsersToday?.toLocaleString() || 'N/A');
      console.log('Active Users:', parsed.data.activeUsers?.toLocaleString() || 'N/A');
      console.log('Last Update:', parsed.data.lastUpdate || 'N/A');
      console.log('Is Fictitious:', parsed.data.isFictitious || 'N/A');
      console.log('Data Source:', parsed.data.dataSource || 'N/A');
      console.log('========================\n');
      
      // Close connection after getting stats
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 1000);
    }
  } catch (error) {
    console.log('Received message:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Timeout - closing connection');
  ws.close();
  process.exit(1);
}, 10000);

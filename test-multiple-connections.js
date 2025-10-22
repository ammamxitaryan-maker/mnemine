const WebSocket = require('ws');

console.log('Testing multiple WebSocket connections...');

// Create multiple connections
const connections = [];
const connectionCount = 3;

for (let i = 0; i < connectionCount; i++) {
  const ws = new WebSocket(`ws://localhost:10112/ws?type=userstats&token=anonymous_${i}`);
  
  ws.on('open', function open() {
    console.log(`Connection ${i + 1} connected`);
  });

  ws.on('message', function message(data) {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'userStats' || parsed.type === 'user_stats_update') {
        console.log(`\n=== CONNECTION ${i + 1} - USER STATISTICS ===`);
        console.log('Total Users:', parsed.data.totalUsers?.toLocaleString() || 'N/A');
        console.log('Online Users:', parsed.data.onlineUsers?.toLocaleString() || 'N/A');
        console.log('New Users Today:', parsed.data.newUsersToday?.toLocaleString() || 'N/A');
        console.log('Active Users:', parsed.data.activeUsers?.toLocaleString() || 'N/A');
        console.log('Last Update:', parsed.data.lastUpdate || 'N/A');
        console.log('Is Fictitious:', parsed.data.isFictitious || 'N/A');
        console.log('Data Source:', parsed.data.dataSource || 'N/A');
        console.log('==========================================\n');
      }
    } catch (error) {
      console.log(`Connection ${i + 1} received message:`, data.toString());
    }
  });

  ws.on('error', function error(err) {
    console.error(`Connection ${i + 1} error:`, err);
  });

  ws.on('close', function close() {
    console.log(`Connection ${i + 1} closed`);
  });

  connections.push(ws);
}

// Wait for all connections to establish and receive data
setTimeout(() => {
  console.log('\nClosing all connections...');
  connections.forEach(ws => ws.close());
  process.exit(0);
}, 10000);


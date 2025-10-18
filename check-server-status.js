const axios = require('axios');

async function checkServerStatus() {
  try {
    console.log('🔍 Checking server status...\n');

    // Check if server is running
    const healthCheck = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running');
    console.log(`   Status: ${healthCheck.data.status}`);
    console.log(`   Timestamp: ${healthCheck.data.timestamp}`);

    // Check admin endpoint
    try {
      const adminCheck = await axios.get('http://localhost:3001/api/admin/users?page=1&limit=1');
      console.log('✅ Admin endpoint is accessible');
      console.log(`   Users found: ${adminCheck.data.data?.users?.length || 0}`);
    } catch (adminError) {
      console.log('⚠️  Admin endpoint requires authentication');
    }

    // Check user data endpoint
    try {
      const userDataCheck = await axios.get('http://localhost:3001/api/user/test/data');
      console.log('✅ User data endpoint is accessible');
    } catch (userError) {
      console.log('⚠️  User data endpoint requires valid telegramId');
    }

    console.log('\n🎯 Server is ready for testing!');
    console.log('   Run: node test-final-balance-sync.js');

  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.log('   Please start the server with: npm run dev');
    console.log('   Error:', error.message);
  }
}

checkServerStatus();

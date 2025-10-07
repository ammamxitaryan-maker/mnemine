const axios = require('axios');

async function testDeleteUser() {
  try {
    // Mock Telegram init data for admin user
    const mockTelegramData = 'user=%7B%22id%22%3A6760298907%2C%22first_name%22%3A%22Admin%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22admin_test%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-123456789&chat_type=private&auth_date=1234567890&hash=mock_hash_for_testing';
    
    // First, let's get the list of users to find a user ID to delete
    console.log('Getting users list...');
    const usersResponse = await axios.get('http://localhost:10112/api/admin/users', {
      headers: {
        'x-telegram-init-data': mockTelegramData,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Users response status:', usersResponse.status);
    console.log('Users found:', usersResponse.data.data.users.length);
    
    if (usersResponse.data.data.users.length > 0) {
      const testUser = usersResponse.data.data.users[0];
      console.log('Test user ID:', testUser.id);
      console.log('Test user name:', testUser.firstName || testUser.username);
      
      // Now try to delete the user
      console.log('\nAttempting to delete user...');
      const deleteResponse = await axios.delete(`http://localhost:10112/api/admin/delete-user/${testUser.id}`, {
        headers: {
          'x-telegram-init-data': mockTelegramData,
          'Content-Type': 'application/json'
        },
        data: {
          reason: 'Test deletion',
          adminId: '6760298907'
        }
      });
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response:', deleteResponse.data);
    } else {
      console.log('No users found to delete');
    }
    
  } catch (error) {
    console.error('Error testing delete user:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testDeleteUser();

import React, { useState } from 'react';

interface TestUser {
  id: number;
  telegramId: string;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
}

const TEST_USERS: TestUser[] = [
  {
    id: 123456789,
    telegramId: '123456789',
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en'
  },
  {
    id: 987654321,
    telegramId: '987654321',
    first_name: 'Admin',
    last_name: 'User',
    username: 'adminuser',
    language_code: 'en'
  },
  {
    id: 555666777,
    telegramId: '555666777',
    first_name: 'Regular',
    last_name: 'User',
    username: 'regularuser',
    language_code: 'ru'
  }
];

export const LocalDevAuth: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<TestUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Only show in local development
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isLocalDev) {
    return null;
  }

  const handleUserSelect = (user: TestUser) => {
    localStorage.setItem('testUser', JSON.stringify(user));
    setSelectedUser(user);
    setIsOpen(false);
    
    // Reload the page to apply new user
    window.location.reload();
  };

  const handleCustomUser = () => {
    const customId = prompt('Enter custom Telegram ID:');
    if (customId) {
      const customUser: TestUser = {
        id: parseInt(customId),
        telegramId: customId,
        first_name: 'Custom',
        last_name: 'User',
        username: `user${customId}`,
        language_code: 'en'
      };
      handleUserSelect(customUser);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
      >
        🔧 Dev Auth
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 min-w-[250px] max-w-[300px]">
          <h3 className="text-white font-semibold mb-3">Switch Test User</h3>
          
          <div className="space-y-2">
            {TEST_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
              >
                <div className="font-medium">{user.first_name} {user.last_name}</div>
                <div className="text-gray-400 text-xs">@{user.username} (ID: {user.id})</div>
              </button>
            ))}
            
            <button
              onClick={handleCustomUser}
              className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm border-t border-gray-600 mt-2 pt-2"
            >
              + Custom User ID
            </button>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <button
              onClick={() => {
                localStorage.removeItem('testUser');
                window.location.reload();
              }}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Reset User
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


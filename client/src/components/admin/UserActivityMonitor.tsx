import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
  lastSeen: string;
}

const UserActivityMonitor: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Симуляция загрузки данных
    const timer = setTimeout(() => {
      setActiveUsers([
        {
          id: '1',
          telegramId: '123456789',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          isActive: true,
          lastSeen: '2 минуты назад'
        },
        {
          id: '2',
          telegramId: '987654321',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
          isActive: true,
          lastSeen: '5 минут назад'
        }
      ]);

      setInactiveUsers([
        {
          id: '3',
          telegramId: '555666777',
          firstName: 'Bob',
          lastName: 'Johnson',
          username: 'bobjohnson',
          isActive: false,
          lastSeen: '2 дня назад'
        }
      ]);

      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFreezeAccounts = async () => {
    // Симуляция заморозки аккаунтов
    console.log('Freezing inactive accounts...');
  };

  const handleAutoFreeze = async () => {
    // Симуляция автоматической заморозки
    console.log('Auto-freezing inactive accounts...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка данных активности...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Активные пользователи ({activeUsers.length})
          </h3>
          
          <div className="space-y-3">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • {user.lastSeen}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-green-600 font-medium">
                  АКТИВЕН
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Неактивные пользователи ({inactiveUsers.length})
          </h3>
          
          <div className="space-y-3">
            {inactiveUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✗</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • {user.lastSeen}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-red-600 font-medium">
                  НЕАКТИВЕН
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Действия
          </h3>
          
          <div className="flex space-x-4">
            <button
              onClick={handleFreezeAccounts}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              Заморозить неактивных
            </button>
            <button
              onClick={handleAutoFreeze}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Автозаморозка
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityMonitor;
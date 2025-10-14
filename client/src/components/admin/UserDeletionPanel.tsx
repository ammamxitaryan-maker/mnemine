import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
}

const UserDeletionPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Симуляция загрузки пользователей
    const timer = setTimeout(() => {
      setUsers([
        {
          id: '1',
          telegramId: '123456789',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          isActive: true
        },
        {
          id: '2',
          telegramId: '987654321',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
          isActive: false
        }
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    
    // Симуляция удаления
    setTimeout(() => {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setIsDeleting(false);
    }, 1000);
  };

  const cancelDelete = () => {
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Управление пользователями
        </h3>
        
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {user.firstName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • ID: {user.telegramId}
                    </div>
                    <div className="text-xs text-gray-400">
                      Статус: {user.isActive ? 'Активный' : 'Неактивный'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => handleDeleteUser(user)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>

        {userToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Подтверждение удаления
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Вы уверены, что хотите удалить пользователя {userToDelete.firstName} {userToDelete.lastName}?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={cancelDelete}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {isDeleting ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDeletionPanel;
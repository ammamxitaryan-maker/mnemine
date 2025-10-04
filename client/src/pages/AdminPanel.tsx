import React, { useState, useEffect } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface AdminAuth {
  isAdmin: boolean;
  telegramId: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useTelegramAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      // Проверяем, есть ли админ токен в localStorage
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        // Для простоты, считаем токен валидным если он есть
        setAdminAuth({
          isAdmin: true,
          telegramId: user?.telegramId || 'unknown'
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking admin auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Простая проверка пароля
      if (password === 'admin123') {
        const token = 'admin_token_' + Date.now();
        localStorage.setItem('adminToken', token);
        setAdminAuth({
          isAdmin: true,
          telegramId: user?.telegramId || 'unknown'
        });
        setIsAuthenticated(true);
      } else {
        setError('Неверный пароль');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ошибка входа');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminAuth(null);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Админ панель
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите пароль для входа
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Пароль
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Введите пароль"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Админ панель
              </h1>
              <p className="text-gray-600 mb-4">
                Добро пожаловать, {adminAuth?.telegramId}!
              </p>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
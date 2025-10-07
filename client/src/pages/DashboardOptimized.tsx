import React, { Suspense, lazy, useMemo } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { useWebSocketOptimized } from '../hooks/useWebSocketOptimized';
import { useUserData } from '../hooks/useUserData';

// Ленивая загрузка компонентов для оптимизации
// const RealTimeIncome = lazy(() => import('../components/RealTimeIncome').then(module => ({ default: module.RealTimeIncome })));
const SwapCard = lazy(() => import('../components/SwapCard').then(module => ({ default: module.SwapCard })));
const SlotPurchaseInterface = lazy(() => import('../components/SlotPurchaseInterface').then(module => ({ default: module.SlotPurchaseInterface })));
// const Notifications = lazy(() => import('../components/Notifications').then(module => ({ default: module.Notifications })));

// Компонент загрузки для ленивых компонентов
const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<SkeletonCard />}>
    {children}
  </Suspense>
);

// Компонент для отображения ошибки загрузки
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="error-fallback">
    <div className="error-fallback__content">
      <h3>Failed to load component</h3>
      <p>{error.message}</p>
      <button onClick={resetError} className="error-fallback__button">
        Try Again
      </button>
    </div>
  </div>
);

export const DashboardOptimized: React.FC = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  
  // WebSocket подключение с оптимизацией
  const { 
    isConnected, 
    connectionStatus, 
    subscribe, 
    sendMessage 
  } = useWebSocketOptimized({
    url: process.env.VITE_WS_URL || 'ws://localhost:10113',
    telegramId: user?.id.toString() || '',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  });

  // Fetch user data from API (including balance)
  const { data: apiUserData, isLoading: userDataLoading, error: userDataError, refetch: refetchUserData } = useUserData(user?.telegramId);

  // Мемоизированные данные пользователя
  const userData = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id.toString(),
      name: user.firstName,
      username: user.username,
      avatar: user.avatarUrl,
      balance: apiUserData?.balance || 0, // FIX: Use actual balance from API
      miningPower: apiUserData?.miningPower || 0,
      accruedEarnings: apiUserData?.accruedEarnings || 0,
      totalInvested: apiUserData?.totalInvested || 0
    };
  }, [user, apiUserData]);

  // Подписка на WebSocket сообщения
  React.useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe((message) => {
      console.log('📨 WebSocket message received:', message);
      
      // Обработка разных типов сообщений
      switch (message.type) {
        case 'BALANCE_UPDATE':
          // Обновляем баланс в реальном времени
          console.log('💰 Balance updated:', message.data);
          // Refresh user data to get updated balance
          refetchUserData();
          break;
        case 'SLOT_UPDATE':
          // Обновляем информацию о слотах
          console.log('⛏️ Slot updated:', message.data);
          // Refresh user data to get updated slots
          refetchUserData();
          break;
        case 'NOTIFICATION':
          // Показываем новое уведомление
          console.log('🔔 New notification:', message.data);
          break;
        default:
          console.log('📨 Unknown message type:', message.type);
      }
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // Отправка ping сообщения для поддержания соединения
  React.useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'PING', data: { timestamp: Date.now() } });
    }, 30000); // Каждые 30 секунд

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__content">
          <div className="dashboard-loading__spinner" />
          <h2>Loading your dashboard...</h2>
          <p>Please wait while we prepare everything for you</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="dashboard-error">
        <div className="dashboard-error__content">
          <h2>Authentication Error</h2>
          <p>Unable to load user data. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="dashboard-error__button"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-optimized">
      {/* Заголовок с информацией о соединении */}
      <header className="dashboard-optimized__header">
        <div className="dashboard-optimized__user-info">
          <div className="dashboard-optimized__user-avatar">
            {userData.avatar ? (
              <img src={userData.avatar || ''} alt={userData.name || 'User'} />
            ) : (
              <div className="dashboard-optimized__user-avatar-placeholder">
                {userData.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="dashboard-optimized__user-details">
            <h1>Welcome, {userData.name || 'User'}!</h1>
            <div className="dashboard-optimized__connection-status">
              <span className={`status-indicator status-indicator--${connectionStatus}`}>
                {connectionStatus === 'connected' ? '🟢' : '🔴'}
              </span>
              <span>
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="dashboard-optimized__main">
        {/* Доход в реальном времени */}
        <ErrorBoundary fallback={<SkeletonChart />}>
          <ComponentLoader>
            {/* <RealTimeIncome telegramId={userData.id} /> */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Real-time Income</h3>
              <p className="text-blue-700">Component temporarily disabled</p>
            </div>
          </ComponentLoader>
        </ErrorBoundary>

        {/* Интерфейс покупки слотов */}
        <ErrorBoundary fallback={<SkeletonCard />}>
          <ComponentLoader>
            <SlotPurchaseInterface 
              telegramId={userData.id} 
              userBalance={userData.balance} // FIX: Use actual balance from API
            />
          </ComponentLoader>
        </ErrorBoundary>

        {/* Интерфейс конвертации валют */}
        <ErrorBoundary fallback={<SkeletonCard />}>
          <ComponentLoader>
            <SwapCard 
              telegramId={userData.id} 
              USDBalance={userData.balance || 0}
              variant="simple"
              showBackContent={false}
              showAccordion={false}
            />
          </ComponentLoader>
        </ErrorBoundary>

        {/* Уведомления */}
        <ErrorBoundary fallback={<SkeletonCard />}>
          <ComponentLoader>
            {/* <Notifications telegramId={userData.id} /> */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Notifications</h3>
              <p className="text-green-700">Component temporarily disabled</p>
            </div>
          </ComponentLoader>
        </ErrorBoundary>
      </main>

      {/* Футер с информацией о системе */}
      <footer className="dashboard-optimized__footer">
        <div className="dashboard-optimized__footer-content">
          <div className="dashboard-optimized__footer-item">
            <span>WebSocket:</span>
            <span className={`status-indicator status-indicator--${connectionStatus}`}>
              {connectionStatus}
            </span>
          </div>
          <div className="dashboard-optimized__footer-item">
            <span>Last Update:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Стили для DashboardOptimized
export const dashboardOptimizedStyles = `
.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.dashboard-loading__content {
  text-align: center;
  padding: 40px;
}

.dashboard-loading__spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.dashboard-error__content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-error__button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 16px;
}

.dashboard-optimized {
  min-height: 100vh;
  background: #f8f9fa;
}

.dashboard-optimized__header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-optimized__user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-optimized__user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-optimized__user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dashboard-optimized__user-avatar-placeholder {
  font-size: 24px;
  font-weight: 600;
  color: #6c757d;
}

.dashboard-optimized__user-details h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.dashboard-optimized__connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.status-indicator--connected {
  background: #28a745;
}

.status-indicator--disconnected {
  background: #dc3545;
}

.status-indicator--connecting {
  background: #ffc107;
}

.status-indicator--error {
  background: #dc3545;
}

.dashboard-optimized__main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-optimized__footer {
  background: white;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  margin-top: 40px;
}

.dashboard-optimized__footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #6c757d;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-optimized__footer-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-fallback {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  margin: 20px 0;
}

.error-fallback__content {
  text-align: center;
}

.error-fallback__button {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .dashboard-optimized__header {
    padding: 16px;
  }
  
  .dashboard-optimized__main {
    padding: 16px;
  }
  
  .dashboard-optimized__footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
`;

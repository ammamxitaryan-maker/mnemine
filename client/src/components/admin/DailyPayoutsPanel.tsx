import React, { useState, useEffect } from 'react';

interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  createdAt: string;
}

const DailyPayoutsPanel: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Симуляция загрузки данных
    const timer = setTimeout(() => {
      setPayouts([
        {
          id: '1',
          userId: '123456789',
          amount: 150.50,
          status: 'pending',
          createdAt: '2025-10-02T10:00:00Z'
        },
        {
          id: '2',
          userId: '987654321',
          amount: 75.25,
          status: 'processed',
          createdAt: '2025-10-02T09:30:00Z'
        },
        {
          id: '3',
          userId: '555666777',
          amount: 200.00,
          status: 'failed',
          createdAt: '2025-10-02T09:15:00Z'
        }
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleProcessPayouts = async () => {
    setIsProcessing(true);
    
    // Симуляция обработки выплат
    setTimeout(() => {
      setPayouts(prevPayouts => 
        prevPayouts.map(payout => 
          payout.status === 'pending' 
            ? { ...payout, status: 'processed' as const }
            : payout
        )
      );
      setIsProcessing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'processed':
        return 'Обработано';
      case 'failed':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка выплат...</p>
        </div>
      </div>
    );
  }

  const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const pendingCount = payouts.filter(p => p.status === 'pending').length;
  const processedCount = payouts.filter(p => p.status === 'processed').length;
  const failedCount = payouts.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Статистика выплат
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600">Общая сумма</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <div className="text-sm text-yellow-600">Ожидают</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {processedCount}
              </div>
              <div className="text-sm text-green-600">Обработано</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {failedCount}
              </div>
              <div className="text-sm text-red-600">Ошибки</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Список выплат
            </h3>
            <button
              onClick={handleProcessPayouts}
              disabled={isProcessing || pendingCount === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {isProcessing ? 'Обработка...' : 'Обработать все'}
            </button>
          </div>
          
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Пользователь: {payout.userId}
                  </div>
                  <div className="text-sm text-gray-500">
                    Сумма: ${payout.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Создано: {new Date(payout.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                    {getStatusText(payout.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPayoutsPanel;
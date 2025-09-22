/**
 * BUG FIX: Removed unused className prop and marketData variable
 * to fix TypeScript warnings about unused variables
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeWebSocket } from '@/hooks/useWebSocket';

interface ExchangeRate {
  id: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
}

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = memo(({ 
  isOpen, 
  onClose
}) => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get real-time data from WebSocket
  useRealTimeWebSocket('global');

  const fetchExchangeData = useCallback(async () => {
    try {
      const [rateResponse, historyResponse] = await Promise.all([
        fetch('/api/exchange/rate'),
        fetch('/api/exchange/rate/history')
      ]);

      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        setCurrentRate(rateData.rate || 0);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setExchangeRates(historyData.slice(0, 8)); // Last 8 rates for smaller chart
      }
    } catch (error) {
      console.error('Error fetching exchange data:', error);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchExchangeData();
    }
  }, [isOpen, fetchExchangeData]);

  // Auto-refresh every 60 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(fetchExchangeData, 60000);
    return () => clearInterval(interval);
  }, [isOpen, fetchExchangeData]);

  // Prepare chart data
  const chartData = exchangeRates.map((rate, index) => ({
    time: new Date(rate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rate: (rate.rate * 100).toFixed(3),
    rateValue: rate.rate,
    index: index,
  }));

  const getRateChange = () => {
    if (exchangeRates.length < 2) return 0;
    const current = exchangeRates[0]?.rate || 0;
    const previous = exchangeRates[1]?.rate || 0;
    return ((current - previous) / previous) * 100;
  };

  const rateChange = getRateChange();
  const isPositiveChange = rateChange >= 0;

  if (isLoading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="h-48">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="h-48">
              <CardContent className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Exchange Rate</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rateChange !== 0 && (
                      <div className={`flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositiveChange ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-medium ml-1">
                          {Math.abs(rateChange).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Live
                    </Badge>
                    <button
                      onClick={onClose}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Current Rate */}
                <div className="mb-2">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    1 CFM = {currentRate.toFixed(6)} CFMT
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Rate: {(currentRate * 100).toFixed(3)}%
                  </p>
                </div>

                {/* Mini Chart */}
                <div className="h-16">
                  {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="1 1" stroke="#f0f0f0" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['dataMin - 0.0001', 'dataMax + 0.0001']} hide />
                        <Tooltip 
                          formatter={(value: number) => [`${(value * 100).toFixed(3)}%`, 'Rate']}
                          labelFormatter={(label) => `Time: ${label}`}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rateValue" 
                          stroke={isPositiveChange ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 2, stroke: isPositiveChange ? "#10b981" : "#ef4444", strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p className="text-xs">No exchange history available</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                    <span className="text-green-500">● Live</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ExchangeRateModal.displayName = 'ExchangeRateModal';

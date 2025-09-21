import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface ExchangeRate {
  id: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
}

interface ExchangeRateChartProps {
  className?: string;
}

export const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({ className = '' }) => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchExchangeData = async () => {
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
        setExchangeRates(historyData.slice(0, 10)); // Last 10 rates
      }
    } catch (error) {
      console.error('Error fetching exchange data:', error);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchExchangeData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchExchangeData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Exchange Rate</h3>
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
                    {Math.abs(rateChange).toFixed(2)}%
                  </span>
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                Live
              </Badge>
            </div>
          </div>

          {/* Current Rate */}
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(currentRate * 100).toFixed(3)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              1 CFM = {currentRate.toFixed(6)} CFMT
            </p>
          </div>

          {/* Mini Chart */}
          <div className="h-20">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    hide
                  />
                  <YAxis 
                    domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                    hide
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(3)}%`, 'Rate']}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rateValue" 
                    stroke={isPositiveChange ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, stroke: isPositiveChange ? "#10b981" : "#ef4444", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">No history available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              <button
                onClick={fetchExchangeData}
                className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

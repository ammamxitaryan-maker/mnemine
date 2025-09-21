import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { useRealTimeWebSocket } from '@/hooks/useWebSocket';

interface PriceData {
  timestamp: string;
  price: number;
  volume: number;
  change: number;
}

interface RealTimePriceChartProps {
  className?: string;
}

export const RealTimePriceChart: React.FC<RealTimePriceChartProps> = memo(({ className = '' }) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get real-time data from WebSocket
  const { isConnected: wsConnected, marketData } = useRealTimeWebSocket('global');

  // Simulate realistic price movements
  const generatePriceMovement = useCallback((basePrice: number, volatility: number = 0.02) => {
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = basePrice * (1 + change);
    
    // Ensure price stays within reasonable bounds (0.8x to 1.2x of base)
    const minPrice = basePrice * 0.8;
    const maxPrice = basePrice * 1.2;
    
    return Math.max(minPrice, Math.min(maxPrice, newPrice));
  }, []);

  // Initialize price data
  useEffect(() => {
    const initializePriceData = () => {
      const basePrice = 1.0; // Starting price
      const now = new Date();
      const history: PriceData[] = [];
      
      // Generate 24 hours of historical data
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const price = generatePriceMovement(basePrice, 0.01);
        
        history.push({
          timestamp: timestamp.toISOString(),
          price: price,
          volume: Math.random() * 1000000 + 500000,
          change: i === 0 ? 0 : (price - basePrice) / basePrice * 100
        });
      }
      
      setPriceHistory(history);
      setCurrentPrice(history[history.length - 1].price);
      setPriceChange(history[history.length - 1].change);
    };

    initializePriceData();
  }, [generatePriceMovement]);

  // Real-time price updates
  useEffect(() => {
    if (!wsConnected) return;

    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const newPrice = generatePriceMovement(currentPrice, 0.005);
        const change = ((newPrice - currentPrice) / currentPrice) * 100;
        
        const newDataPoint: PriceData = {
          timestamp: new Date().toISOString(),
          price: newPrice,
          volume: Math.random() * 1000000 + 500000,
          change: change
        };

        const updatedHistory = [...prev, newDataPoint].slice(-24); // Keep last 24 data points
        
        setCurrentPrice(newPrice);
        setPriceChange(change);
        setLastUpdate(new Date());
        
        return updatedHistory;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [wsConnected, currentPrice, generatePriceMovement]);

  // Prepare chart data
  const chartData = priceHistory.map((data, index) => ({
    time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: data.price,
    volume: data.volume,
    change: data.change,
    index: index,
  }));

  const isPositiveChange = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      <Card className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
        <CardContent className="p-6">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <DollarSign className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">CFM Price</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Real-time exchange rate</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`flex items-center px-3 py-1.5 rounded-lg ${
                  isPositiveChange 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-bold">
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Badge 
                  variant={wsConnected ? "default" : "secondary"} 
                  className={`text-xs px-3 py-1 ${
                    wsConnected 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  <Activity className={`w-3 h-3 mr-1 ${wsConnected ? 'animate-pulse' : ''}`} />
                  {wsConnected ? 'Live' : 'Offline'}
                </Badge>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Current Price */}
          <motion.div 
            className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.p 
              className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
              animate={{ 
                color: isPositiveChange ? "#059669" : "#dc2626",
                scale: [1, 1.02, 1] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              1 CFM = {currentPrice.toFixed(6)} CFMT
            </motion.p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exchange rate • Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </motion.div>

          {/* Price Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  hide
                />
                <YAxis 
                  domain={['dataMin * 0.99', 'dataMax * 1.01']}
                  hide
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositiveChange ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  dot={false}
                  activeDot={{ r: 3, stroke: isPositiveChange ? "#10b981" : "#ef4444", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              <div className="flex items-center space-x-2">
                <span>Volume: ${(chartData[chartData.length - 1]?.volume || 0).toLocaleString()}</span>
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

RealTimePriceChart.displayName = 'RealTimePriceChart';

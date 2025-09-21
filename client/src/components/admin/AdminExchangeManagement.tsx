import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  History,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExchangeRate {
  id: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
}

interface ExchangeData {
  rate: number;
  rateId?: string;
}

export const AdminExchangeManagement: React.FC = () => {
  const [currentRate, setCurrentRate] = useState<ExchangeData | null>(null);
  const [rateHistory, setRateHistory] = useState<ExchangeRate[]>([]);
  const [newRate, setNewRate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchExchangeData = async () => {
    try {
      const [rateResponse, historyResponse] = await Promise.all([
        fetch('/api/exchange/rate'),
        fetch('/api/exchange/rate/history')
      ]);

      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        setCurrentRate(rateData);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setRateHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching exchange data:', error);
      toast.error('Failed to fetch exchange data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateExchangeRate = async () => {
    const rate = parseFloat(newRate);
    
    if (isNaN(rate) || rate < 0.001 || rate > 0.03) {
      toast.error('Exchange rate must be between 0.1% and 3%');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/exchange/admin/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });

      if (response.ok) {
        toast.success(`Exchange rate updated to ${(rate * 100).toFixed(3)}%`);
        setNewRate('');
        fetchExchangeData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update exchange rate');
      }
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast.error('Failed to update exchange rate');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchExchangeData();
  }, []);

  // Prepare chart data
  const chartData = rateHistory.slice(0, 20).reverse().map((rate, index) => ({
    time: new Date(rate.createdAt).toLocaleTimeString(),
    rate: (rate.rate * 100).toFixed(3),
    rateValue: rate.rate,
  }));

  const getRateChange = () => {
    if (rateHistory.length < 2) return 0;
    const current = rateHistory[0]?.rate || 0;
    const previous = rateHistory[1]?.rate || 0;
    return ((current - previous) / previous) * 100;
  };

  const rateChange = getRateChange();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exchange Rate Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage CFM to CFMT exchange rates</p>
        </div>
        <Button onClick={fetchExchangeData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Current Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(currentRate?.rate ? currentRate.rate * 100 : 0).toFixed(3)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1 CFM = {(currentRate?.rate || 0).toFixed(6)} CFMT
              </p>
            </div>
            <div className="text-right">
              {rateChange !== 0 && (
                <div className={`flex items-center ${rateChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rateChange > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(rateChange).toFixed(2)}%
                  </span>
                </div>
              )}
              <Badge variant="outline" className="mt-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Update Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                New Rate (0.1% - 3%)
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.0001"
                  min="0.001"
                  max="0.03"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="0.01"
                  className="flex-1"
                />
                <Button
                  onClick={updateExchangeRate}
                  disabled={isUpdating || !newRate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Current: {(currentRate?.rate || 0).toFixed(6)} | 
                Min: 0.001 (0.1%) | Max: 0.03 (3%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Exchange Rate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  tickFormatter={(value) => `${(value * 100).toFixed(3)}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(3)}%`, 'Rate']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rateValue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rate History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Recent Rate Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rateHistory.slice(0, 10).map((rate) => (
                    <motion.tr
                      key={rate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-lg font-semibold">
                          {(rate.rate * 100).toFixed(3)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          1 CFM = {rate.rate.toFixed(6)} CFMT
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={rate.isActive ? "default" : "secondary"}
                          className={rate.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                        >
                          {rate.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(rate.createdAt).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

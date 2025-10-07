"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  History, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface ExchangeRate {
  rate: number;
  createdBy: string;
  timestamp: string;
}

interface ExchangeHistory {
  rate: number;
  createdBy: string;
  timestamp: string;
}

const AdminExchange = () => {
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [history, setHistory] = useState<ExchangeHistory[]>([]);
  const [newRate, setNewRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const fetchExchangeData = async () => {
    try {
      setLoading(true);
      const [rateRes, historyRes] = await Promise.all([
        api.get('/exchange/rate'),
        api.get('/exchange/rate/history?limit=20')
      ]);

      setCurrentRate({
        rate: rateRes.data.rate,
        createdBy: 'system',
        timestamp: rateRes.data.timestamp
      });
      setHistory(historyRes.data.history);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to load exchange data' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRate.trim()) {
      setMessage({ type: 'error', text: 'Rate is required' });
      return;
    }

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      setMessage({ type: 'error', text: 'Rate must be a positive number' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await api.post('/admin/rate', { rate });
      
      setMessage({ 
        type: 'success', 
        text: `Exchange rate updated to ${rate.toFixed(4)} MNE per USD` 
      });

      setNewRate('');
      fetchExchangeData();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to update exchange rate' 
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Exchange Rate Management</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage USD to MNE exchange rates</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchExchangeData} className="touch-manipulation self-start sm:self-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Rate */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-2 text-green-400" />
            Current Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {currentRate?.rate.toFixed(4) || '0.0000'} MNE
              </div>
              <div className="text-sm text-gray-400">
                per 1 USD
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-gray-400">
                Last updated
              </div>
              <div className="text-sm text-white">
                {currentRate?.timestamp ? 
                  new Date(currentRate.timestamp).toLocaleString() : 'N/A'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set New Rate */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
            Set New Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetRate} className="space-y-4">
            <div>
              <Label htmlFor="rate" className="text-sm font-medium text-gray-300">New Rate (MNE per USD)</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 touch-manipulation"
                placeholder="Enter new exchange rate"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Current rate: {currentRate?.rate.toFixed(4) || '0.0000'} MNE per USD
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 touch-manipulation"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Updating...' : 'Update Exchange Rate'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rate History */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <History className="h-4 w-4 mr-2 text-purple-400" />
            Rate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>No rate history available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry, index) => {
                const previousRate = index < history.length - 1 ? history[index + 1].rate : entry.rate;
                const change = calculateChange(entry.rate, previousRate);
                
                return (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-800 rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-lg font-bold text-white">
                        {entry.rate.toFixed(4)} MNE
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-sm text-gray-400">
                        by {entry.createdBy}
                      </div>
                      {change !== 0 && (
                        <div className={`text-sm font-bold ${
                          change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {change > 0 ? (
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 inline mr-1" />
                          )}
                          {Math.abs(change).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Information */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
            Rate Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Minimum Rate:</span>
              <span className="text-red-400">0.0001 MNE</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Rate:</span>
              <span className="text-red-400">100.0000 MNE</span>
            </div>
            <div className="flex justify-between">
              <span>Default Rate:</span>
              <span className="text-blue-400">1.0000 MNE</span>
            </div>
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-yellow-400 text-xs">
                <strong>Warning:</strong> Changing exchange rates affects all future swaps and may impact user balances. 
                Changes are logged and cannot be undone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExchange;


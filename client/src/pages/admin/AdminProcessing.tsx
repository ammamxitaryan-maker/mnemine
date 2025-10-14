"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cog, 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Activity,
  BarChart3
} from 'lucide-react';

interface ProcessingMetrics {
  lastHour: {
    slotsProcessed: number;
    processingTime: number;
    errors: number;
    successRate: number;
  };
  lastDay: {
    totalSlots: number;
    processedSlots: number;
    failedSlots: number;
    avgProcessingTime: number;
  };
  timestamp: string;
}

interface ProcessingStatus {
  activeSlots: number;
  expiredSlots: number;
  expiringSoon: number;
  processedLastHour: number;
  systemStatus: 'up_to_date' | 'pending' | 'error';
  timestamp: string;
}

interface ProcessingQueueItem {
  id: string;
  userId: string;
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
  };
  principal: number;
  rate: number;
  expiresAt: string;
  isLocked: boolean;
  type: string;
  hoursOverdue: number;
}

const AdminProcessing = () => {
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [queue, setQueue] = useState<ProcessingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, statusRes, queueRes] = await Promise.all([
        api.get('/admin/processing/metrics'),
        api.get('/admin/processing/status'),
        api.get('/admin/processing/queue?limit=20')
      ]);

      setMetrics(metricsRes.data.data);
      setStatus(statusRes.data.data);
      setQueue(queueRes.data.data.slots);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load processing data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualProcessing = async () => {
    try {
      setProcessing(true);
      const response = await api.post('/admin/processing/run-manual');
      
      // Refresh data after processing
      await fetchData();
      
      alert(`Manual processing completed!\nProcessed: ${response.data.data.processedSlots} slots\nTime: ${response.data.data.processingTimeMs}ms`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Manual processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'up_to_date': 'bg-green-600',
      'pending': 'bg-yellow-600',
      'error': 'bg-red-600'
    };
    const labels = {
      'up_to_date': 'Up to Date',
      'pending': 'Pending',
      'error': 'Error'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-600'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Processing Management</h1>
          <p className="text-gray-400">Monitor and manage slot processing automation</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleManualProcessing}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {processing ? 'Processing...' : 'Run Manual Processing'}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Database className="h-4 w-4 mr-2 text-blue-400" />
              System Status
            </span>
            {status && getStatusBadge(status.systemStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{status?.activeSlots || 0}</div>
              <div className="text-sm text-gray-400">Active Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{status?.expiredSlots || 0}</div>
              <div className="text-sm text-gray-400">Expired Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{status?.expiringSoon || 0}</div>
              <div className="text-sm text-gray-400">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{status?.processedLastHour || 0}</div>
              <div className="text-sm text-gray-400">Processed (1h)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-green-400" />
              Last Hour Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Slots Processed</span>
                <span className="text-white font-bold">{metrics?.lastHour.slotsProcessed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Processing Time</span>
                <span className="text-blue-400 font-bold">{metrics?.lastHour.processingTime || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Errors</span>
                <span className="text-red-400 font-bold">{metrics?.lastHour.errors || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Success Rate</span>
                <span className="text-green-400 font-bold">{metrics?.lastHour.successRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Slots</span>
                <span className="text-white font-bold">{metrics?.lastDay.totalSlots || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Processed</span>
                <span className="text-green-400 font-bold">{metrics?.lastDay.processedSlots || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Failed</span>
                <span className="text-red-400 font-bold">{metrics?.lastDay.failedSlots || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Time</span>
                <span className="text-blue-400 font-bold">{metrics?.lastDay.avgProcessingTime || 0}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Queue */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Activity className="h-4 w-4 mr-2 text-orange-400" />
            Processing Queue ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p>No expired slots in queue</p>
              <p className="text-sm">All slots are up to date</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queue.map((item) => (
                <div key={item.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">
                        {item.user.firstName || item.user.username || `User ${item.user.telegramId}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        Slot ID: {item.id.slice(0, 8)}... • {item.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-mono">
                        {item.principal.toFixed(2)} USD
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.hoursOverdue.toFixed(1)}h overdue
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Expired: {new Date(item.expiresAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {metrics?.timestamp && (
        <div className="text-center text-sm text-gray-400">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AdminProcessing;


"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2,
  Eye,
  Filter,
  Search,
  Zap,
  Users,
  DollarSign,
  Bell
} from 'lucide-react';

interface QueueItem {
  id: string;
  type: 'payout' | 'notification' | 'email' | 'sms';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
  processedAt?: string;
  error?: string;
  userId?: string;
  amount?: number;
  recipient?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retry: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const AdminQueueManagement = () => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchQueueData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueueData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockQueues: QueueItem[] = [
        {
          id: '1',
          type: 'payout',
          status: 'pending',
          priority: 'high',
          payload: { userId: 'user123', amount: 100, currency: 'USD' },
          attempts: 0,
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          scheduledFor: new Date(Date.now() + 60000).toISOString(),
          userId: 'user123',
          amount: 100
        },
        {
          id: '2',
          type: 'notification',
          status: 'processing',
          priority: 'normal',
          payload: { message: 'Your investment has matured', type: 'success' },
          attempts: 1,
          maxAttempts: 5,
          createdAt: new Date(Date.now() - 300000).toISOString(),
          userId: 'user456'
        },
        {
          id: '3',
          type: 'email',
          status: 'failed',
          priority: 'low',
          payload: { to: 'user@example.com', subject: 'Welcome', template: 'welcome' },
          attempts: 3,
          maxAttempts: 3,
          createdAt: new Date(Date.now() - 600000).toISOString(),
          error: 'SMTP connection failed',
          recipient: 'user@example.com'
        },
        {
          id: '4',
          type: 'payout',
          status: 'completed',
          priority: 'critical',
          payload: { userId: 'user789', amount: 500, currency: 'USD' },
          attempts: 1,
          maxAttempts: 3,
          createdAt: new Date(Date.now() - 900000).toISOString(),
          processedAt: new Date(Date.now() - 300000).toISOString(),
          userId: 'user789',
          amount: 500
        }
      ];

      const mockStats: QueueStats = {
        total: mockQueues.length,
        pending: mockQueues.filter(q => q.status === 'pending').length,
        processing: mockQueues.filter(q => q.status === 'processing').length,
        completed: mockQueues.filter(q => q.status === 'completed').length,
        failed: mockQueues.filter(q => q.status === 'failed').length,
        retry: mockQueues.filter(q => q.status === 'retry').length,
        byType: {
          payout: mockQueues.filter(q => q.type === 'payout').length,
          notification: mockQueues.filter(q => q.type === 'notification').length,
          email: mockQueues.filter(q => q.type === 'email').length,
          sms: mockQueues.filter(q => q.type === 'sms').length
        },
        byPriority: {
          low: mockQueues.filter(q => q.priority === 'low').length,
          normal: mockQueues.filter(q => q.priority === 'normal').length,
          high: mockQueues.filter(q => q.priority === 'high').length,
          critical: mockQueues.filter(q => q.priority === 'critical').length
        }
      };

      setQueues(mockQueues);
      setStats(mockStats);
    } catch (error: any) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueAction = async (queueId: string, action: string) => {
    try {
      // Mock API calls - in real implementation, these would be actual API calls
      switch (action) {
        case 'retry':
          console.log(`Retrying queue item ${queueId}`);
          break;
        case 'cancel':
          console.log(`Cancelling queue item ${queueId}`);
          break;
        case 'delete':
          console.log(`Deleting queue item ${queueId}`);
          break;
        case 'pause':
          console.log(`Pausing queue item ${queueId}`);
          break;
        case 'resume':
          console.log(`Resuming queue item ${queueId}`);
          break;
      }
      fetchQueueData();
    } catch (error: any) {
      console.error(`Error ${action} queue item:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'retry': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-600',
      processing: 'bg-blue-600',
      completed: 'bg-green-600',
      failed: 'bg-red-600',
      retry: 'bg-orange-600'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-600'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-400';
      case 'normal': return 'text-blue-400';
      case 'high': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-600',
      normal: 'bg-blue-600',
      high: 'bg-yellow-600',
      critical: 'bg-red-600'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-600'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payout': return <DollarSign className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'email': return <Users className="h-4 w-4" />;
      case 'sms': return <Zap className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredQueues = queues.filter(queue => {
    const matchesQueue = selectedQueue === 'all' || queue.type === selectedQueue;
    const matchesSearch = searchTerm === '' || 
      queue.id.includes(searchTerm) ||
      queue.userId?.includes(searchTerm) ||
      queue.recipient?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || queue.status === filterStatus;
    
    return matchesQueue && matchesSearch && matchesStatus;
  });

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue Management</h1>
          <p className="text-gray-400">Monitor and manage system queues</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Auto-refresh:</label>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
          <Button onClick={fetchQueueData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-sm text-gray-400">Processing</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{stats.retry}</div>
            <div className="text-sm text-gray-400">Retry</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search queues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Queues</option>
              <option value="payout">Payouts</option>
              <option value="notification">Notifications</option>
              <option value="email">Emails</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="retry">Retry</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Queue Items ({filteredQueues.length})</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Process All
              </Button>
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Attempts</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueues.map((queue) => (
                  <tr key={queue.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm text-white">{queue.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(queue.type)}
                        <span className="text-white capitalize">{queue.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(queue.status)}
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(queue.priority)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="text-white">{queue.attempts}</span>
                        <span className="text-gray-400">/{queue.maxAttempts}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-300">
                        {new Date(queue.createdAt).toLocaleString()}
                      </div>
                      {queue.scheduledFor && (
                        <div className="text-xs text-gray-400">
                          Scheduled: {new Date(queue.scheduledFor).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(queue.id, 'retry')}
                          disabled={queue.status === 'processing'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(queue.id, 'cancel')}
                          disabled={queue.status === 'completed'}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(queue.id, 'delete')}
                          className="text-red-400 border-red-600 hover:bg-red-600/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQueueManagement;

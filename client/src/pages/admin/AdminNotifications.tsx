"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Send, 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  Calendar,
  Target,
  Zap,
  Filter,
  Search
} from 'lucide-react';

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  byType: Record<string, { read: number; unread: number }>;
  period: string;
}

interface QueueStats {
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  lastProcessed: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: {
    id: string;
    telegramId: string;
    firstName: string;
    username: string;
  };
}

const AdminNotifications = () => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form states
  const [notificationType, setNotificationType] = useState('INFO');
  const [title, setTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetUsers, setTargetUsers] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchQueueStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      // Mock stats since endpoint doesn't exist yet
      const mockStats = {
        totalNotifications: notifications.length,
        unreadNotifications: notifications.filter(n => n.status === 'PENDING').length,
        readNotifications: notifications.filter(n => n.status === 'SENT').length,
        byType: {
          'INFO': { read: 5, unread: 2 },
          'WARNING': { read: 3, unread: 1 },
          'SUCCESS': { read: 8, unread: 0 },
          'ERROR': { read: 1, unread: 0 },
          'PROMOTION': { read: 12, unread: 3 }
        },
        period: '7 days'
      };
      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching notification stats:', err);
    }
  };

  const fetchQueueStats = async () => {
    try {
      // Mock queue stats since endpoint doesn't exist yet
      const mockQueueStats = {
        pendingCount: notifications.filter(n => n.status === 'PENDING').length,
        processingCount: 0,
        completedCount: notifications.filter(n => n.status === 'SENT').length,
        failedCount: notifications.filter(n => n.status === 'FAILED').length,
        lastProcessed: new Date().toISOString()
      };
      setQueueStats(mockQueueStats);
    } catch (err: any) {
      console.error('Error fetching queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/notifications');
      setNotifications(response.data.data.notifications || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !notificationMessage.trim()) {
      setMessage({ type: 'error', text: 'Title and message are required' });
      return;
    }

    // Add confirmation dialog for better UX
    const confirmMessage = `Are you sure you want to send this notification to ${targetUsers === 'all' ? 'all users' : targetUsers}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      setMessage(null);

      const response = await api.post('/admin/notifications/send', {
        type: notificationType,
        title: title.trim(),
        message: notificationMessage.trim(),
        targetUsers: targetUsers === 'all' ? 'all' : [targetUsers]
      });

      setMessage({ 
        type: 'success', 
        text: `Notification sent successfully to ${response.data.sentCount || 'all'} users` 
      });

      // Reset form
      setTitle('');
      setNotificationMessage('');
      setTargetUsers('all');

      // Refresh data
      fetchNotifications();
      fetchStats();
      fetchQueueStats();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to send notification' 
      });
    } finally {
      setSending(false);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm('Are you sure you want to clear the notification queue?')) {
      return;
    }

    try {
      await api.post('/admin/notifications/clear-queue');
      setMessage({ type: 'success', text: 'Notification queue cleared successfully' });
      fetchQueueStats();
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to clear queue' 
      });
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-white">Notification Management</h1>
          <p className="text-gray-400">Send notifications and manage the notification system</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{stats?.totalNotifications || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.unreadNotifications || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Read</p>
                <p className="text-2xl font-bold text-green-400">{stats?.readNotifications || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Queue Pending</p>
                <p className="text-2xl font-bold text-purple-400">{queueStats?.pendingCount || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
        </TabsList>

        {/* Send Notification */}
        <TabsContent value="send">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Send className="h-4 w-4 mr-2 text-green-400" />
                Send New Notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Notification Type</Label>
                    <select
                      id="type"
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value="INFO">Information</option>
                      <option value="WARNING">Warning</option>
                      <option value="SUCCESS">Success</option>
                      <option value="ERROR">Error</option>
                      <option value="PROMOTION">Promotion</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="target">Target Users</Label>
                    <select
                      id="target"
                      value={targetUsers}
                      onChange={(e) => setTargetUsers(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="active">Active Users Only</option>
                      <option value="investors">Investors Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-800 border-gray-600"
                    placeholder="Notification title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm min-h-[100px]"
                    placeholder="Notification message"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Notification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification History */}
        <TabsContent value="history">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-blue-400" />
                  Notification History
                </div>
                <Button variant="outline" size="sm" onClick={fetchNotifications}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="INFO">Information</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUCCESS">Success</option>
                  <option value="ERROR">Error</option>
                  <option value="PROMOTION">Promotion</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {notifications
                  .filter(notification => {
                    const matchesSearch = searchTerm === '' || 
                      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = filterType === 'all' || notification.type === filterType;
                    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
                    return matchesSearch && matchesType && matchesStatus;
                  })
                  .map((notification) => (
                    <div key={notification.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">{notification.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                notification.status === 'SENT' ? 'text-green-400 border-green-400' :
                                notification.status === 'FAILED' ? 'text-red-400 border-red-400' :
                                notification.status === 'PENDING' ? 'text-yellow-400 border-yellow-400' :
                                'text-blue-400 border-blue-400'
                              }`}
                            >
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                            {notification.user && (
                              <span>User: {notification.user.firstName || notification.user.username}</span>
                            )}
                            <span>Priority: {notification.priority}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-400 border-red-600 hover:bg-red-600/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                Notification Statistics ({stats?.period || '7 days'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byType && Object.entries(stats.byType).map(([type, counts]) => (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{type}</span>
                      <div className="text-sm text-gray-400">
                        {counts.read + counts.unread} total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm">
                        {counts.read} read
                      </div>
                      <div className="text-yellow-400 text-sm">
                        {counts.unread} unread
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Management */}
        <TabsContent value="queue">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Settings className="h-4 w-4 mr-2 text-purple-400" />
                Notification Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{queueStats?.pendingCount || 0}</div>
                    <div className="text-sm text-gray-400">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{queueStats?.processingCount || 0}</div>
                    <div className="text-sm text-gray-400">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{queueStats?.completedCount || 0}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{queueStats?.failedCount || 0}</div>
                    <div className="text-sm text-gray-400">Failed</div>
                  </div>
                </div>

                {queueStats?.lastProcessed && (
                  <div className="text-center text-sm text-gray-400">
                    Last processed: {new Date(queueStats.lastProcessed).toLocaleString()}
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleClearQueue}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Queue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;

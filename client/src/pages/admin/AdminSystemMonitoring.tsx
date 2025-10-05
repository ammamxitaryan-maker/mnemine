"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queries: number;
    responseTime: number;
  };
  uptime: {
    days: number;
    hours: number;
    minutes: number;
  };
  alerts: {
    count: number;
    critical: number;
    warnings: number;
  };
}

interface HistoricalData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  connections: number;
}

const AdminSystemMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    fetchSystemMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - in real implementation, this would come from your monitoring system
      const mockMetrics: SystemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          cores: 8,
          loadAverage: [0.5, 0.8, 1.2]
        },
        memory: {
          used: Math.random() * 16,
          total: 16,
          percentage: Math.random() * 100
        },
        disk: {
          used: Math.random() * 500,
          total: 1000,
          percentage: Math.random() * 100
        },
        network: {
          bytesIn: Math.random() * 1000000,
          bytesOut: Math.random() * 1000000,
          connections: Math.floor(Math.random() * 1000)
        },
        database: {
          connections: Math.floor(Math.random() * 100),
          queries: Math.floor(Math.random() * 10000),
          responseTime: Math.random() * 100
        },
        uptime: {
          days: 15,
          hours: 8,
          minutes: 32
        },
        alerts: {
          count: Math.floor(Math.random() * 5),
          critical: Math.floor(Math.random() * 2),
          warnings: Math.floor(Math.random() * 3)
        }
      };

      setMetrics(mockMetrics);

      // Add to historical data
      const newDataPoint: HistoricalData = {
        timestamp: new Date().toISOString(),
        cpu: mockMetrics.cpu.usage,
        memory: mockMetrics.memory.percentage,
        disk: mockMetrics.disk.percentage,
        connections: mockMetrics.network.connections
      };

      setHistoricalData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 50 data points
        return updated.slice(-50);
      });
    } catch (error: any) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (uptime: { days: number; hours: number; minutes: number }) => {
    return `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m`;
  };

  const getStatusColor = (percentage: number, thresholds: { warning: number; critical: number }) => {
    if (percentage >= thresholds.critical) return 'text-red-400';
    if (percentage >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadge = (percentage: number, thresholds: { warning: number; critical: number }) => {
    if (percentage >= thresholds.critical) return <Badge variant="destructive">Critical</Badge>;
    if (percentage >= thresholds.warning) return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Warning</Badge>;
    return <Badge variant="outline" className="text-green-400 border-green-400">Normal</Badge>;
  };

  if (!metrics) {
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
          <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
          <p className="text-gray-400">Real-time system performance and health metrics</p>
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
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Interval:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          <Button onClick={fetchSystemMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">System Status</div>
                <div className="text-lg font-semibold text-green-400">Online</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Uptime</div>
                <div className="text-lg font-semibold text-white">
                  {formatUptime(metrics.uptime)}
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Active Connections</div>
                <div className="text-lg font-semibold text-white">
                  {metrics.network.connections.toLocaleString()}
                </div>
              </div>
              <Wifi className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Alerts</div>
                <div className="text-lg font-semibold text-white">
                  {metrics.alerts.count}
                </div>
              </div>
              {metrics.alerts.count > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Cpu className="h-4 w-4 mr-2" />
                CPU Usage
              </div>
              {getStatusBadge(metrics.cpu.usage, { warning: 70, critical: 90 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-white">
                {metrics.cpu.usage.toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cores: {metrics.cpu.cores}</span>
                  <span className="text-gray-400">Load: {metrics.cpu.loadAverage.join(', ')}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.cpu.usage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <HardDrive className="h-4 w-4 mr-2" />
                Memory Usage
              </div>
              {getStatusBadge(metrics.memory.percentage, { warning: 80, critical: 95 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-white">
                {metrics.memory.percentage.toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatBytes(metrics.memory.used * 1024 * 1024 * 1024)}
                  </span>
                  <span className="text-gray-400">
                    {formatBytes(metrics.memory.total * 1024 * 1024 * 1024)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.memory.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Disk Usage
              </div>
              {getStatusBadge(metrics.disk.percentage, { warning: 85, critical: 95 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-white">
                {metrics.disk.percentage.toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatBytes(metrics.disk.used * 1024 * 1024 * 1024)}
                  </span>
                  <span className="text-gray-400">
                    {formatBytes(metrics.disk.total * 1024 * 1024 * 1024)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.disk.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network & Database Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Wifi className="h-4 w-4 mr-2" />
              Network Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Bytes In</div>
                  <div className="text-lg font-semibold text-blue-400">
                    {formatBytes(metrics.network.bytesIn)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Bytes Out</div>
                  <div className="text-lg font-semibold text-green-400">
                    {formatBytes(metrics.network.bytesOut)}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Active Connections</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.network.connections.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Database className="h-4 w-4 mr-2" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Connections</div>
                  <div className="text-lg font-semibold text-purple-400">
                    {metrics.database.connections}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Queries/sec</div>
                  <div className="text-lg font-semibold text-blue-400">
                    {metrics.database.queries.toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Response Time</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.database.responseTime.toFixed(2)}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Performance Chart */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  name="CPU %"
                />
                <Area 
                  type="monotone" 
                  dataKey="memory" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.3}
                  name="Memory %"
                />
                <Area 
                  type="monotone" 
                  dataKey="disk" 
                  stackId="3"
                  stroke="#F59E0B" 
                  fill="#F59E0B"
                  fillOpacity={0.3}
                  name="Disk %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {metrics.alerts.count > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.alerts.critical > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">Critical Alerts</span>
                  </div>
                  <Badge variant="destructive">{metrics.alerts.critical}</Badge>
                </div>
              )}
              {metrics.alerts.warnings > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Warnings</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    {metrics.alerts.warnings}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSystemMonitoring;

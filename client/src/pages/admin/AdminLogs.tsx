"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ActivityLog {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  sourceUserId?: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, dateRange, filterType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/logs', {
        params: {
          page,
          limit: 50,
          days: dateRange,
          type: filterType !== 'all' ? filterType : undefined,
          search: searchTerm || undefined
        }
      });

      setLogs(response.data.data.logs);
      setTotalPages(response.data.data.totalPages);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const exportLogs = async () => {
    try {
      const response = await api.get('/admin/logs/export', {
        params: {
          days: dateRange,
          type: filterType !== 'all' ? filterType : undefined,
          search: searchTerm || undefined
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-logs-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Export failed:', err);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'INVESTMENT':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'WITHDRAWAL':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'CLAIM':
      case 'EARNINGS':
        return <Activity className="h-4 w-4 text-yellow-400" />;
      case 'REFERRAL':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'ADMIN':
      case 'ADMIN_LOTTERY_WIN':
        return <AlertTriangle className="h-4 w-4 text-purple-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'DEPOSIT': 'bg-green-600',
      'WITHDRAWAL': 'bg-red-600',
      'INVESTMENT': 'bg-blue-600',
      'CLAIM': 'bg-yellow-600',
      'EARNINGS': 'bg-yellow-600',
      'REFERRAL': 'bg-purple-600',
      'ADMIN': 'bg-gray-600',
      'ADMIN_LOTTERY_WIN': 'bg-purple-600',
      'PROFILE_UPDATED': 'bg-orange-600',
      'ACCOUNT_FROZEN': 'bg-red-600'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-600'}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    if (amount === 0) return '-';
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount.toFixed(4)} USD`;
  };

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400">System and user activity logs</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
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
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="INVESTMENT">Investments</option>
              <option value="CLAIM">Claims</option>
              <option value="EARNINGS">Earnings</option>
              <option value="REFERRAL">Referrals</option>
              <option value="ADMIN">Admin Actions</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm">
            Activity Logs ({logs.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getLogIcon(log.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getTypeBadge(log.type)}
                          <span className="text-sm text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-white text-sm mb-1">
                          {log.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          User ID: {log.userId}
                          {log.sourceUserId && log.sourceUserId !== log.userId && (
                            <span> • Source: {log.sourceUserId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${
                        log.amount > 0 ? 'text-green-400' : 
                        log.amount < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {formatAmount(log.amount, log.type)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;


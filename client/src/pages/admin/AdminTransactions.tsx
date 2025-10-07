"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    username: string | null;
    telegramId: string;
  };
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'EARNINGS' | 'REFERRAL' | 'BONUS';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string;
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/transactions');
      setTransactions(response.data.data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'WITHDRAWAL':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'INVESTMENT':
        return <DollarSign className="h-4 w-4 text-blue-400" />;
      case 'EARNINGS':
        return <CheckCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-600',
      'COMPLETED': 'bg-green-600',
      'FAILED': 'bg-red-600',
      'CANCELLED': 'bg-gray-600'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-600'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'DEPOSIT': 'bg-green-600',
      'WITHDRAWAL': 'bg-red-600',
      'INVESTMENT': 'bg-blue-600',
      'EARNINGS': 'bg-yellow-600',
      'REFERRAL': 'bg-purple-600',
      'BONUS': 'bg-orange-600'
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-600'}>
        {type}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.telegramId.includes(searchTerm) ||
      transaction.id.includes(searchTerm);
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = filteredTransactions.filter(t => t.status === 'PENDING').length;
  const completedCount = filteredTransactions.filter(t => t.status === 'COMPLETED').length;

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
          <h1 className="text-2xl font-bold text-white">Transaction Management</h1>
          <p className="text-gray-400">Monitor and manage all financial transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-yellow-400">{totalAmount.toFixed(2)} USD</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="INVESTMENT">Investment</option>
              <option value="EARNINGS">Earnings</option>
              <option value="REFERRAL">Referral</option>
              <option value="BONUS">Bonus</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm">
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm text-gray-300">
                        {transaction.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-white">
                          {transaction.user.firstName || transaction.user.username || `User ${transaction.user.telegramId}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{transaction.user.username || 'N/A'} • {transaction.user.telegramId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.type)}
                        {getTypeBadge(transaction.type)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm">
                        <div className={`font-bold ${transaction.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-green-400'}`}>
                          {transaction.type === 'WITHDRAWAL' ? '-' : '+'}{transaction.amount.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-400">{transaction.currency}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
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

export default AdminTransactions;


"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingDown,
  ArrowLeft
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
  const navigate = useNavigate();
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
      // Show user-friendly error message
      alert('Failed to load transactions. Please try again later.');
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
    <div className="space-y-2 p-1">
      {/* Ultra Compact Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-md p-2 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <h1 className="text-lg font-bold">Transaction Management</h1>
          </div>
          <div className="text-xs text-green-100">
            {transactions.length} transactions
          </div>
        </div>
        <p className="text-green-100 text-xs">
          Monitor and manage all financial transactions
        </p>
      </div>

      {/* Ultra Compact Action Buttons */}
      <div className="grid grid-cols-1 gap-1">
        <Button variant="outline" size="sm" className="h-8 text-xs border-gray-600">
          <Download className="h-3 w-3 mr-1" />
          Export Transactions
        </Button>
      </div>

      {/* Ultra Compact Stats */}
      <div className="grid grid-cols-2 gap-1">
        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <CreditCard className="h-3 w-3 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-sm font-bold text-white">{filteredTransactions.length}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-yellow-400" />
            <div>
              <div className="text-xs text-gray-400">Amount</div>
              <div className="text-sm font-bold text-yellow-400">{totalAmount.toFixed(0)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Ultra Compact Filters */}
      <div className="grid grid-cols-1 gap-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 bg-gray-900 border-gray-700 text-white h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-white text-xs h-8"
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
            className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-white text-xs h-8"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

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


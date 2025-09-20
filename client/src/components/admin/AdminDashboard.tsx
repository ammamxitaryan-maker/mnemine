import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Search,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalVolume: number;
  dailyGrowth: number;
}

export const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'USER' | 'ADMIN'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'balance' | 'referrals'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { data: users, isLoading, error, refetch } = useAdminData();

  // Calculate admin statistics
  const stats: AdminStats = useMemo(() => {
    if (!users) return { totalUsers: 0, activeUsers: 0, totalVolume: 0, dailyGrowth: 0 };
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => 
      new Date(user.lastSeenAt || 0) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    const totalVolume = users.reduce((sum, user) => {
      const wallet = user.wallets.find(w => w.currency === 'CFM');
      return sum + (wallet?.balance || 0);
    }, 0);
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dailyGrowth = users.filter(user => 
      new Date(user.createdAt) > yesterday
    ).length;
    
    return { totalUsers, activeUsers, totalVolume, dailyGrowth };
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.telegramId.includes(searchTerm);
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
    
    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'balance':
          aValue = a.wallets.find(w => w.currency === 'CFM')?.balance || 0;
          bValue = b.wallets.find(w => w.currency === 'CFM')?.balance || 0;
          break;
        case 'referrals':
          aValue = a._count?.referrals || 0;
          bValue = b._count?.referrals || 0;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  }, [users, searchTerm, filterRole, sortBy, sortOrder]);

  const handleExportUsers = () => {
    if (!filteredUsers) return;
    
    const csvContent = [
      ['Telegram ID', 'Name', 'Username', 'Role', 'Balance', 'Referrals', 'Joined', 'Last Seen'],
      ...filteredUsers.map(user => [
        user.telegramId,
        user.firstName || '',
        user.username || '',
        user.role,
        user.wallets.find(w => w.currency === 'CFM')?.balance.toFixed(4) || '0',
        user._count?.referrals || 0,
        format(new Date(user.createdAt), 'yyyy-MM-dd'),
        user.lastSeenAt ? format(new Date(user.lastSeenAt), 'yyyy-MM-dd HH:mm') : 'Never'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have admin privileges to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and monitor platform activity</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExportUsers} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
                <p className="text-xs text-green-600">Last 24h</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVolume.toLocaleString()} CFM
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Growth</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.dailyGrowth}</p>
                <p className="text-xs text-blue-600">New users today</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, username, or Telegram ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Roles</option>
                <option value="USER">Users</option>
                <option value="ADMIN">Admins</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="balance-desc">Highest Balance</option>
                <option value="balance-asc">Lowest Balance</option>
                <option value="referrals-desc">Most Referrals</option>
                <option value="referrals-asc">Least Referrals</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Balance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Referrals</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Seen</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.firstName || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username || 'no-username'} • {user.telegramId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {user.wallets.find(w => w.currency === 'CFM')?.balance.toFixed(4) || '0.0000'} CFM
                      </td>
                      <td className="py-3 px-4 text-right">
                        {user._count?.referrals || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.lastSeenAt ? format(new Date(user.lastSeenAt), 'MMM d, HH:mm') : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button size="sm" variant="outline">
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

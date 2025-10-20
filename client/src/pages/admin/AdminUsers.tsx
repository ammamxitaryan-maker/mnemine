"use client";

import BulkActions from '@/components/admin/BulkActions';
import { ForceRefreshButton } from '@/components/ForceRefreshButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { AdminUser } from '@/types/admin';
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Download,
  Search,
  Trash2,
  Users,
  UserX
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Utility function to format last login time
const formatLastLogin = (lastSeenAt: string | null) => {
  if (!lastSeenAt) return 'Never';

  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeen.toLocaleDateString();
};

interface User {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  isFrozen: boolean;
  isSuspicious: boolean;
  isOnline: boolean;
  balance: number;
  nonBalance: number;
  usdBalance: number;
  totalInvested: number;
  totalSlotsCount: number;
  activeSlotsCount: number;
  createdAt: string;
  lastSeenAt: string;
  referralCount: number;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(50);


  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await api.get(`/admin/users?${params}`);
      const users = response.data.data.users || [];

      // Log balance information for debugging
      console.log('[AdminUsers] Fetched users with balance info:', users.map((user: AdminUser) => ({
        telegramId: user.telegramId,
        balance: user.balance,
        wallets: user.wallets
      })));

      setUsers(users);
      setTotalPages(response.data.data.totalPages || 1);
      setTotalUsers(response.data.data.totalUsers || 0);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.firstName || user?.username || `User ${user?.telegramId}`;

    try {
      switch (action) {
        case 'freeze': {
          const freezeReason = prompt(`Enter reason for freezing ${userName}'s account (optional):`);
          if (freezeReason !== null) { // User didn't cancel
            await api.post(`/admin/users/${userId}/freeze`, { reason: freezeReason });
            alert(`Account for ${userName} has been frozen successfully.`);
            await fetchUsers(); // Обновляем список после успешного действия
          }
          break;
        }
        case 'unfreeze':
          if (window.confirm(`Are you sure you want to unfreeze ${userName}'s account?`)) {
            await api.post(`/admin/users/${userId}/unfreeze`);
            alert(`Account for ${userName} has been unfrozen successfully.`);
            await fetchUsers();
          }
          break;
        case 'ban': {
          const banReason = prompt(`Enter reason for banning ${userName}'s account:`);
          if (banReason && banReason.trim()) {
            if (window.confirm(`Are you sure you want to ban ${userName}? This action will prevent them from accessing the platform.`)) {
              await api.post(`/admin/users/${userId}/ban`, { reason: banReason });
              alert(`Account for ${userName} has been banned successfully.`);
              await fetchUsers();
            }
          }
          break;
        }
        case 'unban':
          if (window.confirm(`Are you sure you want to unban ${userName}'s account?`)) {
            await api.post(`/admin/users/${userId}/unban`);
            alert(`Account for ${userName} has been unbanned successfully.`);
            await fetchUsers();
          }
          break;
        case 'balance': {
          const currentBalance = user?.nonBalance || 0;
          const newBalance = prompt(
            `💰 Balance Management for ${userName}\n\n` +
            `Current balance: ${currentBalance.toFixed(4)} NON\n\n` +
            `Enter new balance:`
          );

          if (newBalance !== null && newBalance.trim() !== '') {
            const amount = parseFloat(newBalance);
            if (!isNaN(amount) && amount >= 0) {
              try {
                const response = await api.post(`/admin/users/${userId}/balance`, {
                  action: 'set',
                  amount: amount
                });

                if (response.data.success) {
                  alert(`✅ Balance updated!\n\n` +
                    `User: ${userName}\n` +
                    `Previous: ${response.data.data.previousBalance.toFixed(4)} NON\n` +
                    `New: ${amount.toFixed(4)} NON\n\n` +
                    `The user will see the change immediately!`);

                  await fetchUsers();

                  // Force refresh user data cache with multiple approaches
                  console.log(`[AdminUsers] Dispatching userDataRefresh event for telegramId: ${user?.telegramId}`);

                  // Approach 1: Dispatch events
                  window.dispatchEvent(new CustomEvent('userDataRefresh', { detail: { telegramId: user?.telegramId } }));
                  window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { telegramId: user?.telegramId, newBalance: amount } }));
                  window.dispatchEvent(new CustomEvent('globalDataRefresh'));

                  console.log(`[AdminUsers] Events dispatched successfully`);
                } else {
                  alert(`❌ Error: ${response.data.error || 'Unknown error'}`);
                }
              } catch (error: any) {
                console.error('Balance update error:', error);
                alert(`❌ Error: ${error.response?.data?.error || error.message}`);
              }
            } else {
              alert('❌ Please enter a valid positive number');
            }
          }
          break;
        }
        case 'delete': {
          // Упрощенная логика подтверждения
          const confirmDelete = window.confirm(
            `⚠️ CRITICAL ACTION ⚠️\n\n` +
            `Are you sure you want to permanently delete ${userName}'s account?\n\n` +
            `This action CANNOT be undone and will remove ALL user data including:\n` +
            `• Account information\n` +
            `• Transaction history\n` +
            `• Investment records\n` +
            `• Referral data\n\n` +
            `Click OK to proceed with deletion.`
          );

          if (confirmDelete) {
            // Выполняем удаление без требования причины
            const response = await api.delete(`/admin/delete-user/${userId}`);

            if (response.data.success) {
              alert(`✅ Account for ${userName} has been permanently deleted.`);
              await fetchUsers(); // Обновляем список только после успешного удаления
            } else {
              alert(`❌ Failed to delete account: ${response.data.error || 'Unknown error'}`);
            }
          }
          break;
        }
      }
    } catch (err: any) {
      console.error(`Error ${action} user:`, err);
      alert(`Failed to ${action} user: ${err.response?.data?.error || 'Unknown error'}`);

      // Обновляем список только если это не было удаление (чтобы показать актуальное состояние)
      if (action !== 'delete') {
        await fetchUsers();
      }
    }
  };


  const handleDeleteAllUsers = async () => {
    const confirmText = 'DELETE ALL USERS';
    const userInput = prompt(
      `⚠️ CRITICAL ACTION ⚠️\n\n` +
      `This will permanently delete ALL users and their data.\n` +
      `This action CANNOT be undone!\n\n` +
      `Type "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      alert('Action cancelled. You must type the exact confirmation text.');
      return;
    }

    const reason = prompt('Enter reason for deleting all users:');
    if (!reason) {
      alert('Reason is required for this action.');
      return;
    }

    try {
      const response = await api.delete('/admin/delete-all-users', {
        data: { reason: reason }
      });

      if (response.data.success) {
        alert('✅ All users have been successfully deleted.');
        await fetchUsers(); // Refresh the user list only after successful deletion
      } else {
        alert(`❌ Failed to delete all users: ${response.data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error deleting all users:', err);
      alert(`❌ Failed to delete all users: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleExportUsers = () => {
    try {
      // Create CSV content
      const headers = [
        'ID',
        'Telegram ID',
        'First Name',
        'Username',
        'Email',
        'Role',
        'Status',
        'Balance (USD)',
        'Total Invested',
        'Created At',
        'Last Seen',
        'Referral Count'
      ];

      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          user.telegramId,
          user.firstName || '',
          user.username || '',
          user.email || '',
          user.role,
          user.isFrozen ? 'Frozen' : user.isSuspicious ? 'Suspicious' : user.isActive ? 'Active' : 'Inactive',
          user.nonBalance.toFixed(4),
          user.totalInvested.toFixed(2),
          new Date(user.createdAt).toISOString(),
          user.lastSeenAt ? new Date(user.lastSeenAt).toISOString() : '',
          user.referralCount
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users data');
    }
  };


  const getStatusBadge = (user: User) => {
    if (user.isFrozen) return <Badge variant="destructive">Frozen</Badge>;
    if (user.isSuspicious) return <Badge variant="destructive">Suspicious</Badge>;
    if (user.isOnline) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <Badge variant="default" className="bg-green-600 text-white">Online</Badge>
        </div>
      );
    }
    if (user.isActive) return <Badge variant="default">Active</Badge>;
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'ADMIN': 'bg-red-600',
      'STAFF': 'bg-blue-600',
      'USER': 'bg-gray-600'
    };
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-600'}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <p className="text-gray-400 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-800/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-blue-200 hover:bg-blue-800/30 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">User Management</h1>
                <p className="text-sm text-blue-200">Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</div>
                <div className="text-xs text-blue-200">Total Users</div>
              </div>
              <div className="h-8 w-px bg-blue-700"></div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-400">{users.filter(u => u.isOnline).length}</div>
                <div className="text-xs text-blue-200">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, username, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-blue-500/20"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="USER">User</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportUsers}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedUsers.length === 0}
              onClick={() => setShowBulkActions(true)}
              className="border-blue-600 text-blue-300 hover:bg-blue-700/20 hover:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk ({selectedUsers.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAllUsers}
              className="bg-red-600/20 border-red-600 text-red-300 hover:bg-red-600/30"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </div>
      </div>

      {/* Professional Data Table */}
      <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg mx-4 mt-4 overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-300">
                Showing <span className="font-semibold text-white">{users.length}</span> of{' '}
                <span className="font-semibold text-white">{totalUsers.toLocaleString()}</span> users
              </div>
              <div className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-slate-400">
                {selectedUsers.length} selected
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/30">
              <tr>
                <th className="text-left py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 min-w-[200px]">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-20">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-24">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-32">Balance</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-28">Activity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-24">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {(user.firstName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">
                          {user.firstName || user.username || `User ${user.telegramId}`}
                        </div>
                        <div className="text-sm text-slate-400 truncate">
                          @{user.username || 'N/A'} • ID: {user.telegramId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(user)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="font-mono text-sm text-yellow-400">
                        {user.nonBalance.toFixed(4)} NON
                      </div>
                      <div className="text-xs text-slate-400">
                        ${user.totalInvested.toFixed(2)} invested
                      </div>
                      <div className="text-xs text-blue-400">
                        {user.activeSlotsCount}/{user.totalSlotsCount} slots
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="text-sm text-slate-300">
                        {formatLastLogin(user.lastSeenAt)}
                      </div>
                      <div className="flex items-center text-xs">
                        <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-slate-400">{user.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="text-sm text-slate-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {user.referralCount} refs
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/user/${user.id}`)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        title="View Details"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      {user.isFrozen ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'unfreeze')}
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                          title="Unfreeze Account"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'freeze')}
                          className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                          title="Freeze Account"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'balance')}
                        className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        title="Manage Balance"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        title="Delete Account"
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

        {/* Mobile/Tablet View */}
        <div className="lg:hidden">
          <div className="space-y-3 p-4">
            {users.map((user) => (
              <div key={user.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
                {/* User Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 flex-shrink-0"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.firstName || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">
                        {user.firstName || user.username || `User ${user.telegramId}`}
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        @{user.username || 'N/A'} • ID: {user.telegramId}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRoleBadge(user.role)}
                    <div className="ml-2">
                      {getStatusBadge(user)}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Balance</div>
                    <div className="font-mono text-yellow-400 text-sm">
                      {user.nonBalance.toFixed(4)} NON
                    </div>
                    <div className="text-xs text-slate-400">
                      ${user.totalInvested.toFixed(2)} invested
                    </div>
                    <div className="text-xs text-blue-400">
                      {user.activeSlotsCount}/{user.totalSlotsCount} slots
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Activity</div>
                    <div className="text-sm text-slate-300">
                      {formatLastLogin(user.lastSeenAt)}
                    </div>
                    <div className="flex items-center text-xs">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                      <span className="text-slate-400">{user.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {user.referralCount} refs
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {user.isFrozen ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'unfreeze')}
                      className="text-green-400 hover:text-green-300 hover:bg-green-900/20 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unfreeze
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'freeze')}
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 text-xs"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Freeze
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUserAction(user.id, 'balance')}
                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20 text-xs"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Balance
                  </Button>
                  <ForceRefreshButton
                    telegramId={user.telegramId}
                    onRefresh={() => fetchUsers()}
                    className="text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUserAction(user.id, 'delete')}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Professional Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-800/30 border-t border-slate-700/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing <span className="font-semibold text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                <span className="font-semibold text-white">{totalUsers.toLocaleString()}</span> users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="text-slate-400 hover:text-white disabled:opacity-50"
                >
                  First
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 p-0 ${page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Next
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <BulkActions
          selectedUsers={selectedUsers}
          onClose={() => setShowBulkActions(false)}
          onSuccess={() => {
            setShowBulkActions(false);
            setSelectedUsers([]);
            fetchUsers();
          }}
        />
      )}

    </div>
  );
};

export default AdminUsers;


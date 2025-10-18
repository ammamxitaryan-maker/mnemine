"use client";

import BulkActions from '@/components/admin/BulkActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  DollarSign,
  Download,
  Search,
  Trash2,
  UserPlus,
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
  mneBalance: number;
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
      console.log('[AdminUsers] Fetched users with balance info:', users.map(user => ({
        telegramId: user.telegramId,
        balance: user.balance,
        mneBalance: user.mneBalance,
        usdBalance: user.usdBalance
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
          const currentBalance = user?.mneBalance || 0;
          const action = prompt(
            `Balance Management for ${userName}\n\n` +
            `Current balance: ${currentBalance.toFixed(4)} MNE\n\n` +
            `Choose action:\n` +
            `1. Set new balance\n` +
            `2. Add amount\n` +
            `3. Subtract amount\n\n` +
            `Enter: 1, 2, or 3`
          );

          if (action === '1') {
            const newBalance = prompt(`Enter new balance for ${userName} (current: ${currentBalance.toFixed(4)} MNE):`);
            if (newBalance !== null && newBalance.trim() !== '') {
              const amount = parseFloat(newBalance);
              if (!isNaN(amount) && amount >= 0) {
                try {
                  const response = await api.post(`/admin/users/${userId}/balance`, {
                    action: 'set',
                    amount: amount
                  });

                  if (response.data.success) {
                    alert(`✅ Balance set to ${amount.toFixed(4)} MNE for ${userName}\nPrevious balance: ${response.data.data.previousBalance.toFixed(4)} MNE`);
                    await fetchUsers();
                    // Force refresh user data cache
                    window.dispatchEvent(new CustomEvent('userDataRefresh', { detail: { telegramId: user?.telegramId } }));
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
          } else if (action === '2') {
            const addAmount = prompt(`Enter amount to ADD to ${userName}'s balance (current: ${currentBalance.toFixed(4)} MNE):`);
            if (addAmount !== null && addAmount.trim() !== '') {
              const amount = parseFloat(addAmount);
              if (!isNaN(amount) && amount > 0) {
                try {
                  const response = await api.post(`/admin/users/${userId}/balance`, {
                    action: 'add',
                    amount: amount
                  });

                  if (response.data.success) {
                    alert(`✅ Added ${amount.toFixed(4)} MNE to ${userName}'s balance\nNew balance: ${response.data.data.newBalance.toFixed(4)} MNE`);
                    await fetchUsers();
                    // Force refresh user data cache
                    window.dispatchEvent(new CustomEvent('userDataRefresh', { detail: { telegramId: user?.telegramId } }));
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
          } else if (action === '3') {
            const subtractAmount = prompt(`Enter amount to SUBTRACT from ${userName}'s balance (current: ${currentBalance.toFixed(4)} MNE):`);
            if (subtractAmount !== null && subtractAmount.trim() !== '') {
              const amount = parseFloat(subtractAmount);
              if (!isNaN(amount) && amount > 0) {
                try {
                  const response = await api.post(`/admin/users/${userId}/balance`, {
                    action: 'subtract',
                    amount: amount
                  });

                  if (response.data.success) {
                    alert(`✅ Subtracted ${amount.toFixed(4)} MNE from ${userName}'s balance\nNew balance: ${response.data.data.newBalance.toFixed(4)} MNE`);
                    await fetchUsers();
                    // Force refresh user data cache
                    window.dispatchEvent(new CustomEvent('userDataRefresh', { detail: { telegramId: user?.telegramId } }));
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
            const deleteReason = prompt(`Enter reason for deleting ${userName}'s account:`);
            if (deleteReason && deleteReason.trim()) {
              // Выполняем удаление
              const response = await api.delete(`/admin/delete-user/${userId}`, {
                data: { reason: deleteReason }
              });

              if (response.data.success) {
                alert(`✅ Account for ${userName} has been permanently deleted.`);
                await fetchUsers(); // Обновляем список только после успешного удаления
              } else {
                alert(`❌ Failed to delete account: ${response.data.error || 'Unknown error'}`);
              }
            } else {
              alert('❌ Deletion cancelled. Reason is required.');
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
          user.mneBalance.toFixed(4),
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
    <div className="space-y-2 p-1">
      {/* Ultra Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-md p-2 text-white">
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
            <h1 className="text-lg font-bold">User Management</h1>
          </div>
          <div className="text-xs text-blue-100">
            {totalUsers.toLocaleString()} users
          </div>
        </div>
        <p className="text-blue-100 text-xs">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Ultra Compact Action Buttons */}
      <div className="grid grid-cols-3 gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportUsers}
          className="h-8 text-xs border-gray-600"
        >
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAllUsers}
          className="h-8 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete All
        </Button>
        <Button size="sm" className="h-8 text-xs bg-blue-600">
          <UserPlus className="h-3 w-3 mr-1" />
          Add User
        </Button>
      </div>

      {/* Ultra Compact Search and Filters */}
      <div className="grid grid-cols-1 gap-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-7 bg-gray-900 border-gray-700 text-white h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-white text-xs h-8"
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
            className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-white text-xs h-8"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="suspicious">Suspicious</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>
              Users ({users.length} of {totalUsers.toLocaleString()}) •
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedUsers.length === 0}
                onClick={() => setShowBulkActions(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedUsers.length})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-800"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                    Status
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className="online-dot online-indicator"></span>
                      <span>Online</span>
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Last Login</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-600 bg-gray-800"
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
                        <div>
                          <div className="font-medium text-white">
                            {user.firstName || user.username || `User ${user.telegramId}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{user.username || 'N/A'} • {user.telegramId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-mono text-yellow-400">
                          {user.mneBalance.toFixed(4)} MNE
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.totalInvested.toFixed(2)} invested
                        </div>
                        <div className="text-xs text-blue-400">
                          {user.activeSlotsCount}/{user.totalSlotsCount} slots
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-300">
                        {formatLastLogin(user.lastSeenAt)}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        {user.isOnline ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                            Online
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                            Offline
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.referralCount} referrals
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/user/${user.id}`)}
                        >
                          View
                        </Button>
                        {user.isFrozen ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'unfreeze')}
                            title="Unfreeze Account"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'freeze')}
                            title="Freeze Account"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        {user.isSuspicious ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'unban')}
                            title="Unban Account"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'ban')}
                            title="Ban Account"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'balance')}
                          className="text-green-400 border-green-600 hover:bg-green-600/10"
                          title="Manage Balance"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-400 border-red-600 hover:bg-red-600/10"
                          title="Delete Account"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-800"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName || user.username || `User ${user.telegramId}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        @{user.username || 'N/A'} • {user.telegramId}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/user/${user.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Role</div>
                    <div>{getRoleBadge(user.role)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Status</div>
                    <div>{getStatusBadge(user)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Balance</div>
                    <div className="font-mono text-yellow-400 text-sm">
                      {user.mneBalance.toFixed(4)} MNE
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.totalInvested.toFixed(2)} invested
                    </div>
                    <div className="text-xs text-blue-400">
                      {user.activeSlotsCount}/{user.totalSlotsCount} slots
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Last Login</div>
                    <div className="text-sm text-gray-300">
                      {formatLastLogin(user.lastSeenAt)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center">
                      {user.isOnline ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          Online
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                          Offline
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Joined</div>
                    <div className="text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.referralCount} referrals
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-gray-700">
                  {user.isFrozen ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'unfreeze')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unfreeze
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'freeze')}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Freeze
                    </Button>
                  )}
                  {user.isSuspicious ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'unban')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'ban')}
                      className="flex-1"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Ban
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction(user.id, 'balance')}
                    className="text-green-400 border-green-600 hover:bg-green-600/10 flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Balance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction(user.id, 'delete')}
                    className="text-red-400 border-red-600 hover:bg-red-600/10 flex-1"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers.toLocaleString()} users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </Card>

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


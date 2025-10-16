"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  UserX, 
  Ban, 
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Trash2
} from 'lucide-react';
import BulkActions from '@/components/admin/BulkActions';
import { MobileUserCard } from '@/components/admin/MobileUserCard';

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
  balance: number;
  totalInvested: number;
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
      setUsers(response.data.data.users || []);
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
          }
          break;
        }
        case 'unfreeze':
          if (window.confirm(`Are you sure you want to unfreeze ${userName}'s account?`)) {
            await api.post(`/admin/users/${userId}/unfreeze`);
            alert(`Account for ${userName} has been unfrozen successfully.`);
          }
          break;
        case 'ban': {
          const banReason = prompt(`Enter reason for banning ${userName}'s account:`);
          if (banReason && banReason.trim()) {
            if (window.confirm(`Are you sure you want to ban ${userName}? This action will prevent them from accessing the platform.`)) {
              await api.post(`/admin/users/${userId}/ban`, { reason: banReason });
              alert(`Account for ${userName} has been banned successfully.`);
            }
          }
          break;
        }
        case 'unban':
          if (window.confirm(`Are you sure you want to unban ${userName}'s account?`)) {
            await api.post(`/admin/users/${userId}/unban`);
            alert(`Account for ${userName} has been unbanned successfully.`);
          }
          break;
        case 'delete':
          if (window.confirm(`⚠️ CRITICAL ACTION ⚠️\n\nAre you sure you want to permanently delete ${userName}'s account?\n\nThis action CANNOT be undone and will remove all user data including:\n- Account information\n- Transaction history\n- Investment records\n- Referral data\n\nType "DELETE" to confirm:`)) {
            const deleteReason = prompt(`Enter reason for deleting ${userName}'s account:`);
            if (deleteReason && deleteReason.trim()) {
              const finalConfirm = prompt(`Final confirmation: Type "PERMANENTLY DELETE" to confirm deletion of ${userName}'s account:`);
              if (finalConfirm === "PERMANENTLY DELETE") {
                await api.delete(`/admin/delete-user/${userId}`, { 
                  data: { reason: deleteReason } 
                });
                alert(`Account for ${userName} has been permanently deleted.`);
              } else {
                alert('Deletion cancelled. Confirmation text did not match.');
              }
            }
          }
          break;
      }
      fetchUsers();
    } catch (err: any) {
      console.error(`Error ${action} user:`, err);
      alert(`Failed to ${action} user: ${err.response?.data?.error || 'Unknown error'}`);
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
      await api.delete('/admin/delete-all-users', { 
        data: { reason: reason } 
      });
      alert('All users have been successfully deleted.');
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error deleting all users:', err);
      alert(`Failed to delete all users: ${err.response?.data?.error || 'Unknown error'}`);
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
          user.balance.toFixed(4),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Manage users, roles, and permissions • {totalUsers.toLocaleString()} total users
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={handleExportUsers}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={handleDeleteAllUsers}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Users
          </Button>
          <Button size="sm" className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
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
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="suspicious">Suspicious</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Balance</th>
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
                          {user.balance.toFixed(4)} USD
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.totalInvested.toFixed(2)} invested
                        </div>
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
                      {user.balance.toFixed(4)} USD
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.totalInvested.toFixed(2)} invested
                    </div>
                  </div>
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


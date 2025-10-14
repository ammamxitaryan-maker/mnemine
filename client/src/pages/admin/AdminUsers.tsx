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
  Download
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'freeze': {
          const freezeReason = prompt('Enter reason for freezing account (optional):');
          await api.post(`/admin/users/${userId}/freeze`, { reason: freezeReason });
          break;
        }
        case 'unfreeze':
          await api.post(`/admin/users/${userId}/unfreeze`);
          break;
        case 'ban': {
          const banReason = prompt('Enter reason for banning account:');
          if (banReason) {
            await api.post(`/admin/users/${userId}/ban`, { reason: banReason });
          }
          break;
        }
        case 'unban':
          await api.post(`/admin/users/${userId}/unban`);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const deleteReason = prompt('Enter reason for deleting account:');
            if (deleteReason) {
              await api.delete(`/admin/delete-user/${userId}`, { 
                data: { reason: deleteReason } 
              });
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telegramId.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive && !user.isFrozen) ||
      (filterStatus === 'frozen' && user.isFrozen) ||
      (filterStatus === 'suspicious' && user.isSuspicious);

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm">Manage users, roles, and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="USER">User</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="suspicious">Suspicious</option>
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
            <span>Users ({filteredUsers.length})</span>
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
                          setSelectedUsers(filteredUsers.map(u => u.id));
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
                {filteredUsers.map((user) => (
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
        </CardContent>
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


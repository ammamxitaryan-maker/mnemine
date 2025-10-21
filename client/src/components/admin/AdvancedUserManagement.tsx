"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import {
  Ban,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Filter,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Unlock,
  Users,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email?: string;
  phone?: string;
  telegramId: string;
  country?: string;
  city?: string;
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  role: 'user' | 'vip' | 'admin' | 'moderator';
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastActivity: string;
  registrationDate: string;
  loginCount: number;
  referralCount: number;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  riskScore: number;
  tags: string[];
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  country: string;
  kycStatus: string;
  riskLevel: string;
  dateRange: string;
  balanceRange: string;
  activityRange: string;
}

interface BulkAction {
  action: string;
  userIds: string[];
  data?: any;
}

const AdvancedUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    country: 'all',
    kycStatus: 'all',
    riskLevel: 'all',
    dateRange: 'all',
    balanceRange: 'all',
    activityRange: 'all'
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users/advanced');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.telegramId.includes(searchLower)
      );
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          filtered = filtered.filter(user => user.isActive && !user.isBanned);
          break;
        case 'inactive':
          filtered = filtered.filter(user => !user.isActive);
          break;
        case 'banned':
          filtered = filtered.filter(user => user.isBanned);
          break;
        case 'verified':
          filtered = filtered.filter(user => user.isVerified);
          break;
      }
    }

    if (filters.country !== 'all') {
      filtered = filtered.filter(user => user.country === filters.country);
    }

    if (filters.kycStatus !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === filters.kycStatus);
    }

    if (filters.riskLevel !== 'all') {
      switch (filters.riskLevel) {
        case 'low':
          filtered = filtered.filter(user => user.riskScore < 30);
          break;
        case 'medium':
          filtered = filtered.filter(user => user.riskScore >= 30 && user.riskScore < 70);
          break;
        case 'high':
          filtered = filtered.filter(user => user.riskScore >= 70);
          break;
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      await api.post(`/admin/users/${userId}/${action}`, data);
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action} user:`, error);
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      await api.post('/admin/users/bulk-action', {
        action,
        userIds: Array.from(selectedUsers),
        data
      });
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
    }
  };

  const exportUsers = async (format: 'csv' | 'excel') => {
    try {
      const response = await api.post('/admin/users/export', {
        format,
        filters,
        userIds: Array.from(selectedUsers)
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600';
      case 'moderator': return 'bg-orange-600';
      case 'vip': return 'bg-purple-600';
      default: return 'bg-blue-600';
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">👥 Расширенное управление пользователями</h2>
            <p className="text-gray-400 text-sm">Полный контроль над пользователями и их активностью</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button
            onClick={() => exportUsers('csv')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Всего пользователей</div>
                <div className="text-2xl font-bold text-white">{users.length}</div>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Активные</div>
                <div className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.isActive && !u.isBanned).length}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Заблокированные</div>
                <div className="text-2xl font-bold text-red-400">
                  {users.filter(u => u.isBanned).length}
                </div>
              </div>
              <Ban className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">VIP пользователи</div>
                <div className="text-2xl font-bold text-purple-400">
                  {users.filter(u => u.role === 'vip').length}
                </div>
              </div>
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <span>Фильтры и поиск</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Имя, username, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Роль</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Статус</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                  <SelectItem value="banned">Заблокированные</SelectItem>
                  <SelectItem value="verified">Верифицированные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">KYC статус</Label>
              <Select value={filters.kycStatus} onValueChange={(value) => setFilters({ ...filters, kycStatus: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="none">Не проходил</SelectItem>
                  <SelectItem value="pending">На рассмотрении</SelectItem>
                  <SelectItem value="approved">Одобрен</SelectItem>
                  <SelectItem value="rejected">Отклонен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Массовые действия */}
      {selectedUsers.size > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-yellow-400" />
              <span>Массовые действия ({selectedUsers.size} выбрано)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleBulkAction('activate')}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Активировать
              </Button>
              <Button
                onClick={() => handleBulkAction('deactivate')}
                variant="outline"
                size="sm"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Деактивировать
              </Button>
              <Button
                onClick={() => handleBulkAction('ban')}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Ban className="h-4 w-4 mr-2" />
                Заблокировать
              </Button>
              <Button
                onClick={() => handleBulkAction('unban')}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Разблокировать
              </Button>
              <Button
                onClick={() => handleBulkAction('sendMessage')}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Отправить сообщение
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Таблица пользователей */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Пользователи ({filteredUsers.length})</span>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedUsers(new Set(filteredUsers.map(u => u.id)))}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                Выбрать все
              </Button>
              <Button
                onClick={() => setSelectedUsers(new Set())}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                Очистить выбор
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Загрузка пользователей...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-gray-300">Пользователь</th>
                    <th className="text-left p-3 font-medium text-gray-300">Роль</th>
                    <th className="text-left p-3 font-medium text-gray-300">Статус</th>
                    <th className="text-left p-3 font-medium text-gray-300">Баланс</th>
                    <th className="text-left p-3 font-medium text-gray-300">KYC</th>
                    <th className="text-left p-3 font-medium text-gray-300">Риск</th>
                    <th className="text-left p-3 font-medium text-gray-300">Последняя активность</th>
                    <th className="text-right p-3 font-medium text-gray-300">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.firstName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-400">@{user.username}</div>
                            <div className="text-xs text-gray-500">{user.telegramId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getRoleColor(user.role)} text-white`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col space-y-1">
                          <Badge className={user.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                            {user.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                          {user.isBanned && (
                            <Badge className="bg-red-600">Заблокирован</Badge>
                          )}
                          {user.isVerified && (
                            <Badge className="bg-blue-600">Верифицирован</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-medium">
                          ${user.balance.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Деп: ${user.totalDeposits.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getKycStatusColor(user.kycStatus)} text-white`}>
                          {user.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className={`font-medium ${getRiskColor(user.riskScore)}`}>
                          {user.riskScore}/100
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-300">
                          {new Date(user.lastActivity).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.lastActivity).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end space-x-1">
                          <Button
                            onClick={() => handleUserAction(user.id, 'view')}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleUserAction(user.id, 'edit')}
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleUserAction(user.id, user.isBanned ? 'unban' : 'ban')}
                            size="sm"
                            variant="outline"
                            className={user.isBanned ? "border-green-600 text-green-400 hover:bg-green-600 hover:text-white" : "border-red-600 text-red-400 hover:bg-red-600 hover:text-white"}
                          >
                            {user.isBanned ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedUserManagement;

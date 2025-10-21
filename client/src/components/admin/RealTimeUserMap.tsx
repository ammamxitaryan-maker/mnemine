"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  Eye,
  EyeOff,
  Filter,
  Globe,
  MapPin,
  RefreshCw,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserLocation {
  id: string;
  userId: string;
  firstName: string;
  username: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  isOnline: boolean;
  activity: 'mining' | 'lottery' | 'wallet' | 'idle';
}

interface CountryStats {
  country: string;
  userCount: number;
  onlineCount: number;
  totalRevenue: number;
}

const RealTimeUserMap = () => {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineUsers, setShowOfflineUsers] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [mapView, setMapView] = useState<'world' | 'detailed'>('world');

  useEffect(() => {
    fetchUserLocations();
    const interval = setInterval(fetchUserLocations, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchUserLocations = async () => {
    try {
      setLoading(true);
      const [locationsRes, statsRes] = await Promise.all([
        api.get('/admin/users/locations'),
        api.get('/admin/users/country-stats')
      ]);

      setUserLocations(locationsRes.data.data || []);
      setCountryStats(statsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching user locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = userLocations.filter(user => {
    if (!showOfflineUsers && !user.isOnline) return false;
    if (selectedCountry !== 'all' && user.country !== selectedCountry) return false;
    return true;
  });

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'mining': return 'bg-green-500';
      case 'lottery': return 'bg-purple-500';
      case 'wallet': return 'bg-blue-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'mining': return '⛏️';
      case 'lottery': return '🎰';
      case 'wallet': return '💰';
      case 'idle': return '😴';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">🗺️ Real-time карта пользователей</h2>
            <p className="text-gray-400 text-sm">Географическое распределение активных пользователей</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchUserLocations}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button
            onClick={() => setMapView(mapView === 'world' ? 'detailed' : 'world')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {mapView === 'world' ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {mapView === 'world' ? 'Детальный вид' : 'Общий вид'}
          </Button>
        </div>
      </div>

      {/* Статистика по странам */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {countryStats.slice(0, 4).map((stat, index) => (
          <Card key={stat.country} className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">🌍 {stat.country}</div>
                  <div className="text-2xl font-bold text-white">{stat.userCount}</div>
                  <div className="text-xs text-green-400">
                    {stat.onlineCount} онлайн
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Доход</div>
                  <div className="text-lg font-bold text-green-400">
                    ${stat.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <span>Фильтры</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowOfflineUsers(!showOfflineUsers)}
                variant={showOfflineUsers ? "default" : "outline"}
                size="sm"
                className={showOfflineUsers ? "bg-blue-600" : "border-gray-600 text-gray-300"}
              >
                {showOfflineUsers ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                Показать офлайн
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Страна:</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Все страны</option>
                {countryStats.map(stat => (
                  <option key={stat.country} value={stat.country}>
                    {stat.country} ({stat.userCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Карта пользователей */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-green-400" />
              <span>Активные пользователи</span>
            </div>
            <Badge className="bg-green-600 text-white">
              {filteredUsers.filter(u => u.isOnline).length} онлайн
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Загрузка карты...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Легенда */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">⛏️ Майнинг</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">🎰 Лотерея</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">💰 Кошелек</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">😴 Неактивен</span>
                </div>
              </div>

              {/* Список пользователей */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${user.isOnline
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-gray-800 border-gray-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getActivityColor(user.activity)}`}></div>
                        <div>
                          <div className="font-medium text-white">
                            {user.firstName || 'Без имени'}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{user.username || 'без username'}
                          </div>
                        </div>
                      </div>
                      <Badge className={user.isOnline ? 'bg-green-600' : 'bg-gray-600'}>
                        {user.isOnline ? 'Онлайн' : 'Офлайн'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          {user.city}, {user.country}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getActivityIcon(user.activity)}</span>
                        <span className="text-sm text-gray-300 capitalize">
                          {user.activity === 'mining' ? 'Майнинг' :
                            user.activity === 'lottery' ? 'Лотерея' :
                              user.activity === 'wallet' ? 'Кошелек' : 'Неактивен'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Последняя активность: {new Date(user.lastSeen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Пользователи не найдены</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeUserMap;

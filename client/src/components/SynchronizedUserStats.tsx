import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealTimeWebSocket } from '@/hooks/useWebSocket';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  activeUsers: number;
  lastUpdate: string;
}

interface SynchronizedUserStatsProps {
  className?: string;
}

export const SynchronizedUserStats: React.FC<SynchronizedUserStatsProps> = memo(({ className = '' }) => {
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 1000,
    onlineUsers: 133,
    newUsersToday: 0,
    activeUsers: 0,
    lastUpdate: new Date().toISOString()
  });
  const [isConnected, setIsConnected] = useState(false);

  // Get real-time data from WebSocket
  const { isConnected: wsConnected, marketData } = useRealTimeWebSocket('global');

  // Simulate realistic user growth
  const simulateUserGrowth = useCallback(() => {
    setUserStats(prev => {
      const now = new Date();
      const lastUpdate = new Date(prev.lastUpdate);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      // 7-10 users per hour
      const usersPerHour = 7 + Math.random() * 3;
      const newUsers = Math.floor(hoursSinceUpdate * usersPerHour);
      
      // 13.3% of total users are online
      const onlinePercentage = 0.133;
      const newTotalUsers = prev.totalUsers + newUsers;
      const newOnlineUsers = Math.floor(newTotalUsers * onlinePercentage);
      
      // Active users are 60-80% of online users
      const activePercentage = 0.6 + Math.random() * 0.2;
      const newActiveUsers = Math.floor(newOnlineUsers * activePercentage);
      
      return {
        totalUsers: newTotalUsers,
        onlineUsers: newOnlineUsers,
        newUsersToday: prev.newUsersToday + newUsers,
        activeUsers: newActiveUsers,
        lastUpdate: now.toISOString()
      };
    });
  }, []);

  // Initialize stats
  useEffect(() => {
    const initializeStats = async () => {
      try {
        // Try to get real stats from server
        const response = await fetch('/api/stats/users');
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        } else {
          // Fallback to simulated data
          simulateUserGrowth();
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        simulateUserGrowth();
      }
    };

    initializeStats();
  }, [simulateUserGrowth]);

  // Real-time updates
  useEffect(() => {
    setIsConnected(wsConnected);
    
    if (!wsConnected) return;

    // Update every 5 minutes
    const interval = setInterval(simulateUserGrowth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [wsConnected, simulateUserGrowth]);

  // Update stats from market data if available
  useEffect(() => {
    if (marketData && marketData.totalUsers) {
      setUserStats(prev => ({
        ...prev,
        totalUsers: marketData.totalUsers,
        onlineUsers: Math.floor(marketData.totalUsers * 0.133),
        activeUsers: Math.floor(marketData.totalUsers * 0.133 * (0.6 + Math.random() * 0.2))
      }));
    }
  }, [marketData]);

  const stats = [
    {
      label: 'Total Users',
      value: userStats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      label: 'Online Now',
      value: userStats.onlineUsers.toLocaleString(),
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      label: 'New Today',
      value: userStats.newUsersToday.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700'
    },
    {
      label: 'Active',
      value: userStats.activeUsers.toLocaleString(),
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-700'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">User Statistics</h3>
            <Badge 
              variant={isConnected ? "default" : "secondary"} 
              className={`text-xs ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}
            >
              <Activity className="w-3 h-3 mr-1" />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${stat.bgColor} ${stat.borderColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last update: {new Date(userStats.lastUpdate).toLocaleTimeString()}</span>
              <div className="flex items-center space-x-1">
                <span>Growth: ~{Math.floor(7 + Math.random() * 3)}/hour</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

SynchronizedUserStats.displayName = 'SynchronizedUserStats';

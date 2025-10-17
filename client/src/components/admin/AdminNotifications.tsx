/**
 * Система уведомлений для админ панели
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NOTIFICATION_CONFIG } from '@/config/adminConfig';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useState } from 'react';

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

// Контекст уведомлений
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

// Хук для работы с уведомлениями
export const useNotifications = (): NotificationContextType => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Автоматически удаляем уведомления через определенное время
    if (!notification.persistent) {
      const duration = NOTIFICATION_CONFIG.DURATION[notification.type.toUpperCase() as keyof typeof NOTIFICATION_CONFIG.DURATION];
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
  };
};

// Компонент отдельного уведомления
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onRemove, onMarkAsRead }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Alert className={cn('border-l-4', getColorClasses(), !notification.read && 'bg-gray-800/50')}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">{notification.title}</h4>
              <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
            </div>
            <AlertDescription className="text-gray-300 mt-1">
              {notification.message}
            </AlertDescription>
            {notification.actions && (
              <div className="flex items-center gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(notification.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

// Компонент центра уведомлений
interface NotificationCenterProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  unreadCount: number;
  className?: string;
}

export const NotificationCenter = ({
  notifications,
  onRemove,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  unreadCount,
  className,
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-400 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden z-50 bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount} unread
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMarkAllAsRead}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRemove={onRemove}
                        onMarkAsRead={onMarkAsRead}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Компонент тостов
interface ToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export const Toast = ({ notification, onRemove }: ToastProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info': return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <Card className={cn('w-80 bg-gray-900 border-gray-700 shadow-lg', getColorClasses())}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{notification.title}</h4>
            <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(notification.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

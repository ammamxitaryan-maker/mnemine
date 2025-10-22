"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Target
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'active' | 'inactive' | 'vip' | 'new' | 'custom';
  customFilters?: {
    minBalance?: number;
    maxBalance?: number;
    registrationDate?: string;
    lastActivity?: string;
    country?: string;
    hasInvestments?: boolean;
  };
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentAt?: string;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
}

interface UserSegment {
  name: string;
  description: string;
  count: number;
  filters: Record<string, any>;
}

interface BroadcastStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  avgDeliveryTime: number;
}

const BroadcastMessenger = () => {
  const [message, setMessage] = useState<Partial<BroadcastMessage>>({
    title: '',
    content: '',
    targetAudience: 'all',
    status: 'draft'
  });
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [stats, setStats] = useState<BroadcastStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);

  useEffect(() => {
    fetchUserSegments();
    fetchStats();
  }, []);

  useEffect(() => {
    if (message.targetAudience) {
      calculateRecipients();
    }
  }, [message.targetAudience, message.customFilters]);

  const fetchUserSegments = async () => {
    try {
      const response = await api.get('/admin/broadcast/segments');
      setUserSegments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching user segments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/broadcast/stats');
      setStats(response.data.data || null);
    } catch (error) {
      console.error('Error fetching broadcast stats:', error);
    }
  };

  const calculateRecipients = async () => {
    try {
      const response = await api.post('/admin/broadcast/calculate-recipients', {
        targetAudience: message.targetAudience,
        customFilters: message.customFilters
      });
      setEstimatedRecipients(response.data.data.count || 0);
    } catch (error) {
      console.error('Error calculating recipients:', error);
      setEstimatedRecipients(0);
    }
  };

  const handleSendMessage = async (immediate = true) => {
    if (!message.title || !message.content) {
      alert('❌ Пожалуйста, заполните заголовок и содержание сообщения!');
      return;
    }

    if (estimatedRecipients === 0) {
      alert('❌ Нет получателей для отправки сообщения!');
      return;
    }

    const confirmMessage = `Отправить сообщение "${message.title}" ${estimatedRecipients} получателям?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      const response = await api.post('/admin/broadcast/send', {
        ...message,
        immediate,
        status: immediate ? 'sending' : 'scheduled'
      });

      if (response.data.success) {
        alert('✅ Сообщение успешно отправлено!');
        setMessage({
          title: '',
          content: '',
          targetAudience: 'all',
          status: 'draft'
        });
        setEstimatedRecipients(0);
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`❌ Ошибка отправки: ${error.response?.data?.error || 'Неизвестная ошибка'}`);
    } finally {
      setSending(false);
    }
  };

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'Все пользователи';
      case 'active': return 'Активные пользователи';
      case 'inactive': return 'Неактивные пользователи';
      case 'vip': return 'VIP пользователи';
      case 'new': return 'Новые пользователи';
      case 'custom': return 'Пользовательский фильтр';
      default: return audience;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-600';
      case 'scheduled': return 'bg-yellow-600';
      case 'sending': return 'bg-blue-600';
      case 'sent': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-6 w-6 text-blue-400" />
        <div>
          <h2 className="text-xl font-bold text-white">📢 Массовая рассылка сообщений</h2>
          <p className="text-gray-400 text-sm">Отправка уведомлений всем пользователям или выбранным группам</p>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Отправлено</div>
                  <div className="text-2xl font-bold text-white">{stats.totalSent}</div>
                </div>
                <Send className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Доставлено</div>
                  <div className="text-2xl font-bold text-green-400">{stats.totalDelivered}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Прочитано</div>
                  <div className="text-2xl font-bold text-purple-400">{stats.totalRead}</div>
                </div>
                <Eye className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Доставляемость</div>
                  <div className="text-2xl font-bold text-white">{stats.deliveryRate.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Чтение</div>
                  <div className="text-sm text-gray-300">{stats.readRate.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Сегменты пользователей */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-400" />
            <span>Сегменты пользователей</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSegments.map((segment) => (
              <div
                key={segment.name}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${message.targetAudience === segment.name
                  ? 'bg-blue-900/20 border-blue-600'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                onClick={() => setMessage({ ...message, targetAudience: segment.name as any })}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{segment.name}</h3>
                  <Badge className="bg-blue-600 text-white">{segment.count}</Badge>
                </div>
                <p className="text-sm text-gray-400">{segment.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Создание сообщения */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span>Создание сообщения</span>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {previewMode ? 'Скрыть' : 'Предпросмотр'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Заголовок */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-medium">
                📝 Заголовок сообщения
              </Label>
              <Input
                id="title"
                value={message.title || ''}
                onChange={(e) => setMessage({ ...message, title: e.target.value })}
                placeholder="Введите заголовок сообщения..."
                className="bg-gray-800 border-gray-600 text-white"
                maxLength={100}
              />
              <div className="text-xs text-gray-400">
                {(message.title || '').length}/100 символов
              </div>
            </div>

            {/* Содержание */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white font-medium">
                💬 Содержание сообщения
              </Label>
              <Textarea
                id="content"
                value={message.content || ''}
                onChange={(e) => setMessage({ ...message, content: e.target.value })}
                placeholder="Введите текст сообщения..."
                className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                maxLength={1000}
              />
              <div className="text-xs text-gray-400">
                {(message.content || '').length}/1000 символов
              </div>
            </div>

            {/* Целевая аудитория */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                🎯 Целевая аудитория
              </Label>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {getTargetAudienceLabel(message.targetAudience || 'all')}
                    </div>
                    <div className="text-sm text-gray-400">
                      Получателей: {estimatedRecipients.toLocaleString()}
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {estimatedRecipients} пользователей
                  </Badge>
                </div>
              </div>
            </div>

            {/* Предпросмотр */}
            {previewMode && (
              <div className="space-y-2">
                <Label className="text-white font-medium">
                  👁️ Предпросмотр сообщения
                </Label>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <div className="space-y-3">
                    <div className="font-medium text-white text-lg">
                      {message.title || 'Заголовок сообщения'}
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {message.content || 'Содержание сообщения...'}
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                      Получателей: {estimatedRecipients} • Отправка: немедленно
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Действия */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
              <Button
                onClick={() => handleSendMessage(true)}
                disabled={sending || !message.title || !message.content || estimatedRecipients === 0}
                variant="gradient"
                className="shimmer-button ripple-button modern-button"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Отправка...' : 'Отправить сейчас'}
              </Button>

              <Button
                onClick={() => handleSendMessage(false)}
                disabled={sending || !message.title || !message.content || estimatedRecipients === 0}
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white modern-button"
              >
                <Clock className="h-4 w-4 mr-2" />
                Запланировать
              </Button>

              <Button
                onClick={() => {
                  setMessage({
                    title: '',
                    content: '',
                    targetAudience: 'all',
                    status: 'draft'
                  });
                  setEstimatedRecipients(0);
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 modern-button"
              >
                Очистить
              </Button>
            </div>

            {/* Предупреждения */}
            {estimatedRecipients > 1000 && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div>
                    <div className="font-medium text-yellow-400">Большое количество получателей</div>
                    <div className="text-sm text-yellow-300">
                      Отправка сообщения {estimatedRecipients} пользователям может занять несколько минут.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastMessenger;

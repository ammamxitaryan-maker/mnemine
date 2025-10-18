"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Crown,
  DollarSign,
  Play,
  RefreshCw,
  Search,
  Ticket,
  User,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LotteryData {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING';
  jackpot: number;
  participants: number;
  tickets: number;
  startDate: string;
  endDate: string;
  winner?: {
    id: string;
    firstName: string;
    username: string;
    ticketId: string;
  };
}

interface LotteryTicket {
  id: string;
  userId: string;
  user: {
    firstName: string;
    username: string;
    telegramId: string;
  };
  numbers: number[];
  purchaseDate: string;
  isWinner: boolean;
}

const AdminLottery = () => {
  const navigate = useNavigate();
  const [lottery, setLottery] = useState<LotteryData | null>(null);
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<LotteryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);

  useEffect(() => {
    fetchLotteryData();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm]);

  const fetchLotteryData = async () => {
    try {
      setLoading(true);
      const [lotteryResponse, ticketsResponse] = await Promise.all([
        api.get('/admin/lottery/current'),
        api.get('/admin/lottery/tickets')
      ]);

      setLottery(lotteryResponse.data.data);
      setTickets(ticketsResponse.data.data.tickets || []);
    } catch (err: any) {
      console.error('Error fetching lottery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    if (!searchTerm.trim()) {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(ticket =>
        ticket.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.telegramId.includes(searchTerm)
      );
      setFilteredTickets(filtered);
    }
  };

  const handleLotteryAction = async (action: string) => {
    try {
      setActionLoading(true);
      let response;

      switch (action) {
        case 'start':
          response = await api.post('/admin/lottery/start');
          break;
        case 'complete':
          if (!selectedWinner) {
            alert('❌ Please select a winner first!');
            return;
          }
          response = await api.post('/admin/lottery/complete', {
            winnerTicketId: selectedWinner
          });
          break;
        case 'reset':
          response = await api.post('/admin/lottery/reset');
          setSelectedWinner('');
          setShowWinnerSelection(false);
          break;
        default:
          throw new Error('Invalid action');
      }

      if (response.data.success) {
        await fetchLotteryData();
        alert(`✅ ${action} completed successfully!`);
        if (action === 'complete') {
          setShowWinnerSelection(false);
        }
      }
    } catch (err: any) {
      console.error(`Error ${action} lottery:`, err);
      alert(`❌ Failed to ${action} lottery: ${err.response?.data?.error || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectWinner = (ticketId: string) => {
    setSelectedWinner(ticketId);
    setShowWinnerSelection(true);
  };

  const handleAwardPrize = async () => {
    if (!selectedWinner) {
      alert('❌ Please select a winner first!');
      return;
    }

    const confirmMessage = `Are you sure you want to award the jackpot of $${lottery?.jackpot.toFixed(2)} to the selected winner?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post('/admin/lottery/award-prize', {
        winnerTicketId: selectedWinner,
        amount: lottery?.jackpot || 0
      });

      if (response.data.success) {
        await fetchLotteryData();
        alert('🎉 Prize awarded successfully!');
        setShowWinnerSelection(false);
        setSelectedWinner('');
      }
    } catch (err: any) {
      console.error('Error awarding prize:', err);
      alert(`❌ Failed to award prize: ${err.response?.data?.error || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white animate-pulse">🟢 Активна</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-600 text-white">🏆 Завершена</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600 text-white">⏳ Ожидает</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">Loading lottery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-gray-300 hover:text-white h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">🎰 Lottery Management</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Управление лотереей и выбором победителей</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchLotteryData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Current Lottery Status */}
      {lottery && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-purple-400" />
                <span>🎰 Текущая лотерея</span>
              </div>
              {getStatusBadge(lottery.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-lg border border-green-700">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">${lottery.jackpot.toFixed(2)}</div>
                <div className="text-sm text-gray-400">💰 Джекпот</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg border border-blue-700">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{lottery.participants}</div>
                <div className="text-sm text-gray-400">👥 Участников</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-lg border border-purple-700">
                <Ticket className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{lottery.tickets}</div>
                <div className="text-sm text-gray-400">🎫 Билетов продано</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/20 rounded-lg border border-orange-700">
                <Calendar className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">
                  {new Date(lottery.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-400">📅 Дата окончания</div>
              </div>
            </div>

            {/* Winner Information */}
            {lottery.winner && (
              <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  🏆 Победитель лотереи
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-lg">
                      👤 {lottery.winner.firstName} (@{lottery.winner.username})
                    </div>
                    <div className="text-sm text-gray-300">
                      🎫 Билет ID: {lottery.winner.ticketId}
                    </div>
                    <div className="text-yellow-400 font-bold">
                      💰 Выигрыш: ${lottery.jackpot.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {lottery.status === 'PENDING' && (
                <Button
                  onClick={() => handleLotteryAction('start')}
                  disabled={actionLoading}
                  size="mobile"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg min-h-[44px] touch-manipulation"
                >
                  <Play className="h-4 w-4 mr-2" />
                  🚀 Запустить лотерею
                </Button>
              )}

              {lottery.status === 'ACTIVE' && (
                <Button
                  onClick={() => handleLotteryAction('complete')}
                  disabled={actionLoading || !selectedWinner}
                  size="mobile"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg min-h-[44px] touch-manipulation"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  🏁 Завершить лотерею
                </Button>
              )}

              <Button
                onClick={() => handleLotteryAction('reset')}
                disabled={actionLoading}
                variant="outline"
                size="mobile"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white min-h-[44px] touch-manipulation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                🔄 Сбросить лотерею
              </Button>
            </div>

            {lottery.status === 'ACTIVE' && !selectedWinner && (
              <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Для завершения лотереи необходимо выбрать победителя из списка билетов ниже
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-400" />
            <span>Поиск билетов</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по имени, username или Telegram ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <div className="mt-3 text-sm text-gray-400">
            Найдено билетов: {filteredTickets.length} из {tickets.length}
          </div>
        </CardContent>
      </Card>

      {/* Winner Selection Panel */}
      {showWinnerSelection && selectedWinner && (
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-400">
              <Crown className="h-5 w-5" />
              <span>Выбор победителя</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-yellow-600">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🏆 Выбранный победитель</h3>
                {(() => {
                  const winnerTicket = tickets.find(t => t.id === selectedWinner);
                  return winnerTicket ? (
                    <div className="space-y-2">
                      <div className="text-white font-medium">
                        👤 {winnerTicket.user.firstName} (@{winnerTicket.user.username})
                      </div>
                      <div className="text-gray-300 text-sm">
                        🎫 Билет ID: {winnerTicket.id}
                      </div>
                      <div className="text-gray-300 text-sm">
                        🔢 Номера: {winnerTicket.numbers.join(', ')}
                      </div>
                      <div className="text-yellow-400 font-bold">
                        💰 Выигрыш: ${lottery?.jackpot.toFixed(2)}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleAwardPrize}
                  disabled={actionLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Начислить выигрыш
                </Button>
                <Button
                  onClick={() => {
                    setShowWinnerSelection(false);
                    setSelectedWinner('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-purple-400" />
              <span>Билеты лотереи</span>
            </div>
            <Badge className="bg-purple-600 text-white">
              {filteredTickets.length} билетов
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Билеты не найдены' : 'Билеты не найдены'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${ticket.isWinner
                      ? 'bg-green-900/20 border-green-700 shadow-lg shadow-green-900/20'
                      : selectedWinner === ticket.id
                        ? 'bg-yellow-900/20 border-yellow-600 shadow-lg shadow-yellow-900/20'
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          👤 {ticket.user.firstName || 'Без имени'}
                          {ticket.user.username && <span className="text-gray-400"> (@{ticket.user.username})</span>}
                        </div>
                        <div className="text-sm text-gray-400">
                          🎫 ID: {ticket.id.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-400">
                          🔢 Номера: <span className="font-mono text-purple-300">{ticket.numbers.join(', ')}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          📅 {new Date(ticket.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {ticket.isWinner && (
                        <Badge className="bg-green-600 text-white animate-pulse">
                          <Crown className="h-3 w-3 mr-1" />
                          Победитель
                        </Badge>
                      )}
                      {lottery?.status === 'ACTIVE' && !ticket.isWinner && (
                        <Button
                          onClick={() => handleSelectWinner(ticket.id)}
                          size="sm"
                          className={`${selectedWinner === ticket.id
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-gray-700 hover:bg-gray-600'
                            } text-white`}
                        >
                          {selectedWinner === ticket.id ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Выбран
                            </>
                          ) : (
                            <>
                              <Crown className="h-4 w-4 mr-1" />
                              Выбрать
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLottery;

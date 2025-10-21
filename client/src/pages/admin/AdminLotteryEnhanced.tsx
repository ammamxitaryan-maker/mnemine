"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Award,
  Calendar,
  ChevronDown,
  ChevronRight,
  Crown,
  DollarSign,
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
  numbers: string;
  isWinner: boolean;
  prizeAmount?: number;
  purchaseDate: string;
}

interface LotteryParticipant {
  id: string;
  firstName: string;
  username: string;
  telegramId: string;
  ticketCount: number;
  tickets: LotteryTicket[];
  hasWinningTicket: boolean;
}

interface ParticipantsData {
  participants: LotteryParticipant[];
  totalParticipants: number;
  totalTickets: number;
}

const AdminLotteryEnhanced = () => {
  const navigate = useNavigate();
  const [lottery, setLottery] = useState<LotteryData | null>(null);
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [customPrizeAmount, setCustomPrizeAmount] = useState<number>(0);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [filteredParticipants, setFilteredParticipants] = useState<LotteryParticipant[]>([]);

  useEffect(() => {
    fetchLotteryData();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participantsData, searchTerm]);

  const fetchLotteryData = async () => {
    try {
      setLoading(true);
      const [lotteryResponse, participantsResponse] = await Promise.all([
        api.get('/admin/lottery/current'),
        api.get('/admin/lottery/participants-grouped')
      ]);

      setLottery(lotteryResponse.data.data);
      setParticipantsData(participantsResponse.data.data);

      // Set default prize amount to current jackpot
      if (lotteryResponse.data.data) {
        setCustomPrizeAmount(lotteryResponse.data.data.jackpot);
      }
    } catch (err: any) {
      console.error('Error fetching lottery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    if (!participantsData) {
      setFilteredParticipants([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredParticipants(participantsData.participants);
    } else {
      const filtered = participantsData.participants.filter(participant =>
        participant.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.telegramId.includes(searchTerm)
      );
      setFilteredParticipants(filtered);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handleSelectTicket = (ticketId: string, userId: string) => {
    setSelectedTicket(ticketId);
    setSelectedUser(userId);
    setShowWinnerSelection(true);
  };

  const handleAwardPrize = async () => {
    if (!selectedTicket || customPrizeAmount <= 0) {
      alert('❌ Please select a ticket and enter a valid prize amount!');
      return;
    }

    const confirmMessage = `Are you sure you want to award $${customPrizeAmount.toFixed(2)} to the selected ticket?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post('/admin/lottery/award-prize', {
        winnerTicketId: selectedTicket,
        amount: customPrizeAmount
      });

      if (response.data.success) {
        await fetchLotteryData();
        alert('🎉 Prize awarded successfully!');
        setShowWinnerSelection(false);
        setSelectedTicket('');
        setSelectedUser('');
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
                <div className="text-2xl font-bold text-white">{participantsData?.totalParticipants || 0}</div>
                <div className="text-sm text-gray-400">👥 Участников</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-lg border border-purple-700">
                <Ticket className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{participantsData?.totalTickets || 0}</div>
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
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-400" />
            <span>Поиск участников</span>
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
            Найдено участников: {filteredParticipants.length} из {participantsData?.totalParticipants || 0}
          </div>
        </CardContent>
      </Card>

      {/* Winner Selection Panel */}
      {showWinnerSelection && selectedTicket && (
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
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🏆 Выбранный билет</h3>
                {(() => {
                  const selectedParticipant = participantsData?.participants.find(p => p.id === selectedUser);
                  const selectedTicketData = selectedParticipant?.tickets.find(t => t.id === selectedTicket);
                  return selectedTicketData && selectedParticipant ? (
                    <div className="space-y-2">
                      <div className="text-white font-medium">
                        👤 {selectedParticipant.firstName} (@{selectedParticipant.username})
                      </div>
                      <div className="text-gray-300 text-sm">
                        🎫 Билет ID: {selectedTicketData.id}
                      </div>
                      <div className="text-gray-300 text-sm">
                        🔢 Номера: {selectedTicketData.numbers}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="space-y-3">
                <Label htmlFor="prize-amount" className="text-yellow-400 font-medium">
                  💰 Сумма приза (USD)
                </Label>
                <Input
                  id="prize-amount"
                  type="number"
                  value={customPrizeAmount}
                  onChange={(e) => setCustomPrizeAmount(Number(e.target.value))}
                  placeholder="Введите сумму приза"
                  className="bg-gray-800 border-gray-600 text-white"
                  min="0"
                  step="0.01"
                />
                <div className="text-sm text-gray-400">
                  Текущий джекпот: ${lottery?.jackpot.toFixed(2)}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleAwardPrize}
                  disabled={actionLoading || customPrizeAmount <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Начислить выигрыш
                </Button>
                <Button
                  onClick={() => {
                    setShowWinnerSelection(false);
                    setSelectedTicket('');
                    setSelectedUser('');
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

      {/* Participants List */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Участники лотереи</span>
            </div>
            <Badge className="bg-blue-600 text-white">
              {filteredParticipants.length} участников
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Участники не найдены' : 'Участники не найдены'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${participant.hasWinningTicket
                      ? 'bg-green-900/20 border-green-700 shadow-lg shadow-green-900/20'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserExpansion(participant.id)}
                        className="p-1 h-8 w-8 text-gray-400 hover:text-white"
                      >
                        {expandedUsers.has(participant.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          👤 {participant.firstName || 'Без имени'}
                          {participant.username && <span className="text-gray-400"> (@{participant.username})</span>}
                        </div>
                        <div className="text-sm text-gray-400">
                          🎫 Билетов: {participant.ticketCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          📱 ID: {participant.telegramId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {participant.hasWinningTicket && (
                        <Badge className="bg-green-600 text-white animate-pulse">
                          <Crown className="h-3 w-3 mr-1" />
                          Победитель
                        </Badge>
                      )}
                      <Badge className="bg-purple-600 text-white">
                        {participant.ticketCount} билетов
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded tickets view */}
                  {expandedUsers.has(participant.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">🎫 Билеты пользователя:</h4>
                      <div className="grid gap-2">
                        {participant.tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className={`p-3 rounded-lg border ${ticket.isWinner
                                ? 'bg-green-900/30 border-green-600'
                                : 'bg-gray-700 border-gray-600'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm text-white font-medium">
                                  🎫 Билет ID: {ticket.id.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-gray-400">
                                  🔢 Номера: <span className="font-mono text-purple-300">{ticket.numbers}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  📅 {new Date(ticket.purchaseDate).toLocaleDateString()}
                                </div>
                                {ticket.isWinner && ticket.prizeAmount && (
                                  <div className="text-xs text-green-400 font-bold">
                                    💰 Выигрыш: ${ticket.prizeAmount.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {ticket.isWinner && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Победитель
                                  </Badge>
                                )}
                                {!ticket.isWinner && lottery?.status === 'ACTIVE' && (
                                  <Button
                                    onClick={() => handleSelectTicket(ticket.id, participant.id)}
                                    size="sm"
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    Выбрать
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLotteryEnhanced;

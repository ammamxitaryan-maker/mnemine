"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Users, 
  DollarSign, 
  Calendar,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Crown,
  Award,
  User,
  Filter
} from 'lucide-react';

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
          response = await api.post('/admin/lottery/complete', { 
            winnerTicketId: selectedWinner 
          });
          break;
        case 'reset':
          response = await api.post('/admin/lottery/reset');
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (response.data.success) {
        await fetchLotteryData();
        alert(`✅ ${action} completed successfully!`);
      }
    } catch (err: any) {
      console.error(`Error ${action} lottery:`, err);
      alert(`❌ Failed to ${action} lottery: ${err.response?.data?.error || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white">Active</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-600 text-white">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
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
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Lottery Management</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Manage lottery draws and winners</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchLotteryData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
                <span>Current Lottery</span>
              </div>
              {getStatusBadge(lottery.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">${lottery.jackpot.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Jackpot</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{lottery.participants}</div>
                <div className="text-sm text-gray-400">Participants</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <Ticket className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{lottery.tickets}</div>
                <div className="text-sm text-gray-400">Tickets Sold</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">
                  {new Date(lottery.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-400">End Date</div>
              </div>
            </div>

            {/* Winner Information */}
            {lottery.winner && (
              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-2">🏆 Winner</h3>
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium text-white">
                      {lottery.winner.firstName} (@{lottery.winner.username})
                    </div>
                    <div className="text-sm text-gray-400">
                      Ticket ID: {lottery.winner.ticketId}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {lottery.status === 'PENDING' && (
                <Button
                  onClick={() => handleLotteryAction('start')}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Lottery
                </Button>
              )}
              
              {lottery.status === 'ACTIVE' && (
                <Button
                  onClick={() => handleLotteryAction('complete')}
                  disabled={actionLoading || !selectedWinner}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Lottery
                </Button>
              )}
              
              <Button
                onClick={() => handleLotteryAction('reset')}
                disabled={actionLoading}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Lottery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-purple-400" />
            <span>Lottery Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-lg border ${
                    ticket.isWinner 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-white">
                          {ticket.user.firstName} (@{ticket.user.username})
                        </div>
                        <div className="text-sm text-gray-400">
                          Ticket ID: {ticket.id}
                        </div>
                        <div className="text-sm text-gray-400">
                          Numbers: {ticket.numbers.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {ticket.isWinner && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                      {lottery?.status === 'ACTIVE' && !ticket.isWinner && (
                        <input
                          type="radio"
                          name="winner"
                          value={ticket.id}
                          checked={selectedWinner === ticket.id}
                          onChange={(e) => setSelectedWinner(e.target.value)}
                          className="text-blue-600"
                        />
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

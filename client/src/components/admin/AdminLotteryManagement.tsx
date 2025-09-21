import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LotteryParticipant {
  id: string;
  telegramId: string;
  firstName: string;
  username: string;
  cfmBalance: number;
  ticketCount: number;
  tickets: Array<{
    id: string;
    numbers: string;
    isWinner: boolean;
    prizeAmount?: number;
    isAdminSelected: boolean;
    createdAt: string;
  }>;
  isWinner: boolean;
  totalWinnings: number;
}

interface LotteryStats {
  lotteryId: string;
  jackpot: number;
  drawDate: string;
  totalTickets: number;
  totalParticipants: number;
  totalRevenue: number;
  winnersCount: number;
  totalPrizes: number;
  adminSelectedWinners: number;
  remainingJackpot: number;
}

interface Lottery {
  id: string;
  drawDate: string;
  jackpot: number;
  isDrawn: boolean;
}

interface LotteryData {
  lottery: Lottery;
  participants: LotteryParticipant[];
}

export const AdminLotteryManagement: React.FC = () => {
  const [lotteryData, setLotteryData] = useState<LotteryData | null>(null);
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<LotteryParticipant | null>(null);
  const [prizeAmount, setPrizeAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLotteryData = async () => {
    try {
      const [participantsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/lottery/participants'),
        fetch('/api/admin/lottery/stats')
      ]);

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setLotteryData(participantsData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching lottery data:', error);
      toast.error('Failed to fetch lottery data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectWinner = async (ticketId: string, amount: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/lottery/select-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, prizeAmount: amount }),
      });

      if (response.ok) {
        toast.success('Winner selected successfully!');
        fetchLotteryData();
        setSelectedParticipant(null);
        setPrizeAmount('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to select winner');
      }
    } catch (error) {
      console.error('Error selecting winner:', error);
      toast.error('Failed to select winner');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeWinner = async (ticketId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/lottery/remove-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      if (response.ok) {
        toast.success('Winner status removed!');
        fetchLotteryData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove winner');
      }
    } catch (error) {
      console.error('Error removing winner:', error);
      toast.error('Failed to remove winner');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeDraw = async () => {
    if (!confirm('Are you sure you want to complete the lottery draw? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/lottery/complete-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Lottery draw completed successfully!');
        fetchLotteryData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to complete draw');
      }
    } catch (error) {
      console.error('Error completing draw:', error);
      toast.error('Failed to complete draw');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchLotteryData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lotteryData || !stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Lottery</h3>
          <p className="text-gray-600">There is no active lottery to manage.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lottery Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage lottery participants and winners</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchLotteryData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={completeDraw} 
            disabled={isProcessing || lotteryData.lottery.isDrawn}
            className="bg-green-600 hover:bg-green-700"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Complete Draw
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParticipants}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Jackpot</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.jackpot.toLocaleString()} CFM
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Winners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.winnersCount}</p>
                <p className="text-xs text-green-600">{stats.adminSelectedWinners} admin-selected</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lottery Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Lottery Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draw Date</p>
              <p className="text-lg font-semibold">
                {new Date(lotteryData.lottery.drawDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-lg font-semibold">{stats.totalRevenue.toLocaleString()} CFM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Jackpot</p>
              <p className="text-lg font-semibold text-green-600">
                {stats.remainingJackpot.toLocaleString()} CFM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants & Winners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Participant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tickets</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">CFM Balance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Winnings</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {lotteryData.participants.map((participant) => (
                    <motion.tr
                      key={participant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {participant.firstName || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{participant.username || 'no-username'} • {participant.telegramId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{participant.ticketCount}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {participant.cfmBalance.toFixed(4)} CFM
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-green-600">
                        {participant.totalWinnings.toFixed(4)} CFM
                      </td>
                      <td className="py-3 px-4 text-center">
                        {participant.isWinner ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Participant</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          {!participant.isWinner && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedParticipant(participant)}
                              disabled={isProcessing}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Trophy className="w-3 h-3 mr-1" />
                              Select Winner
                            </Button>
                          )}
                          {participant.isWinner && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const winningTicket = participant.tickets.find(t => t.isWinner);
                                if (winningTicket) {
                                  removeWinner(winningTicket.id);
                                }
                              }}
                              disabled={isProcessing}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Winner Selection Modal */}
      <AnimatePresence>
        {selectedParticipant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">
                Select Winner: {selectedParticipant.firstName}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prize Amount (CFM)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(e.target.value)}
                    placeholder="Enter prize amount"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      const amount = parseFloat(prizeAmount);
                      if (amount > 0 && selectedParticipant.tickets.length > 0) {
                        selectWinner(selectedParticipant.tickets[0].id, amount);
                      } else {
                        toast.error('Invalid prize amount or no tickets');
                      }
                    }}
                    disabled={isProcessing || !prizeAmount}
                    className="flex-1"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Select Winner
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedParticipant(null);
                      setPrizeAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy } from 'lucide-react';

interface LotteryParticipant {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  USDBalance: number;
  ticketCount: number;
  tickets: Array<{
    id: string;
    numbers: string;
    isWinner: boolean;
    prizeAmount: number | null;
  }>;
  isWinner: boolean;
  totalWinnings: number;
}

interface LotteryData {
  lottery: {
    id: string;
    jackpot: number;
    drawDate: Date;
    isDrawn: boolean;
  };
  participants: LotteryParticipant[];
}

const AdminLottery = () => {
  const { t } = useTranslation();
  const [lotteryData, setLotteryData] = useState<LotteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWinnerForm, setShowWinnerForm] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLotteryData();
  }, []);

  const fetchLotteryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/lottery/participants');
      setLotteryData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load lottery data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !prizeAmount) {
      alert('Please fill all fields');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.post('/admin/lottery/select-winner', {
        ticketId: selectedTicketId,
        prizeAmount: parseFloat(prizeAmount)
      });
      
      alert(response.data.message);
    setShowWinnerForm(false);
      setSelectedTicketId('');
      setPrizeAmount('');
      fetchLotteryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to select winner');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveWinner = async (ticketId: string) => {
    if (!window.confirm('Remove winner status from this ticket?')) return;

    try {
      setProcessing(true);
      const response = await api.post('/admin/lottery/remove-winner', {
        ticketId
      });
      
      alert(response.data.message);
      fetchLotteryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove winner');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteDraw = async () => {
    if (!window.confirm('Complete the lottery draw? This cannot be undone.')) return;

    try {
      setProcessing(true);
      const response = await api.post('/admin/lottery/complete-draw');
      alert(response.data.message);
      fetchLotteryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete draw');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading lottery data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageHeader titleKey="admin.lottery.title" backTo="/admin" />
        <div className="text-center text-red-500 p-8">
          <p>{error}</p>
          <Button onClick={fetchLotteryData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-4xl mx-auto">
        <PageHeader titleKey="admin.lottery.title" backTo="/admin" />

        {/* Lottery Stats */}
        <Card className="bg-gray-900 border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-gold" />
              Current Lottery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <div className="text-sm text-gray-400">Jackpot</div>
                <div className="text-lg font-bold text-gold">
                  {lotteryData?.lottery.jackpot.toFixed(0) || '0'} MNE
                </div>
            </div>
            <div>
                <div className="text-sm text-gray-400">Participants</div>
                <div className="text-lg font-bold">
                  {lotteryData?.participants.length || 0}
                </div>
            </div>
            <div>
                <div className="text-sm text-gray-400">Total Tickets</div>
                <div className="text-lg font-bold">
                  {lotteryData?.participants.reduce((sum, p) => sum + p.ticketCount, 0) || 0}
                </div>
            </div>
            <div>
                <div className="text-sm text-gray-400">Status</div>
                <div className="text-lg font-bold">
                  {lotteryData?.lottery.isDrawn ? 'Completed' : 'Active'}
            </div>
          </div>
        </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
              onClick={() => setShowWinnerForm(!showWinnerForm)}
            className="bg-green-600 hover:bg-green-700"
            disabled={processing || lotteryData?.lottery.isDrawn}
          >
            {showWinnerForm ? 'Cancel' : 'Select Winner'}
          </Button>
          <Button
            onClick={handleCompleteDraw}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={processing || lotteryData?.lottery.isDrawn}
          >
            Complete Draw
          </Button>
          </div>

        {/* Winner Selection Form */}
          {showWinnerForm && (
          <Card className="bg-gray-900 border-gray-700 mb-4">
            <CardHeader>
              <CardTitle>Select Winner</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSelectWinner} className="space-y-4">
              <div>
                  <label className="block text-sm text-gray-300 mb-2">Ticket ID</label>
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                    required
                  >
                    <option value="">Select a ticket</option>
                    {lotteryData?.participants.flatMap(p => 
                      p.tickets.filter(t => !t.isWinner).map(t => (
                        <option key={t.id} value={t.id}>
                          {p.firstName || p.username || p.telegramId} - {t.numbers}
                        </option>
                      ))
                    )}
                  </select>
              </div>
              
              <div>
                  <label className="block text-sm text-gray-300 mb-2">Prize Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                  placeholder="Enter prize amount"
                    required
                />
              </div>

              <div className="flex gap-2">
                  <Button type="submit" disabled={processing} className="flex-1">
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Winner
                  </Button>
                  <Button
                  type="button"
                    onClick={() => {
                      setShowWinnerForm(false);
                      setSelectedTicketId('');
                      setPrizeAmount('');
                    }}
                    variant="outline"
                    className="flex-1"
                >
                  Cancel
                  </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle>Participants ({lotteryData?.participants.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {lotteryData?.participants.map((participant) => (
                <div key={participant.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-white">
                        {participant.firstName || participant.username || participant.telegramId}
                      </div>
                      <div className="text-sm text-gray-400">
                        {participant.ticketCount} ticket{participant.ticketCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-mono">
                        {participant.USDBalance.toFixed(2)} USD
                      </div>
                      {participant.isWinner && (
                        <div className="text-green-400 text-sm">
                          Won: {participant.totalWinnings.toFixed(2)} USD
                        </div>
                      )}
                    </div>
        </div>

                  <div className="space-y-1">
                    {participant.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`flex justify-between items-center p-2 rounded text-sm ${
                          ticket.isWinner ? 'bg-green-900/20 border border-green-700' : 'bg-gray-700'
                        }`}
                      >
                        <span className="font-mono">{ticket.numbers}</span>
                        <div className="flex items-center gap-2">
                          {ticket.isWinner ? (
                            <>
                              <span className="text-green-400">
                                Winner: {ticket.prizeAmount?.toFixed(2)} USD
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs border-red-600 text-red-500"
                                onClick={() => handleRemoveWinner(ticket.id)}
                                disabled={processing}
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
              </div>
            ))}
          </div>
        </div>
              ))}
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLottery;


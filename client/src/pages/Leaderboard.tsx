import { Loader2, Trophy } from 'lucide-react';
import { useLeaderboardData, LeaderboardUser } from '@/hooks/useLeaderboardData'; // Импортируем LeaderboardUser
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';

const Leaderboard = () => {
  const { data: leaderboardData, isLoading, error } = useLeaderboardData();

  // Логирование ошибки, если она есть
  if (error) {
    console.error(`[Leaderboard] Error fetching leaderboard:`, error);
  }

  const getMedal = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return rank + 1;
  };

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="leaderboard.title" />

      <Card className="bg-gray-900/80 border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="text-gold w-4 h-4" />
            Top 10 Miners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-400">
              <Trophy className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Could not load leaderboard.</p>
              <p className="text-xs mt-1">Please try again later.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-[40px] text-center text-xs">Rank</TableHead>
                  <TableHead className="text-xs">Player</TableHead>
                  <TableHead className="text-right text-xs">Balance (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData?.map((user, index) => (
                  <TableRow key={index} className="border-gray-800">
                    <TableCell className="font-medium text-center text-xs">{getMedal(index)}</TableCell>
                    <TableCell className="text-xs">{user.firstName} {user.username ? `(@${user.username})` : ''}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{user.balance.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Leaderboard;

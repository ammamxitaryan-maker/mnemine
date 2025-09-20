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
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="leaderboard.title" />

      <Card className="bg-gray-900/80 backdrop-blur-sm border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-gold" />
            Top 10 Miners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-400">
              <Trophy className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Could not load leaderboard.</p>
              <p className="text-sm mt-1">Please try again later.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Balance (CFM)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData?.map((user, index) => (
                  <TableRow key={index} className="border-gray-800">
                    <TableCell className="font-medium text-center">{getMedal(index)}</TableCell>
                    <TableCell>{user.firstName} {user.username ? `(@${user.username})` : ''}</TableCell>
                    <TableCell className="text-right font-mono">{user.balance.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
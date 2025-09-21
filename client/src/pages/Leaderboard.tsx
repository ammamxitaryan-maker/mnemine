import { Loader2, Trophy, Crown, Medal, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLeaderboardData, LeaderboardUser } from '@/hooks/useLeaderboardData';
import { PageLayout } from '@/components/PageLayout';
import { ModernCard } from '@/components/ModernCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const { t } = useTranslation();
  const { data: leaderboardData, isLoading, error } = useLeaderboardData();

  // Логирование ошибки, если она есть
  if (error) {
    console.error(`[Leaderboard] Error fetching leaderboard:`, error);
  }

  const getMedal = (rank: number) => {
    if (rank === 0) return { icon: Crown, color: 'from-yellow-400 to-yellow-600', text: '🥇' };
    if (rank === 1) return { icon: Medal, color: 'from-gray-300 to-gray-500', text: '🥈' };
    if (rank === 2) return { icon: Star, color: 'from-orange-400 to-orange-600', text: '🥉' };
    return { icon: Trophy, color: 'from-blue-400 to-blue-600', text: rank + 1 };
  };

  return (
    <PageLayout
      title={t('leaderboard.title')}
      subtitle={t('leaderboard.subtitle')}
      icon={Trophy}
      iconColor="from-yellow-500 to-orange-600"
    >
          {isLoading ? (
        <motion.div 
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
            </div>
        </motion.div>
          ) : error ? (
        <motion.div 
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-red-500">Could not load leaderboard</p>
            </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium */}
          {leaderboardData && leaderboardData.length >= 3 && (
            <motion.section
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {[1, 0, 2].map((rankIndex, displayIndex) => {
                const user = leaderboardData[rankIndex];
                const medal = getMedal(rankIndex);
                const MedalIcon = medal.icon;
                return (
                  <motion.div
                    key={user.telegramId || index}
                    className={`${displayIndex === 1 ? 'md:order-1' : displayIndex === 0 ? 'md:order-2' : 'md:order-3'}`}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + displayIndex * 0.1, duration: 0.6 }}
                    whileHover={{ y: -8 }}
                  >
                    <ModernCard
                      title={`#${rankIndex + 1} ${user.firstName}`}
                      icon={MedalIcon}
                      iconColor={medal.color}
                      className={`${displayIndex === 1 ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      <div className="text-center space-y-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${medal.color} rounded-full flex items-center justify-center mx-auto`}>
                          <span className="text-2xl font-bold text-white">{medal.text}</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user.balance.toFixed(2)} CFM
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.username ? `@${user.username}` : 'Anonymous'}
                          </p>
                        </div>
                      </div>
                    </ModernCard>
                  </motion.div>
                );
              })}
            </motion.section>
          )}

          {/* Full Leaderboard Table */}
          <motion.section
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <ModernCard
              title="Complete Leaderboard"
              icon={Trophy}
              iconColor="from-blue-500 to-indigo-600"
            >
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Rank</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Player</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Balance (CFM)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {leaderboardData?.map((user, index) => {
                      const medal = getMedal(index);
                      const MedalIcon = medal.icon;
                      return (
                        <motion.tr
                          key={index}
                          className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                        >
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-2">
                              <MedalIcon className={`w-4 h-4 text-gray-600 dark:text-gray-400`} />
                              <span className={index < 3 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                                {index + 1}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 bg-gradient-to-br ${medal.color} rounded-full flex items-center justify-center text-sm font-bold text-white`}>
                                {user.firstName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{user.firstName}</span>
                                {user.username && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-gray-900 dark:text-white text-right">
                            {user.balance.toFixed(4)}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
              </TableBody>
            </Table>
              </div>
            </ModernCard>
          </motion.section>
        </div>
          )}
    </PageLayout>
  );
};

export default Leaderboard;
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Loader2, Ticket, History, Trophy, Clock, Gift } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { ModernCard } from '@/components/ModernCard';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useCountdown } from '@/hooks/useCountdown';
import { Button } from '@/components/ui/button';
import { BuyTicketCard } from '@/components/BuyTicketCard';
import { LotteryTicketCard } from '@/components/LotteryTicketCard';
import { LastDrawResults } from '@/components/LastDrawResults';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { motion } from 'framer-motion';

const Lottery = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth(); // Get user from auth hook
  const { lottery, tickets, lastDraw, isLoading, error } = useLotteryData();
  const timeLeft = useCountdown(lottery?.drawDate || null);

  return (
    <PageLayout
      title={t('lottery.title')}
      subtitle={t('lottery.subtitle')}
      icon={Ticket}
      iconColor="from-purple-500 to-pink-600"
    >
      {isLoading ? (
        <motion.div 
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}...</p>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div 
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-red-500 text-center">{t('common.error')}</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Lottery Stats */}
          <motion.section 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ModernCard
              title="Current Jackpot"
              icon={Trophy}
              iconColor="from-yellow-500 to-orange-600"
              delay={0.1}
            >
              <div className="text-center">
                <motion.p 
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {lottery?.jackpot.toFixed(2) || '0.00'} CFM
                </motion.p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Prize pool
                </p>
              </div>
            </ModernCard>

            <ModernCard
              title="Time Remaining"
              icon={Clock}
              iconColor="from-blue-500 to-indigo-600"
              delay={0.2}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {timeLeft}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Until next draw
                </p>
              </div>
            </ModernCard>

            <ModernCard
              title="Your Tickets"
              icon={Gift}
              iconColor="from-green-500 to-emerald-600"
              delay={0.3}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {tickets?.length || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active tickets
                </p>
              </div>
            </ModernCard>
          </motion.section>

          {/* History Button */}
          <motion.div 
            className="flex justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link to="/lottery-history">
              <Button 
                variant="outline" 
                className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <History className="w-4 h-4 mr-2" />
                {t('lottery.history.link')}
              </Button>
            </Link>
          </motion.div>

          {lottery && (
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gold text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-400 text-base font-medium">{t('lottery.currentJackpot')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <p className="text-3xl font-bold text-gold animate-pulse-subtle">
                  {lottery.jackpot.toFixed(2)} <span className="text-xl">CFM</span>
                </p>
                <p className="text-gray-400 mt-2 text-xs">{t('lottery.drawsIn')}</p>
                <p className="text-xl font-mono text-accent">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </p>
              </CardContent>
            </Card>
          )}

          {lastDraw && <LastDrawResults draw={lastDraw} />}

          {user && <BuyTicketCard telegramId={user.telegramId} />} {/* Pass telegramId here */}

          <Card className="bg-gray-900/80 backdrop-blur-sm border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="text-accent" />
                {t('lottery.yourTickets')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets && tickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tickets.map(ticket => (
                    <LotteryTicketCard key={ticket.id} ticket={ticket} winningNumbers={lastDraw?.winningNumbers} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">{t('lottery.noTickets')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Lottery;
import { useTranslation } from 'react-i18next';
import { 
  Wallet as WalletIcon, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History,
  TrendingUp,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useActivityData, Activity } from '@/hooks/useActivityData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData, UserData } from '@/hooks/useUserData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CardSkeleton, BalanceSkeleton } from '@/components/LoadingSkeleton';
import { TouchButton } from '@/components/FullscreenSection';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const WalletSimplified = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: activities, isLoading: activityLoading, error: activityError } = useActivityData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user?.telegramId);
  const { t } = useTranslation();

  const isLoading = authLoading || activityLoading || userDataLoading;
  const error = activityError || userDataError;

  if (error) {
    console.error(`[Wallet] Error fetching data for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load wallet data.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading wallet...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <motion.header 
          className="flex items-center justify-between py-6 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <TouchButton
            onClick={() => window.history.back()}
            className="group relative px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back</span>
          </TouchButton>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your funds</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </motion.header>

        {/* Main Balance Card */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <WalletIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Balance</h2>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                {(userData as UserData)?.balance.toFixed(4) || '0.0000'} CFM
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <TouchButton
                  onClick={() => window.location.href = '/deposit'}
                  className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ArrowDownToLine className="w-5 h-5 mx-auto mb-2" />
                  <span className="font-medium">Deposit</span>
                </TouchButton>
                <TouchButton
                  onClick={() => window.location.href = '/withdraw'}
                  className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ArrowUpFromLine className="w-5 h-5 mx-auto mb-2" />
                  <span className="font-medium">Withdraw</span>
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Detailed Information - Accordion */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            
            {/* Balance Statistics */}
            <AccordionItem value="balance-stats" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl rounded-xl">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Balance Statistics</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Invested', value: `${(userData as UserData)?.totalInvested?.toFixed(2) || '0.00'} CFM`, color: 'blue' },
                    { label: 'Accrued Earnings', value: `${(userData as UserData)?.accruedEarnings?.toFixed(4) || '0.0000'} CFM`, color: 'green' },
                    { label: 'Mining Power', value: `${((userData as UserData)?.miningPower ?? 0) * 100}%`, color: 'purple' },
                    { label: 'Active Slots', value: `${(userData as UserData)?.miningSlots?.filter((slot: any) => slot.isActive).length || 0}`, color: 'orange' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className={`text-lg font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Recent Activity */}
            <AccordionItem value="recent-activity" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl rounded-xl">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Recent Activity ({activities?.length || 0})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity: Activity, index: number) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{activity.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${activity.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {activity.amount >= 0 ? '+' : ''}{activity.amount.toFixed(4)} CFM
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Quick Actions */}
            <AccordionItem value="quick-actions" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl rounded-xl">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                    <WalletIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Quick Actions</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { to: '/deposit', label: 'Deposit Funds', description: 'Add CFM to your wallet', color: 'emerald' },
                    { to: '/withdraw', label: 'Withdraw Funds', description: 'Send CFM to external wallet', color: 'orange' },
                    { to: '/swap', label: 'Swap Tokens', description: 'Exchange CFM for CFMT', color: 'blue' },
                    { to: '/slots', label: 'Mining Slots', description: 'Invest in mining slots', color: 'purple' }
                  ].map((action, index) => (
                    <motion.div
                      key={action.to}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TouchButton
                        onClick={() => window.location.href = action.to}
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{action.label}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                          </div>
                          <div className={`p-2 bg-${action.color}-100 dark:bg-${action.color}-900/30 rounded-lg`}>
                            <ArrowRightLeft className={`w-5 h-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                          </div>
                        </div>
                      </TouchButton>
                    </motion.div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default WalletSimplified;

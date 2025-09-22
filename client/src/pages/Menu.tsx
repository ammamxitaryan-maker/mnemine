import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, 
  Server, 
  Zap, 
  Trophy, 
  Gift, 
  Award, 
  Ticket, 
  Users,
  BarChart3,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/FullscreenSection';
import { motion } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useOptimizedDashboard } from '@/hooks/useOptimizedData';
import { Loader2 } from 'lucide-react';

const Menu = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { 
    tasksData, 
    slotsData, 
    lotteryData, 
    bonusesData, 
    achievementsData,
    isLoading: overallLoading 
  } = useOptimizedDashboard(user?.telegramId);

  const isLoading = authLoading || overallLoading;

  // Группируем функции по категориям
  const menuCategories = [
    {
      title: "Mining & Investment",
      items: [
        { 
          to: "/slots", 
          icon: Server, 
          labelKey: "slots.title", 
          description: "Manage your mining slots",
          count: slotsData?.filter((s: any) => s.isActive).length || 0,
          color: "blue"
        },
        { 
          to: "/boosters", 
          icon: Zap, 
          labelKey: "boosters.title", 
          description: "Boost your mining power",
          count: null,
          color: "purple"
        },
        { 
          to: "/tasks", 
          icon: CheckSquare, 
          labelKey: "tasks.title", 
          description: "Complete daily tasks",
          count: tasksData?.filter((t: any) => !t.isCompleted).length || 0,
          color: "green"
        }
      ]
    },
    {
      title: "Rewards & Bonuses",
      items: [
        { 
          to: "/bonuses", 
          icon: Gift, 
          labelKey: "bonuses.title", 
          description: "Claim your bonuses",
          count: bonusesData?.claimableCount || 0,
          color: "orange"
        },
        { 
          to: "/achievements", 
          icon: Award, 
          labelKey: "achievements", 
          description: "View your achievements",
          count: achievementsData?.filter((a: any) => a.isCompleted && !a.isClaimed).length || 0,
          color: "yellow"
        },
        { 
          to: "/lottery", 
          icon: Ticket, 
          labelKey: "lottery.title", 
          description: "Buy lottery tickets",
          count: lotteryData?.jackpot ? parseFloat(lotteryData.jackpot).toFixed(0) : null,
          color: "red"
        }
      ]
    },
    {
      title: "Community & Stats",
      items: [
        { 
          to: "/referrals", 
          icon: Users, 
          labelKey: "referrals.title", 
          description: "Invite friends and earn",
          count: null,
          color: "indigo"
        },
        { 
          to: "/leaderboard", 
          icon: Trophy, 
          labelKey: "leaderboard.title", 
          description: "See top miners",
          count: null,
          color: "amber"
        },
        { 
          to: "/stats", 
          icon: BarChart3, 
          labelKey: "stats.title", 
          description: "View detailed statistics",
          count: null,
          color: "emerald"
        }
      ]
    },
    {
      title: "Settings",
      items: [
        { 
          to: "/settings", 
          icon: Settings, 
          labelKey: "settings.title", 
          description: "App preferences",
          count: null,
          color: "gray"
        }
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading menu...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
            <p className="text-gray-600 dark:text-gray-400">All features</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </motion.header>

        {/* Menu Categories */}
        <div className="space-y-6">
          {menuCategories.map((category, categoryIndex) => (
            <motion.section
              key={category.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + categoryIndex * 0.1, duration: 0.5 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + categoryIndex * 0.1 + itemIndex * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <TouchButton
                          onClick={() => window.location.href = item.to}
                          className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl`}>
                                <item.icon className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {t(item.labelKey)}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            {item.count !== null && (
                              <div className={`px-3 py-1 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-full`}>
                                <span className={`text-sm font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                                  {item.count}
                                </span>
                              </div>
                            )}
                          </div>
                        </TouchButton>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Menu;

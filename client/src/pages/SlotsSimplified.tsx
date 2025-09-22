import { useTranslation } from 'react-i18next';
import { 
  Server, 
  Plus, 
  TrendingUp,
  Clock,
  ArrowLeft,
  Loader2,
  Zap
} from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, Slot } from '@/hooks/useSlotsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/FullscreenSection';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SlotsSimplified = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error } = useSlotsData(user?.telegramId);

  const isLoading = authLoading || slotsLoading;

  if (error) {
    console.error(`[Slots] Error fetching slots for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load slots.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading slots...</p>
      </div>
    );
  }

  const activeSlots = slotsData?.filter(slot => slot.isActive) ?? [];
  const expiredSlots = slotsData?.filter(slot => !slot.isActive) ?? [];

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mining Slots</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your investments</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </motion.header>

        {/* Slot Statistics */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              { 
                label: 'Active', 
                value: activeSlots.length, 
                icon: Server, 
                color: 'green',
                description: 'Currently mining'
              },
              { 
                label: 'Total Invested', 
                value: `${slotsData?.reduce((sum, slot) => sum + (slot.principal || 0), 0).toFixed(2) || '0.00'} CFM`, 
                icon: TrendingUp, 
                color: 'blue',
                description: 'In all slots'
              },
              { 
                label: 'Weekly Rate', 
                value: '30%', 
                icon: Zap, 
                color: 'purple',
                description: 'Profit rate'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-4 text-center">
                    <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl mx-auto mb-3 w-fit`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Action - Buy New Slot */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Start New Investment
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Invest in a new mining slot and earn 30% profit in 7 days
                    </p>
                  </div>
                </div>
                <TouchButton
                  onClick={() => {/* Handle buy new slot */}}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Buy Slot
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Slots Tabs */}
        <motion.section
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Active ({activeSlots.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expired ({expiredSlots.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {activeSlots.length > 0 ? (
                <div className="space-y-4">
                  {activeSlots.map((slot: Slot, index: number) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  Mining Slot #{slot.id}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Principal: {slot.principal?.toFixed(2) || '0.00'} CFM
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Weekly Rate: {((slot.effectiveWeeklyRate || 0) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 mb-2">
                                Active
                              </Badge>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {formatTimeRemaining(slot.expiresAt)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                remaining
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Active Slots
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start your first mining investment to begin earning.
                    </p>
                    <TouchButton
                      onClick={() => {/* Handle buy new slot */}}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Buy Your First Slot
                    </TouchButton>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="expired" className="mt-6">
              {expiredSlots.length > 0 ? (
                <div className="space-y-4">
                  {expiredSlots.map((slot: Slot, index: number) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  Mining Slot #{slot.id}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Principal: {slot.principal?.toFixed(2) || '0.00'} CFM
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Expired: {new Date(slot.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 mb-2">
                                Expired
                              </Badge>
                              <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                Ready to claim
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Expired Slots
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      All your slots are currently active.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default SlotsSimplified;

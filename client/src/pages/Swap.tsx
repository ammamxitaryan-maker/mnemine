import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SwapInterface } from '@/components/SwapInterface';
import { ExchangeRateChart } from '@/components/ExchangeRateChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp, DollarSign, ArrowLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';
import { TouchButton } from '@/components/FullscreenSection';

const Swap: React.FC = () => {
  const { t } = useTranslation();
  const { data: userData, refetch } = useUserData('mock-user-id');
  const [cfmBalance, setCfmBalance] = useState(0);
  const [cfmtBalance, setCfmtBalance] = useState(0);

  useEffect(() => {
    if (userData) {
      // For now, use mock data until proper wallet structure is implemented
      setCfmBalance(1000); // Mock CFM balance
      setCfmtBalance(500);  // Mock CFMT balance
    }
  }, [userData]);

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading swap interface...</p>
          </div>
        </div>
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
      {/* Design System Container */}
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section - Perfectly Centered */}
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
            <span className="font-medium">{t('common.back')}</span>
          </TouchButton>
          
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center space-x-3 mb-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div 
                className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ArrowRightLeft className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('swap.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('swap.subtitle')}
                </p>
              </div>
            </motion.div>
          </div>
          
          <div className="w-24"></div> {/* Spacer for perfect centering */}
        </motion.header>

        {/* Main Content Grid - Perfectly Symmetric */}
        <div className="space-y-8">
          
          {/* Balance Overview */}
          <motion.section 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* CFM Balance Card */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('swap.cfmBalance')}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cfmBalance.toFixed(4)}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">CFM</p>
                    </div>
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <DollarSign className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CFMT Balance Card */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('swap.cfmtBalance')}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cfmtBalance.toFixed(4)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">CFMT</p>
                    </div>
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <TrendingUp className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.section>

          {/* Main Swap Interface */}
          <motion.section
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Exchange Rate Chart */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="lg:col-span-1"
            >
              <ExchangeRateChart />
            </motion.div>

            {/* Swap Interface */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="lg:col-span-2"
            >
              <SwapInterface
                telegramId={'mock-user-id'}
                cfmBalance={cfmBalance}
                cfmtBalance={cfmtBalance}
                onSwapSuccess={refetch}
              />
            </motion.div>
          </motion.section>

          {/* Information Cards */}
          <motion.section
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* How Swap Works */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <motion.div 
                      className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Info className="w-6 h-6 text-white" />
                    </motion.div>
                    {t('swap.howItWorks')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "Exchange CFM tokens for CFMT tokens at the current market rate",
                      "Rates are updated in real-time by administrators",
                      "All transactions are recorded and can be viewed in your history",
                      "No additional fees - only the exchange rate applies"
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <motion.div 
                          className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mt-2 mr-4 flex-shrink-0"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rate Information */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <motion.div 
                      className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <DollarSign className="w-6 h-6 text-white" />
                    </motion.div>
                    Rate Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Rate Range", value: "0.1% - 3%" },
                      { label: "Updates", value: "Real-time" },
                      { label: "Minimum Swap", value: "0.0001 CFM" },
                      { label: "Maximum Swap", value: "1000 CFM" }
                    ].map((info, index) => (
                      <motion.div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:shadow-md transition-all duration-300"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{info.label}</span>
                        <Badge variant="outline" className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                          {info.value}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};

export default Swap;

import React, { useState, useEffect } from 'react';
import { SwapInterface } from '@/components/SwapInterface';
import { ExchangeRateChart } from '@/components/ExchangeRateChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';

const Swap: React.FC = () => {
  const { data: userData, refetch } = useUserData();
  const [cfmBalance, setCfmBalance] = useState(0);
  const [cfmtBalance, setCfmtBalance] = useState(0);

  useEffect(() => {
    if (userData) {
      const cfmWallet = userData.wallets.find(w => w.currency === 'CFM');
      const cfmtWallet = userData.wallets.find(w => w.currency === 'CFMT');
      
      setCfmBalance(cfmWallet?.balance || 0);
      setCfmtBalance(cfmtWallet?.balance || 0);
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
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ArrowRightLeft className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CFM ↔ CFMT Swap</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Exchange your CFM tokens for CFMT tokens at the current market rate
          </p>
        </motion.div>

        {/* Balance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CFM Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {cfmBalance.toFixed(4)} CFM
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CFMT Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {cfmtBalance.toFixed(4)} CFMT
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exchange Rate Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <ExchangeRateChart />
          </motion.div>

          {/* Swap Interface */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <SwapInterface
              telegramId={userData.telegramId}
              cfmBalance={cfmBalance}
              cfmtBalance={cfmtBalance}
              onSwapSuccess={refetch}
            />
          </motion.div>
        </div>

        {/* Information Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                How Swap Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Exchange CFM tokens for CFMT tokens at the current market rate
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Rates are updated in real-time by administrators
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  All transactions are recorded and can be viewed in your history
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  No additional fees - only the exchange rate applies
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Rate Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rate Range:</span>
                  <Badge variant="outline">0.1% - 3%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Updates:</span>
                  <Badge variant="outline">Real-time</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Minimum Swap:</span>
                  <Badge variant="outline">0.0001 CFM</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Maximum Swap:</span>
                  <Badge variant="outline">1000 CFM</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Swap;

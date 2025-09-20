import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Award,
  BarChart3,
  Activity,
  Zap,
  PieChart // Added PieChart import
} from 'lucide-react';
import { EnhancedBalanceDisplay } from './EnhancedBalanceDisplay';
import { TrustIndicators } from './TrustIndicators';
import { AnimatedEarningsDisplay } from './AnimatedEarningsDisplay';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; // Import Link

interface ProfessionalDashboardProps {
  userData: { // No longer optional, comes from hook
    balance: number;
    totalInvested: number;
    totalEarnings: number;
    activeSlots: number;
    referrals: number;
    rank: string;
  };
  marketData: { // No longer optional, comes from hook
    dailyChange: number;
    weeklyChange: number;
    monthlyChange: number;
    totalUsers: number;
    totalVolume: number;
  };
  displayEarnings: number; // No longer optional
  isLoading?: boolean;
}

export const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({
  userData,
  marketData,
  displayEarnings,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const stats = [
    {
      title: 'Total Invested',
      value: userData.totalInvested,
      icon: DollarSign,
      change: 5.2, // This is still hardcoded, consider fetching from backend if needed
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Active Mining Slots',
      value: userData.activeSlots,
      icon: Zap,
      change: 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Referrals',
      value: userData.referrals,
      icon: Users,
      change: 2, // This is still hardcoded, consider fetching from backend if needed
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Current Rank',
      value: userData.rank,
      icon: Award,
      change: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  const marketStats = [
    {
      title: 'Market Performance',
      value: `${marketData.dailyChange > 0 ? '+' : ''}${marketData.dailyChange}%`,
      subtitle: '24h Change',
      icon: marketData.dailyChange > 0 ? TrendingUp : TrendingDown,
      color: marketData.dailyChange > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Total Users',
      value: marketData.totalUsers.toLocaleString(),
      subtitle: 'Active Investors',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Trading Volume',
      value: `$${(marketData.totalVolume / 1000000).toFixed(1)}M`,
      subtitle: 'Total Volume',
      icon: BarChart3,
      color: 'text-indigo-600'
    }
  ];

  const sampleMarketTrends = [
    { name: 'Mining Yield', value: 75, change: 1.2, color: 'bg-green-500' },
    { name: 'Referral Income', value: 50, change: 0.8, color: 'bg-blue-500' },
    { name: 'Lottery Payouts', value: 30, change: -0.5, color: 'bg-yellow-500' },
    { name: 'Booster Sales', value: 20, change: 2.1, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Real-time Sync (moved to MainLayout) */}
      <div className="flex items-center justify-end">
        {/* RealTimeSync will be rendered in MainLayout */}
      </div>

      {/* Main Balance Display */}
      <EnhancedBalanceDisplay
        balance={userData.balance}
        dailyChange={marketData.dailyChange}
        weeklyChange={marketData.weeklyChange}
        monthlyChange={marketData.monthlyChange}
        isLoading={isLoading}
      />

      {/* Live Earnings Display */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('liveEarnings')}
              </h3>
              <div className="flex items-center space-x-4">
                <AnimatedEarningsDisplay earnings={displayEarnings} />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">{t('weeklyRate')}</p>
                  <p className="text-xs">{t('realTimeAccumulation')}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  {stat.change > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      +{stat.change}% this month
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Market Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketStats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Trends Card */}
        <MarketTrendsCard trends={sampleMarketTrends} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm font-medium">Invest</span>
            </Button>
            <Link to="/advanced-trading" className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-md text-white">
              <Target className="w-6 h-6" />
              <span className="text-sm font-medium">Trade</span>
            </Link>
            <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700">
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Refer</span>
            </Button>
            <Link to="/analytics" className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-md text-white">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm font-medium">Analytics</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <TrustIndicators />
    </div>
  );
};

export const MarketTrendsCard: React.FC<{
  trends: Array<{
    name: string;
    value: number;
    change: number;
    color: string;
  }>;
}> = ({ trends }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <PieChart className="w-5 h-5" />
        <span>Market Trends</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {trends.map((trend, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${trend.color}`}></div>
              <span className="font-medium text-gray-900 dark:text-white">
                {trend.name}
              </span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">
                {trend.value.toLocaleString()}
              </p>
              <p className={`text-sm ${trend.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change > 0 ? '+' : ''}{trend.change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
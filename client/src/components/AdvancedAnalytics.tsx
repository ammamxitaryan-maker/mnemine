import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  userData?: {
    balance: number;
    totalInvested: number;
    totalEarnings: number;
    activeSlots: number;
    referrals: number;
  };
  timeRange?: '1D' | '7D' | '30D' | '90D' | '1Y';
}

// Sample data for charts
const generatePortfolioData = (days: number) => {
  const data = [];
  const baseValue = 1000;
  let currentValue = baseValue;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
    currentValue *= (1 + change);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: Math.round(currentValue * 100) / 100,
      earnings: Math.round((currentValue - baseValue) * 100) / 100,
      volume: Math.round(Math.random() * 10000)
    });
  }
  
  return data;
};

const generateMarketData = () => {
  return [
    { name: 'Mining', value: 45, color: '#8884d8' },
    { name: 'Referrals', value: 25, color: '#82ca9d' },
    { name: 'Tasks', value: 15, color: '#ffc658' },
    { name: 'Lottery', value: 10, color: '#ff7300' },
    { name: 'Bonuses', value: 5, color: '#00ff00' }
  ];
};

const generatePerformanceData = () => {
  return [
    { period: 'Jan', performance: 12.5, benchmark: 8.2 },
    { period: 'Feb', performance: 15.3, benchmark: 9.1 },
    { period: 'Mar', performance: 18.7, benchmark: 10.5 },
    { period: 'Apr', performance: 22.1, benchmark: 11.8 },
    { period: 'May', performance: 25.4, benchmark: 13.2 },
    { period: 'Jun', performance: 28.9, benchmark: 14.5 }
  ];
};

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  userData = {
    balance: 1250.75,
    totalInvested: 5000,
    totalEarnings: 1250.75,
    activeSlots: 3,
    referrals: 12
  },
  timeRange = '30D'
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [portfolioData, setPortfolioData] = useState(generatePortfolioData(30));
  const [marketData, setMarketData] = useState(generateMarketData());
  const [performanceData, setPerformanceData] = useState(generatePerformanceData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeRanges = [
    { label: '1D', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '1Y', days: 365 }
  ];

  const handleTimeRangeChange = (range: string) => {
    const selectedRange = timeRanges.find(r => r.label === range);
    if (selectedRange) {
      setSelectedTimeRange(range as any);
      setPortfolioData(generatePortfolioData(selectedRange.days));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPortfolioData(generatePortfolioData(timeRanges.find(r => r.label === selectedTimeRange)?.days || 30));
    setMarketData(generateMarketData());
    setPerformanceData(generatePerformanceData());
    setIsRefreshing(false);
  };

  const exportData = () => {
    const dataStr = JSON.stringify({
      portfolio: portfolioData,
      market: marketData,
      performance: performanceData,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalReturn = portfolioData.length > 0 ? 
    ((portfolioData[portfolioData.length - 1].value - portfolioData[0].value) / portfolioData[0].value * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Comprehensive portfolio analysis and market insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range:
              </span>
            </div>
            <div className="flex space-x-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.label}
                  onClick={() => handleTimeRangeChange(range.label)}
                  variant={selectedTimeRange === range.label ? "default" : "outline"}
                  size="sm"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Portfolio Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `$${value.toFixed(2)}`, 
                    name === 'value' ? 'Portfolio Value' : 'Earnings'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Return</p>
              <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${portfolioData[portfolioData.length - 1]?.value.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-lg font-bold text-green-600">
                ${portfolioData[portfolioData.length - 1]?.earnings.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5" />
              <span>Revenue Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance vs Benchmark</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="performance" fill="#8884d8" name="Your Performance" />
                  <Bar dataKey="benchmark" fill="#82ca9d" name="Market Benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Key Performance Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">ROI</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {((userData.totalEarnings / userData.totalInvested) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {totalReturn.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500">Active Slots</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userData.activeSlots}
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500">Referrals</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userData.referrals}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


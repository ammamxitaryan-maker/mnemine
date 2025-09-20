import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpDown,
  Calculator,
  Target,
  Zap,
  Shield,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  pair: string;
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: string;
}

interface AdvancedTradingProps {
  userBalance?: number;
  onTrade?: (order: Partial<Order>) => void;
}

export const AdvancedTrading: React.FC<AdvancedTradingProps> = ({
  userBalance = 1000,
  onTrade
}) => {
  const [selectedPair, setSelectedPair] = useState('CFM/USDT');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  // Sample trading pairs
  const tradingPairs: TradingPair[] = [
    {
      symbol: 'CFM/USDT',
      baseAsset: 'CFM',
      quoteAsset: 'USDT',
      price: 0.125,
      change24h: 5.2,
      volume24h: 1250000,
      high24h: 0.135,
      low24h: 0.118
    },
    {
      symbol: 'CFM/BTC',
      baseAsset: 'CFM',
      quoteAsset: 'BTC',
      price: 0.0000025,
      change24h: -2.1,
      volume24h: 850000,
      high24h: 0.0000028,
      low24h: 0.0000022
    },
    {
      symbol: 'CFM/ETH',
      baseAsset: 'CFM',
      quoteAsset: 'ETH',
      price: 0.000045,
      change24h: 3.8,
      volume24h: 650000,
      high24h: 0.000048,
      low24h: 0.000042
    }
  ];

  const selectedPairData = tradingPairs.find(pair => pair.symbol === selectedPair);

  // Sample portfolio data
  const samplePortfolio = [
    { asset: 'CFM', amount: 5000, value: 625, change24h: 5.2 },
    { asset: 'USDT', amount: 1000, value: 1000, change24h: 0.1 },
    { asset: 'BTC', amount: 0.05, value: 2000, change24h: 2.3 },
    { asset: 'ETH', amount: 2.5, value: 5000, change24h: 4.1 } // Fixed: Removed duplicate 'value' property
  ];

  useEffect(() => {
    setPortfolio(samplePortfolio);
  }, []);

  const handleTrade = () => {
    if (!amount || (orderType === 'limit' && !price)) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      type: tradeType,
      pair: selectedPair,
      amount: parseFloat(amount),
      price: orderType === 'market' ? selectedPairData?.price || 0 : parseFloat(price),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    onTrade?.(newOrder);

    // Simulate order execution
    setTimeout(() => {
      setOrders(prev => 
        prev.map(order => 
          order.id === newOrder.id ? { ...order, status: 'filled' } : order
        )
      );
    }, 2000);

    // Reset form
    setAmount('');
    setPrice('');
  };

  const calculateTotal = () => {
    if (!amount) return 0;
    const orderPrice = orderType === 'market' ? selectedPairData?.price || 0 : parseFloat(price);
    return parseFloat(amount) * orderPrice;
  };

  const getTotalPortfolioValue = () => {
    return portfolio.reduce((total, asset) => total + asset.value, 0);
  };

  const getPortfolioChange = () => {
    return portfolio.reduce((total, asset) => total + (asset.value * asset.change24h / 100), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Trading
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Professional trading interface with real-time market data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Portfolio Value</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${getTotalPortfolioValue().toFixed(2)}
            </p>
            <p className={`text-sm ${getPortfolioChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {getPortfolioChange() >= 0 ? '+' : ''}${getPortfolioChange().toFixed(2)} (24h)
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="trading" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3"> {/* Changed to grid-cols-3 */}
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          {/* Removed Analytics Tab */}
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Pairs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Market Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tradingPairs.map((pair) => (
                    <div
                      key={pair.symbol}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPair === pair.symbol
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedPair(pair.symbol)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {pair.symbol}
                          </p>
                          <p className="text-sm text-gray-500">
                            Vol: ${pair.volume24h.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            ${pair.price.toFixed(6)}
                          </p>
                          <p className={`text-sm ${pair.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trading Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpDown className="w-5 h-5" />
                  <span>Place Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Type */}
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trade Type */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tradeType === 'buy' ? 'default' : 'outline'}
                    onClick={() => setTradeType('buy')}
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Buy</span>
                  </Button>
                  <Button
                    variant={tradeType === 'sell' ? 'default' : 'outline'}
                    onClick={() => setTradeType('sell')}
                    className="flex items-center space-x-2"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Sell</span>
                  </Button>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label>Amount ({selectedPairData?.baseAsset})</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* Price (for limit orders) */}
                {orderType === 'limit' && (
                  <div className="space-y-2">
                    <Label>Price ({selectedPairData?.quoteAsset})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                {/* Total */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${calculateTotal().toFixed(2)} {selectedPairData?.quoteAsset}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handleTrade}
                  disabled={!amount || (orderType === 'limit' && !price)}
                  className="w-full"
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedPairData?.baseAsset}
                </Button>
              </CardContent>
            </Card>

            {/* Market Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Market Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPairData && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${selectedPairData.price.toFixed(6)}
                      </p>
                      <p className={`text-sm ${selectedPairData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedPairData.change24h >= 0 ? '+' : ''}{selectedPairData.change24h.toFixed(2)}% (24h)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">24h High</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${selectedPairData.high24h.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">24h Low</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${selectedPairData.low24h.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">24h Volume</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${selectedPairData.volume24h.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Portfolio Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {portfolio.map((asset, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {asset.asset}
                      </span>
                      <Badge variant={asset.change24h >= 0 ? 'default' : 'destructive'}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Amount: {asset.amount.toFixed(4)}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${asset.value.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Order History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          order.type === 'buy' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {order.type === 'buy' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.type.toUpperCase()} {order.pair}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {order.amount} @ ${order.price.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.status === 'filled' ? 'default' :
                          order.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Removed Analytics Tab Content */}
      </Tabs>
    </div>
  );
};
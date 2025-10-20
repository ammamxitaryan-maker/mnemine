"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Database,
  DollarSign,
  Globe,
  RefreshCw,
  Save,
  Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SystemSettings {
  exchangeRate: {
    current: number;
    min: number;
    max: number;
  };
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
    dailyWithdrawalLimit: number;
  };
  features: {
    registrationEnabled: boolean;
    withdrawalsEnabled: boolean;
    lotteryEnabled: boolean;
    referralsEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    telegramEnabled: boolean;
    adminAlerts: boolean;
  };
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [exchangeRate, setExchangeRate] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [maxDeposit, setMaxDeposit] = useState('');
  const [minWithdrawal, setMinWithdrawal] = useState('');
  const [maxWithdrawal, setMaxWithdrawal] = useState('');
  const [dailyWithdrawalLimit, setDailyWithdrawalLimit] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      const data = response.data.data;
      setSettings(data);

      // Populate form fields
      setExchangeRate(data.exchangeRate.current.toString());
      setMinDeposit(data.limits.minDeposit.toString());
      setMaxDeposit(data.limits.maxDeposit.toString());
      setMinWithdrawal(data.limits.minWithdrawal.toString());
      setMaxWithdrawal(data.limits.maxWithdrawal.toString());
      setDailyWithdrawalLimit(data.limits.dailyWithdrawalLimit.toString());
    } catch (err: unknown) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (section: string) => {
    try {
      setSaving(true);
      setMessage(null);

      let payload = {};
      const validationErrors: string[] = [];

      switch (section) {
        case 'exchange': {
          const rate = parseFloat(exchangeRate);
          if (isNaN(rate) || rate <= 0) {
            validationErrors.push('Exchange rate must be a positive number');
          }
          if (rate < 0.0001 || rate > 100) {
            validationErrors.push('Exchange rate must be between 0.0001 and 100');
          }
          if (validationErrors.length === 0) {
            payload = { exchangeRate: rate };
          }
          break;
        }
        case 'limits': {
          const minDep = parseFloat(minDeposit);
          const maxDep = parseFloat(maxDeposit);
          const minWith = parseFloat(minWithdrawal);
          const maxWith = parseFloat(maxWithdrawal);
          const dailyLimit = parseFloat(dailyWithdrawalLimit);

          if (isNaN(minDep) || minDep <= 0) validationErrors.push('Minimum deposit must be a positive number');
          if (isNaN(maxDep) || maxDep <= 0) validationErrors.push('Maximum deposit must be a positive number');
          if (isNaN(minWith) || minWith <= 0) validationErrors.push('Minimum withdrawal must be a positive number');
          if (isNaN(maxWith) || maxWith <= 0) validationErrors.push('Maximum withdrawal must be a positive number');
          if (isNaN(dailyLimit) || dailyLimit <= 0) validationErrors.push('Daily withdrawal limit must be a positive number');

          if (minDep > maxDep) validationErrors.push('Minimum deposit cannot be greater than maximum deposit');
          if (minWith > maxWith) validationErrors.push('Minimum withdrawal cannot be greater than maximum withdrawal');
          if (maxWith > dailyLimit) validationErrors.push('Maximum withdrawal cannot be greater than daily limit');

          if (validationErrors.length === 0) {
            payload = {
              minDeposit: minDep,
              maxDeposit: maxDep,
              minWithdrawal: minWith,
              maxWithdrawal: maxWith,
              dailyWithdrawalLimit: dailyLimit
            };
          }
          break;
        }
        default:
          return;
      }

      if (validationErrors.length > 0) {
        setMessage({ type: 'error', text: validationErrors.join(', ') });
        return;
      }

      await api.post('/admin/settings/update', payload);
      setMessage({ type: 'success', text: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully` });
      fetchSettings();
    } catch (err: unknown) {
      console.error('Failed to save settings:', err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save settings';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleSystemAction = async (action: string) => {
    try {
      setSaving(true);
      await api.post(`/admin/system/${action}`);
      setMessage({ type: 'success', text: `${action} completed successfully` });
    } catch (err: unknown) {
      console.error(`Failed to ${action}:`, err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || `Failed to ${action}`;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-800/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-blue-200 hover:bg-blue-800/30 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">System Settings</h1>
                <p className="text-sm text-blue-200 mt-1">
                  Configure system parameters and features
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSettings}
                disabled={loading}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="p-4">
          <div className={`p-4 rounded-lg border flex items-center space-x-2 ${message.type === 'success'
              ? 'bg-green-900/20 border-green-700/50 text-green-300'
              : 'bg-red-900/20 border-red-700/50 text-red-300'
            }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Settings Content */}
      <div className="p-4">
        <Tabs defaultValue="exchange" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="exchange" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Exchange</TabsTrigger>
            <TabsTrigger value="limits" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Limits</TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Features</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">System</TabsTrigger>
          </TabsList>

          {/* Exchange Rate Settings */}
          <TabsContent value="exchange">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Exchange Rate Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRate" className="text-sm font-medium text-slate-300">Current Rate</Label>
                    <Input
                      id="currentRate"
                      type="number"
                      step="0.0001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-green-500 focus:ring-green-500/20"
                    />
                    <p className="text-xs text-slate-400">
                      Current: {settings?.exchangeRate.current.toFixed(4)} NON per USD
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Minimum Rate</Label>
                    <Input
                      value="0.0001"
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                    <p className="text-xs text-slate-400">
                      Very low minimum (limits removed)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Maximum Rate</Label>
                    <Input
                      value="0.1000"
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                    <p className="text-xs text-slate-400">
                      High maximum (limits removed)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveSettings('exchange')}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Exchange Rate
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Limits Settings */}
          <TabsContent value="limits">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Transaction Limits</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDeposit" className="text-sm font-medium text-slate-300">Minimum Deposit</Label>
                    <Input
                      id="minDeposit"
                      type="number"
                      step="0.01"
                      value={minDeposit}
                      onChange={(e) => setMinDeposit(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDeposit" className="text-sm font-medium text-slate-300">Maximum Deposit</Label>
                    <Input
                      id="maxDeposit"
                      type="number"
                      step="0.01"
                      value={maxDeposit}
                      onChange={(e) => setMaxDeposit(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minWithdrawal" className="text-sm font-medium text-slate-300">Minimum Withdrawal</Label>
                    <Input
                      id="minWithdrawal"
                      type="number"
                      step="0.01"
                      value={minWithdrawal}
                      onChange={(e) => setMinWithdrawal(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWithdrawal" className="text-sm font-medium text-slate-300">Maximum Withdrawal</Label>
                    <Input
                      id="maxWithdrawal"
                      type="number"
                      step="0.01"
                      value={maxWithdrawal}
                      onChange={(e) => setMaxWithdrawal(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="dailyLimit" className="text-sm font-medium text-slate-300">Daily Withdrawal Limit</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      step="0.01"
                      value={dailyWithdrawalLimit}
                      onChange={(e) => setDailyWithdrawalLimit(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveSettings('limits')}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Limits
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Features Settings */}
          <TabsContent value="features">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Globe className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Feature Toggles</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <h3 className="font-medium text-white">User Registration</h3>
                    <p className="text-sm text-slate-400">Allow new user registrations</p>
                  </div>
                  <Button
                    variant={settings?.features.registrationEnabled ? "default" : "outline"}
                    size="sm"
                    className={settings?.features.registrationEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }
                  >
                    {settings?.features.registrationEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <h3 className="font-medium text-white">Withdrawals</h3>
                    <p className="text-sm text-slate-400">Allow user withdrawals</p>
                  </div>
                  <Button
                    variant={settings?.features.withdrawalsEnabled ? "default" : "outline"}
                    size="sm"
                    className={settings?.features.withdrawalsEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }
                  >
                    {settings?.features.withdrawalsEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <h3 className="font-medium text-white">Lottery System</h3>
                    <p className="text-sm text-slate-400">Enable lottery functionality</p>
                  </div>
                  <Button
                    variant={settings?.features.lotteryEnabled ? "default" : "outline"}
                    size="sm"
                    className={settings?.features.lotteryEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }
                  >
                    {settings?.features.lotteryEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <h3 className="font-medium text-white">Referral System</h3>
                    <p className="text-sm text-slate-400">Enable referral bonuses</p>
                  </div>
                  <Button
                    variant={settings?.features.referralsEnabled ? "default" : "outline"}
                    size="sm"
                    className={settings?.features.referralsEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }
                  >
                    {settings?.features.referralsEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* System Actions */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Database Operations</h3>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleSystemAction('backup')}
                    disabled={saving}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  <Button
                    onClick={() => handleSystemAction('cleanup')}
                    disabled={saving}
                    variant="outline"
                    className="w-full border-orange-600 text-orange-400 hover:bg-orange-600/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Cleanup Logs
                  </Button>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                    <Bell className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">System Maintenance</h3>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleSystemAction('maintenance-mode')}
                    disabled={saving}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Enable Maintenance Mode
                  </Button>
                  <Button
                    onClick={() => handleSystemAction('cache-clear')}
                    disabled={saving}
                    variant="outline"
                    className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;


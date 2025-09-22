"use client";

import { useTranslation } from 'react-i18next';
import { Users, Share2, Gift, Trophy, Copy, Check } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { motion } from 'framer-motion';
import { useState } from 'react';

const SimplifiedReferrals = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { data: userData, isLoading } = useUserData(user?.telegramId);
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/your_bot?start=${user?.telegramId}`;
  const referralCount = userData?.referralCount || 0;
  const referralEarnings = userData?.referralEarnings || 0;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareOptions = [
    {
      title: 'Share via Telegram',
      description: 'Send to your contacts',
      icon: Share2,
      color: 'from-blue-500 to-indigo-600',
      action: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on this amazing platform!')}`;
        window.open(telegramUrl, '_blank');
      }
    },
    {
      title: 'Copy Link',
      description: 'Copy to clipboard',
      icon: copied ? Check : Copy,
      color: copied ? 'from-green-500 to-emerald-600' : 'from-gray-500 to-gray-600',
      action: handleCopyLink
    }
  ];

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <motion.header 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referrals</h1>
            <p className="text-gray-600 dark:text-gray-400">Invite friends and earn rewards</p>
          </div>
        </motion.header>

        {/* Main Content with Tabs */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <EnhancedTabs defaultValue="overview" className="w-full">
            <EnhancedTabsList variant="pills" className="mb-6">
              <EnhancedTabsTrigger value="overview">Overview</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="share">Share</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="rewards">Rewards</EnhancedTabsTrigger>
            </EnhancedTabsList>

            {/* Overview Tab */}
            <EnhancedTabsContent value="overview" variant="card">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SmartCard
                    title="Total Referrals"
                    icon={Users}
                    iconColor="from-blue-500 to-indigo-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {referralCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Friends invited
                    </p>
                  </SmartCard>

                  <SmartCard
                    title="Referral Earnings"
                    icon={Gift}
                    iconColor="from-green-500 to-emerald-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {referralEarnings.toFixed(2)} CFM
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total earned
                    </p>
                  </SmartCard>

                  <SmartCard
                    title="Your Rank"
                    icon={Trophy}
                    iconColor="from-purple-500 to-pink-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userData?.rank || 'Bronze'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current level
                    </p>
                  </SmartCard>
                </div>

                {/* Referral Link Card */}
                <SmartCard
                  title="Your Referral Link"
                  icon={Share2}
                  iconColor="from-orange-500 to-red-600"
                  variant="glass"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this link with your friends:</p>
                      <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                        {referralLink}
                      </p>
                    </div>
                    
                    <CTAButton
                      onClick={handleCopyLink}
                      icon={copied ? Check : Copy}
                      variant={copied ? "success" : "primary"}
                      fullWidth
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </CTAButton>
                  </div>
                </SmartCard>
              </div>
            </EnhancedTabsContent>

            {/* Share Tab */}
            <EnhancedTabsContent value="share" variant="card">
              <div className="space-y-6">
                <SmartCard
                  title="Share Options"
                  icon={Share2}
                  iconColor="from-blue-500 to-indigo-600"
                  variant="glass"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shareOptions.map((option, index) => (
                      <motion.div
                        key={option.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CTAButton
                          onClick={option.action}
                          variant="ghost"
                          className="w-full h-24 flex-col gap-2"
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color}`}>
                            <option.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{option.title}</p>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                        </CTAButton>
                      </motion.div>
                    ))}
                  </div>
                </SmartCard>

                {/* Benefits Card */}
                <SmartCard
                  title="Referral Benefits"
                  icon={Gift}
                  iconColor="from-green-500 to-emerald-600"
                  variant="glass"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">For You</h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• 10% commission on referrals' investments</li>
                          <li>• Bonus rewards for milestones</li>
                          <li>• Higher rank benefits</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">For Friends</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Welcome bonus upon registration</li>
                          <li>• Access to all platform features</li>
                          <li>• 30% returns on investments</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </SmartCard>
              </div>
            </EnhancedTabsContent>

            {/* Rewards Tab */}
            <EnhancedTabsContent value="rewards" variant="card">
              <div className="space-y-6">
                <SmartCard
                  title="Referral Milestones"
                  icon={Trophy}
                  iconColor="from-purple-500 to-pink-600"
                  variant="glass"
                >
                  <div className="space-y-4">
                    {[
                      { level: 'Bronze', referrals: 0, reward: '0 CFM', color: 'from-orange-400 to-orange-600' },
                      { level: 'Silver', referrals: 5, reward: '50 CFM', color: 'from-gray-400 to-gray-600' },
                      { level: 'Gold', referrals: 15, reward: '200 CFM', color: 'from-yellow-400 to-yellow-600' },
                      { level: 'Platinum', referrals: 50, reward: '1000 CFM', color: 'from-purple-400 to-purple-600' },
                    ].map((milestone, index) => (
                      <motion.div
                        key={milestone.level}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-2 ${
                          referralCount >= milestone.referrals 
                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${milestone.color}`}>
                              <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{milestone.level}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.referrals} referrals</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{milestone.reward}</p>
                            {referralCount >= milestone.referrals && (
                              <p className="text-xs text-green-600 dark:text-green-400">✓ Achieved</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </SmartCard>
              </div>
            </EnhancedTabsContent>
          </EnhancedTabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default SimplifiedReferrals;

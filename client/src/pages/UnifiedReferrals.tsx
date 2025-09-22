"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Share2, Gift, Copy, Check } from 'lucide-react';

import { TabbedPageLayout } from '@/components/pages/TabbedPageLayout';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { usePageData } from '@/hooks/usePageData';

const UnifiedReferrals: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData } = usePageData();
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

  const handleBack = () => window.history.back();

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      content: (
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
                {referralEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                CFM earned
              </p>
            </SmartCard>

            <SmartCard
              title="Active Referrals"
              icon={Users}
              iconColor="from-purple-500 to-pink-600"
              variant="minimal"
              size="sm"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userData?.activeReferrals || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Currently active
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this link to invite friends:</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {referralLink}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shareOptions.map((option, index) => (
                  <CTAButton
                    key={index}
                    onClick={option.action}
                    icon={option.icon}
                    variant="outline"
                    className={`bg-gradient-to-r ${option.color} text-white border-0 hover:opacity-90`}
                    fullWidth
                  >
                    {option.title}
                  </CTAButton>
                ))}
              </div>
            </div>
          </SmartCard>
        </div>
      )
    },
    {
      value: "share",
      label: "Share",
      content: (
        <div className="space-y-6">
          <SmartCard
            title="Share Options"
            icon={Share2}
            iconColor="from-blue-500 to-indigo-600"
            variant="glass"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shareOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={option.action}
                  className={`p-4 rounded-xl bg-gradient-to-br ${option.color} text-white cursor-pointer hover:scale-105 transition-transform duration-200`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <option.icon className="w-6 h-6" />
                    <h3 className="font-semibold">{option.title}</h3>
                  </div>
                  <p className="text-sm opacity-90">{option.description}</p>
                </div>
              ))}
            </div>
          </SmartCard>

          <SmartCard
            title="Referral Benefits"
            icon={Gift}
            iconColor="from-green-500 to-emerald-600"
            variant="glass"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 dark:text-green-200">10% of your friend's first investment</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 dark:text-blue-200">5% of their ongoing earnings</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-800 dark:text-purple-200">Bonus rewards for milestones</span>
              </div>
            </div>
          </SmartCard>
        </div>
      )
    },
    {
      value: "rewards",
      label: "Rewards",
      content: (
        <div className="space-y-6">
          <SmartCard
            title="Referral Milestones"
            icon={Gift}
            iconColor="from-purple-500 to-pink-600"
            variant="glass"
          >
            <div className="space-y-4">
              {[
                { count: 5, reward: '50 CFM', description: 'Invite 5 friends' },
                { count: 10, reward: '150 CFM', description: 'Invite 10 friends' },
                { count: 25, reward: '500 CFM', description: 'Invite 25 friends' },
                { count: 50, reward: '1,200 CFM', description: 'Invite 50 friends' }
              ].map((milestone, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    referralCount >= milestone.count
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {milestone.description}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {referralCount}/{milestone.count} friends invited
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {milestone.reward}
                      </p>
                      {referralCount >= milestone.count && (
                        <p className="text-xs text-green-600 dark:text-green-400">✓ Claimed</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SmartCard>

          <SmartCard
            title="Your Earnings"
            icon={Gift}
            iconColor="from-green-500 to-emerald-600"
            variant="glass"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {referralEarnings.toFixed(2)} CFM
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Total referral earnings
              </p>
            </div>
          </SmartCard>
        </div>
      )
    }
  ];

  return (
    <TabbedPageLayout
      title="Referrals"
      subtitle="Invite friends and earn rewards"
      icon={Users}
      iconColor="from-purple-500 to-pink-600"
      onBack={handleBack}
      tabs={tabs}
      defaultTab="overview"
    />
  );
};

export default UnifiedReferrals;

"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { useSlotControl } from '@/hooks/useSlotControl';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { Button } from '@/components/ui/button';

interface SlotControlPanelProps {
  className?: string;
}

export const SlotControlPanel = ({ className = '' }: SlotControlPanelProps) => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const {
    totalSlots,
    activeSlots,
    expiredSlots,
    totalInvested,
    totalEarnings,
    averageReturn,
    isLoading,
    error,
    refetch
  } = useSlotControl(user?.telegramId);

  if (isLoading) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading slot data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center">
          <div className="p-4 bg-destructive/10 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Slot Data</h3>
          <p className="text-muted-foreground mb-4">
            Could not load slot control data. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`minimal-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-foreground">Slot Control</h2>
            <p className="text-sm text-muted-foreground">Manage your mining slots</p>
          </div>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Slots */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Slots</span>
          </div>
          <div className="text-2xl font-light text-foreground">
            {totalSlots}
          </div>
        </div>

        {/* Active Slots */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Active Slots</span>
          </div>
          <div className="text-2xl font-light text-primary">
            {activeSlots}
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="space-y-4">
        {/* Total Invested */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Invested</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {totalInvested.toFixed(6)} MNE
          </div>
        </div>

        {/* Current Earnings */}
        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Current Earnings</span>
          </div>
          <div className="text-sm font-medium text-accent">
            +{totalEarnings.toFixed(6)} MNE
          </div>
        </div>

        {/* Average Return */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Average Return</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {averageReturn.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Status Summary */}
      {expiredSlots > 0 && (
        <div className="mt-4 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {expiredSlots} expired slot{expiredSlots !== 1 ? 's' : ''} need attention
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

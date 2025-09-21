import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';

interface SlotCooldownManagerProps {
  slots: any[];
  onSlotAction?: (slotId: string, action: 'cancel' | 'upgrade') => void;
  className?: string;
}

export const SlotCooldownManager: React.FC<SlotCooldownManagerProps> = memo(({ 
  slots, 
  onSlotAction,
  className = '' 
}) => {
  const [activeSlots, setActiveSlots] = useState<any[]>([]);
  const [expiredSlots, setExpiredSlots] = useState<any[]>([]);

  // Categorize slots based on their status
  useEffect(() => {
    const now = new Date();
    
    const active = slots.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) > now
    );
    
    const expired = slots.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) <= now
    );

    setActiveSlots(active);
    setExpiredSlots(expired);
  }, [slots]);

  const getSlotStatus = (slot: any) => {
    const now = new Date();
    const expiresAt = new Date(slot.expiresAt);
    const timeRemaining = expiresAt.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      return {
        status: 'expired',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        icon: CheckCircle,
        message: 'Ready for collection'
      };
    } else if (timeRemaining < 60 * 60 * 1000) { // Less than 1 hour
      return {
        status: 'ending_soon',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        icon: AlertTriangle,
        message: 'Ending soon'
      };
    } else {
      return {
        status: 'active',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        icon: Clock,
        message: 'Active'
      };
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canCancelSlot = (slot: any) => {
    const now = new Date();
    const createdAt = new Date(slot.createdAt);
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Can't cancel if less than 7 days have passed
    return daysSinceCreation >= 7;
  };

  const handleSlotAction = useCallback((slotId: string, action: 'cancel' | 'upgrade') => {
    onSlotAction?.(slotId, action);
  }, [onSlotAction]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Mining Slots</h3>
            <Badge variant="outline" className="text-xs">
              {activeSlots.length} Active
            </Badge>
          </div>

          {/* Slots List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[...activeSlots, ...expiredSlots].map((slot, index) => {
              const slotStatus = getSlotStatus(slot);
              const StatusIcon = slotStatus.icon;
              const timeRemaining = formatTimeRemaining(slot.expiresAt);
              const canCancel = canCancelSlot(slot);

              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    slotStatus.status === 'expired' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                      : slotStatus.status === 'ending_soon'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${slotStatus.color.replace('500', '100')} dark:${slotStatus.color.replace('500', '900/30')}`}>
                        <StatusIcon className={`w-4 h-4 ${slotStatus.textColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {slot.principal.toFixed(4)} CFM
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${slotStatus.textColor} border-current`}
                          >
                            {slotStatus.message}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {slotStatus.status === 'expired' ? 'Ready to collect' : `${timeRemaining} remaining`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {slotStatus.status === 'expired' ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleSlotAction(slot.id, 'cancel')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Collect
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {!canCancel && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Lock className="w-3 h-3 mr-1" />
                              <span>7d lock</span>
                            </div>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSlotAction(slot.id, 'cancel')}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for active slots */}
                  {slotStatus.status !== 'expired' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            slotStatus.status === 'ending_soon' ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.max(0, Math.min(100, 
                              ((new Date(slot.expiresAt).getTime() - new Date().getTime()) / 
                               (7 * 24 * 60 * 60 * 1000)) * 100
                            ))}%` 
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        30% return over 7 days
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {slots.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Mining Slots
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Purchase your first mining slot to start earning
              </p>
              <Button
                onClick={() => window.location.href = '/slots'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Buy Mining Slot
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {expiredSlots.length > 0 && `${expiredSlots.length} ready to collect`}
              </span>
              <span>7-day cooldown applies</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

SlotCooldownManager.displayName = 'SlotCooldownManager';

"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MiningSlot } from '@/hooks/useSlotsData';
import { useSlotActions } from '@/hooks/useSlotActions';

interface UpgradeSlotDialogProps {
  slot: MiningSlot;
  isOpen: boolean;
  onClose: () => void;
  telegramId: string;
  currentBalance: number;
}

export const UpgradeSlotDialog = ({ slot, isOpen, onClose, telegramId, currentBalance }: UpgradeSlotDialogProps) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const { upgrade, isUpgrading } = useSlotActions();

  const handleUpgrade = () => {
    const upgradeAmount = parseFloat(amount);
    if (isNaN(upgradeAmount) || upgradeAmount <= 0) {
      return;
    }
    upgrade({ telegramId, slotId: slot.id, amount: upgradeAmount }, {
      onSuccess: () => {
        setAmount('');
        onClose();
      }
    });
  };

  const canAfford = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-primary text-white">
        <DialogHeader>
          <DialogTitle>Upgrade Mining Slot</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add more USD to this slot to increase its principal investment and boost your earnings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm space-y-2">
            <p><strong>Current Principal:</strong> {slot.principal.toFixed(4)} USD</p>
            <p><strong>Your Balance:</strong> {currentBalance.toFixed(4)} USD</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium">Amount to Add</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 h-12 text-base sm:h-10 sm:text-sm"
              />
              <Button 
                variant="outline" 
                onClick={() => setAmount(currentBalance.toFixed(4))}
                className="h-12 px-4 text-base sm:h-10 sm:text-sm min-w-[60px]"
              >
                Max
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full sm:w-auto h-12 text-base sm:h-10 sm:text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={isUpgrading || !canAfford} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-12 text-base sm:h-10 sm:text-sm"
          >
            {isUpgrading ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : 'Confirm Upgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

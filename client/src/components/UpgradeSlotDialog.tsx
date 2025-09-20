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
            Add more CFM to this slot to increase its principal investment and boost your earnings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm">
            <p><strong>Current Principal:</strong> {slot.principal.toFixed(4)} CFM</p>
            <p><strong>Your Balance:</strong> {currentBalance.toFixed(4)} CFM</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Add</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
              <Button variant="outline" onClick={() => setAmount(currentBalance.toFixed(4))}>Max</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpgrade} disabled={isUpgrading || !canAfford} className="bg-primary hover:bg-primary/90">
            {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Upgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
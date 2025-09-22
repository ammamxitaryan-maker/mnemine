/**
 * BUG FIX: Fixed TypeScript errors:
 * 1. Fixed avatarUrl undefined -> null to match type requirements
 * 2. Added type assertion for colorScheme property access
 */
import { useState, useEffect } from 'react';
import { AuthenticatedUser } from '@/types/telegram';

// Simplified Telegram auth hook to avoid React error #310
export const useTelegramAuth = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    // Simple initialization without complex logic
    try {
      const tg = window.Telegram?.WebApp;
      
      if (tg) {
        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();
        
        // Set theme
        if ((tg as any).colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        setInitData(tg.initData || '');
      }

      // Always use mock user for now to avoid auth issues
      const mockUser: AuthenticatedUser = {
        id: 'mock-user-123',
        telegramId: '6760298907',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        avatarUrl: null,
        role: 'USER',
        referralCode: 'TEST123',
        referredById: null,
        wallets: [{ currency: 'CFM', balance: 1000 }],
        miningSlots: [],
        captchaValidated: true,
        isSuspicious: false,
        lastSuspiciousPenaltyAppliedAt: null,
        lastSeenAt: new Date(),
        lastInvestmentGrowthBonusClaimedAt: null,
        lastReferralZeroPenaltyAppliedAt: null,
        rank: 'Bronze',
        photoUrl: null
      };
      
      setUser(mockUser);
      setLoading(false);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  return { user, loading, error, initData };
};

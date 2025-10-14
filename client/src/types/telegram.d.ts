interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

// Add backend user fields
interface BackendUser {
  id: string; // Database ID
  telegramId: string; // Telegram ID as string
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'USER'; // Admin role removed from client-side for security
  referralCode: string;
  referredById: string | null;
  wallets: Array<{ currency: string; balance: number }>;
  miningSlots: Array<{
    id: string;
    principal: number;
    accruedEarnings: number;
    startAt: Date;
    lastAccruedAt: Date;
    effectiveWeeklyRate: number;
    expiresAt: Date;
    isActive: boolean;
    type: 'standard' | 'premium' | 'vip';
    isLocked: boolean;
  }>;
  captchaValidated: boolean;
  isSuspicious: boolean;
  lastSuspiciousPenaltyAppliedAt: Date | null;
  lastSeenAt: Date;
  lastInvestmentGrowthBonusClaimedAt: Date | null;
  lastReferralZeroPenaltyAppliedAt: Date | null;
  rank: string | null;
}

// The user object returned by useTelegramAuth
export type AuthenticatedUser = BackendUser & {
  photoUrl?: string; // This seems to be from TelegramWebAppUser, but our backend also stores avatarUrl
};

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramWebAppUser;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isClosingConfirmationEnabled: boolean;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}
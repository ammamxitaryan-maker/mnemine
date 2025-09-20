// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface UserData {
  balance: number;
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number;
  referralCount?: number; // Added for ProfessionalDashboard
  rank?: string | null; // Added for ProfessionalDashboard
}

export interface MiningSlot {
  id: string;
  userId: string;
  principal: number;
  startAt: string;
  lastAccruedAt: string;
  effectiveWeeklyRate: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  type: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  sourceUserId?: string;
  ipAddress?: string;
}

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  isCompleted?: boolean;
  isClaimed?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt?: string;
}

export interface Booster {
  id: string;
  boosterId: string;
  name: string;
  price: number;
  powerIncrease: number;
}

export interface Lottery {
  id: string;
  drawDate: string;
  jackpot: number;
  isDrawn: boolean;
  winningNumbers?: string;
  createdAt: string;
}

export interface LotteryTicket {
  id: string;
  userId: string;
  lotteryId: string;
  numbers: string;
  isWinner: boolean;
  prizeAmount?: number;
  createdAt: string;
}

export interface UserStats {
  totalEarnings: number;
  totalSpending: number;
  referralCount: number;
  activeReferralCount: number;
  tasksCompleted: number;
  slotsOwned: number;
  boostersPurchased: number;
  totalInvested: number;
  isEligible: boolean;
  isSuspicious: boolean;
  rank?: string;
  totalSystemWithdrawals: number;
}
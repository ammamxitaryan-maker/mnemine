// Shared constants between client and server

export const tasks = [
  { taskId: 'JOIN_TELEGRAM', title: 'Join Telegram Channel', description: 'Join our official Telegram channel for updates.', reward: 0.5, link: 'https://t.me/yourchannel' },
  { taskId: 'FOLLOW_X', title: 'Follow us on X', description: 'Follow our official X (Twitter) account.', reward: 0.5, link: 'https://x.com/yourprofile' },
  { taskId: 'SUBSCRIBE_YOUTUBE', title: 'Subscribe on YouTube', description: 'Subscribe to our YouTube channel.', reward: 1.0, link: 'https://youtube.com/yourchannel' },
];

export const achievements = {
  FIRST_DEPOSIT: { id: 'FIRST_DEPOSIT', title: 'First Deposit', description: 'Make your first deposit of any amount.', reward: 0.5 },
  FIVE_REFERRALS: { id: 'FIVE_REFERRALS', title: 'Friend Zone', description: 'Refer 5 friends to the app.', reward: 1.0 },
  COMPLETE_ALL_TASKS: { id: 'COMPLETE_ALL_TASKS', title: 'Taskmaster', description: 'Complete all available social tasks.', reward: 1.0 },
};

export const WELCOME_BONUS_AMOUNT = 3.0; // New constant for welcome bonus
export const DAILY_BONUS_AMOUNT = 0.15;
export const ACTIVITY_TYPE_DAILY_BONUS = 'DAILY_BONUS';

// Welcome bonus is now added directly to NON wallet balance instead of auto-investment // 30% доходность приветственного слота

// Минимальные инвестиции
export const MINIMUM_SLOT_INVESTMENT = 3.0; // Минимальная инвестиция в слот
export const MINIMUM_DEPOSIT_FOR_WITHDRAWAL = 5.0; // Минимальный депозит для вывода

// Реферальная система (только 2 уровня)
export const REFERRAL_COMMISSIONS_L1 = 0.25; // 25% для L1
export const REFERRAL_COMMISSIONS_L2 = 0.15; // 15% для L2
export const REFERRAL_INCOME_CAP_ENABLED = true; // Ограничение реферального дохода балансом

// Блокировки
export const WELCOME_SLOT_LOCKED_DAYS = 7; // Дни блокировки приветственного слота

export const REFERRAL_SIGNUP_BONUS = 3.0; // Бонус за регистрацию
export const REFERRAL_DEPOSIT_BONUS = 1.0; // Бонус за реферала, вложившего реальные деньги
export const REFERRAL_3_IN_3_DAYS_BONUS = 1.0; // Бонус за 3 рефералов за 3 дня

export const SLOT_EXTENSION_COST = 1.0; // в NON
export const SLOT_EXTENSION_DAYS = 7;

// Новые константы для доходности слотов
export const SLOT_WEEKLY_RATE = 0.3; // Доходность всех слотов (всегда 30%)

// Новые константы для рангов (пороги в NON)
export const BRONZE_INVESTOR_THRESHOLD = 10.0;
export const GOLD_MAGNATE_THRESHOLD = 50.0;
export const PLATINUM_GOD_THRESHOLD = 200.0;

// Бонусы за ранги
export const RANK_REFERRAL_BONUS_PERCENTAGE = 0.05; // +5% к реферальным выплатам (старая логика)
// REMOVED: RANK_SLOT_RATE_BONUS_PERCENTAGE - no slot rate bonuses, all slots are 30%

// Новые фиксированные реферальные выплаты для рангов
export const RANKED_REFERRAL_COMMISSIONS_L1 = 0.25; // 25% для L1
export const RANKED_REFERRAL_COMMISSIONS_L2 = 0.15; // 15% для L2
export const RANKED_REFERRAL_COMMISSIONS_L3 = 0.10; // 10% для L3

// REMOVED: REINVESTMENT_BONUS_PERCENTAGE - no reinvestment bonuses, all slots are 30%
// REMOVED: REINVESTMENT_AMOUNT - no reinvestment system

// Параметры фонда
export const FUND_PERCENTAGE_FROM_INVESTMENTS = 0.33; // 33% от всех реальных вложений
export const STARTING_CAPITAL = 100.0; // Стартовый капитал (для симуляции)

// Определение активного реферала
export const ACTIVE_REFERRAL_MIN_SLOTS = 1;
export const ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS = 1; // Для Eligible_i и Active_j

// Антифрод и лимиты
export const SUSPICIOUS_IP_THRESHOLD = 3; // Более 3 IP за 24 часа
export const SUSPICIOUS_DEVICE_THRESHOLD = 3; // Более 3 устройств за 24 часа (пока не используется)
// REMOVED: SLOT_PURCHASE_DAILY_LIMIT - no daily limits for slot purchases
export const WITHDRAWAL_DAILY_LIMIT = 1; // Не более 1 вывода за 24 часа

export const REFERRAL_INCOME_CAP_THRESHOLD = 20.0; // Если V_i <= 20 NON, реферальный доход <= Bal_i(t)
export const INVESTMENT_GROWTH_BONUS_AMOUNT = 3.0; // Бонус за рост вложений
export const REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED = true; // Включить штраф за 0 рефералов за 7 дней

// Бонус за топ-10 лидерборда
export const LEADERBOARD_BONUS_AMOUNT = 5.0;

// Новые константы для бонуса "Дивиденды"
export const DIVIDEND_BASE_RATE = 0.15; // 0.15 * NON V_i
export const DIVIDEND_RAND_MIN = 0.8;
export const DIVIDEND_RAND_MAX = 1.3;
export const DIVIDEND_COOLDOWN_HOURS = 24; // Например, раз в 24 часа

// Missing constants that were imported in walletController.ts
export const REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05]; // Default values for 3 levels
export const RESERVE_FUND_PERCENTAGE = 0.10; // 10% reserve fund
export const MINIMUM_WITHDRAWAL_REGULAR = 3.0;
export const WITHDRAWAL_FEE_PERCENTAGE = 0.05;
export const WITHDRAWAL_REFERRAL_REQUIREMENT = 3;
export const WITHDRAWAL_SLOT_REQUIREMENT = 5;
export const MINIMUM_WITHDRAWAL_FIRST_100 = 2.0;
export const FIRST_100_WITHDRAWALS_LIMIT = 100;
export const WITHDRAWAL_MIN_BALANCE_REQUIREMENT = 5.0;

// Lottery Constants
export const LOTTERY_TICKET_COST = 1.0; // 1 NON per ticket
export const LOTTERY_DRAW_INTERVAL_HOURS = 24; // New draw every 24 hours
export const LOTTERY_JACKPOT_SEED = 700.0; // Starting jackpot
export const LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE = 0.5; // 50% of ticket cost goes to jackpot

// Lottery Prize Distribution
export const LOTTERY_PRIZE_DISTRIBUTION = {
  MATCH_6: 0.70, // 70% of the jackpot
  MATCH_5: 0.20, // 20% of the jackpot
  MATCH_4: 0.10, // 10% of the jackpot
};

// RANK_BENEFITS for frontend display
export const RANK_BENEFITS = {
  'Bronze Investor': {
    referralCommissionL1: 0.25,
    referralCommissionL2: 0.15,
    referralCommissionL3: 0.10,
    // REMOVED: slotRateBonus - no slot bonuses, all slots are 30%
  },
  'Gold Magnate': {
    referralCommissionL1: 0.25,
    referralCommissionL2: 0.15,
    referralCommissionL3: 0.10,
    // REMOVED: slotRateBonus - no slot bonuses, all slots are 30%
  },
  'Platinum God': {
    referralCommissionL1: 0.25,
    referralCommissionL2: 0.15,
    referralCommissionL3: 0.10,
    // REMOVED: slotRateBonus - no slot bonuses, all slots are 30%
  },
};

// Base commissions for comparison, from backend/src/constants.ts
export const BASE_REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05];

// Exchange Rate Constants - Limits removed
export const MIN_EXCHANGE_RATE = 0.00001; // 0.001% - Very low minimum
export const MAX_EXCHANGE_RATE = 1000;    // 100000% - Higher maximum
export const DEFAULT_EXCHANGE_RATE = 0.01; // 1%

// NON Currency Support
export const NON_CURRENCY = 'NON';

// Конвертация валют - Limits removed
export const MINIMUM_CONVERSION_AMOUNT = 0.001; // Very low minimum amount
export const MINIMUM_WITHDRAWAL_NON = 3.0; // Минимальная сумма вывода NON
export const EXCHANGE_RATE_VARIATION_MIN = 0.0; // Минимальное отклонение курса (0%)
export const EXCHANGE_RATE_VARIATION_MAX = 0.05; // Максимальное отклонение курса (5%)

// Уведомления
export const NOTIFICATION_TYPES = {
  SLOT_EXPIRED: 'SLOT_EXPIRED',
  SLOT_AUTO_CLOSED: 'SLOT_AUTO_CLOSED',
  ADMIN_MESSAGE: 'ADMIN_MESSAGE',
  LOTTERY_WIN: 'LOTTERY_WIN',
  REFERRAL_JOINED: 'REFERRAL_JOINED',
  INVESTMENT_COMPLETED: 'INVESTMENT_COMPLETED',
} as const;

// Missing ActivityLogType constants
export const EARNINGS_CLAIMED = 'EARNINGS_CLAIMED';
export const SLOT_EXTENDED = 'SLOT_EXTENDED';
export const SLOT_UPGRADED = 'SLOT_UPGRADED';
export const DAILY_PAYOUT = 'DAILY_PAYOUT';
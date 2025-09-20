// Shared constants between client and server
const boosters = [
  { id: 'booster_1', name: 'GPU Upgrade Mk. II', price: 1.5, powerIncrease: 0.10 },
  { id: 'booster_2', name: 'Quantum Cooler', price: 5, powerIncrease: 0.40 },
  { id: 'booster_3', name: 'Singularity Core', price: 10, powerIncrease: 1.0 },
];

const tasks = [
  { taskId: 'JOIN_TELEGRAM', title: 'Join Telegram Channel', description: 'Join our official Telegram channel for updates.', reward: 0.5, link: 'https://t.me/yourchannel' },
  { taskId: 'FOLLOW_X', title: 'Follow us on X', description: 'Follow our official X (Twitter) account.', reward: 0.5, link: 'https://x.com/yourprofile' },
  { taskId: 'SUBSCRIBE_YOUTUBE', title: 'Subscribe on YouTube', description: 'Subscribe to our YouTube channel.', reward: 1.0, link: 'https://youtube.com/yourchannel' },
];

const achievements = {
  FIRST_DEPOSIT: { id: 'FIRST_DEPOSIT', title: 'First Deposit', description: 'Make your first deposit of any amount.', reward: 0.5 },
  FIVE_REFERRALS: { id: 'FIVE_REFERRALS', title: 'Friend Zone', description: 'Refer 5 friends to the app.', reward: 1.0 },
  BUY_BOOSTER: { id: 'BUY_BOOSTER', title: 'Power Up!', description: 'Purchase your first booster.', reward: 0.25 },
  COMPLETE_ALL_TASKS: { id: 'COMPLETE_ALL_TASKS', title: 'Taskmaster', description: 'Complete all available social tasks.', reward: 1.0 },
};

const WELCOME_BONUS_AMOUNT = 3.0; // New constant for welcome bonus
const DAILY_BONUS_AMOUNT = 0.15;
const ACTIVITY_TYPE_DAILY_BONUS = 'DAILY_BONUS';

const REFERRAL_SIGNUP_BONUS = 3.0; // Бонус за регистрацию
const REFERRAL_DEPOSIT_BONUS = 1.0; // Бонус за реферала, вложившего реальные деньги
const REFERRAL_3_IN_3_DAYS_BONUS = 1.0; // Бонус за 3 рефералов за 3 дня

const SLOT_EXTENSION_COST = 1.0; // в CFM
const SLOT_EXTENSION_DAYS = 7;

// Новые константы для доходности слотов
const BASE_STANDARD_SLOT_WEEKLY_RATE = 0.3; // Базовая доходность стандартного слота

// Новые константы для рангов (пороги в CFM)
const BRONZE_INVESTOR_THRESHOLD = 10.0;
const GOLD_MAGNATE_THRESHOLD = 50.0;
const PLATINUM_GOD_THRESHOLD = 200.0;

// Бонусы за ранги
const RANK_REFERRAL_BONUS_PERCENTAGE = 0.05; // +5% к реферальным выплатам (старая логика)
const RANK_SLOT_RATE_BONUS_PERCENTAGE = 0.10; // +10% к доходности слота (0.10, не 0.4)

// Новые фиксированные реферальные выплаты для рангов
const RANKED_REFERRAL_COMMISSIONS_L1 = 0.25; // 25% для L1
const RANKED_REFERRAL_COMMISSIONS_L2 = 0.15; // 15% для L2
const RANKED_REFERRAL_COMMISSIONS_L3 = 0.10; // 10% для L3

const REINVESTMENT_BONUS_PERCENTAGE = 0.15; // +15% к доходности за 100% реинвестиции
const REINVESTMENT_AMOUNT = 0.9; // Сумма реинвестиции в слот

// Параметры фонда
const FUND_PERCENTAGE_FROM_INVESTMENTS = 0.33; // 33% от всех реальных вложений
const STARTING_CAPITAL = 100.0; // Стартовый капитал (для симуляции)

// Определение активного реферала
const ACTIVE_REFERRAL_MIN_SLOTS = 1;
const ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS = 1; // Для Eligible_i и Active_j

// Антифрод и лимиты
const SUSPICIOUS_IP_THRESHOLD = 3; // Более 3 IP за 24 часа
const SUSPICIOUS_DEVICE_THRESHOLD = 3; // Более 3 устройств за 24 часа (пока не используется)
const SLOT_PURCHASE_DAILY_LIMIT = 5; // Не более 5 слотов за 24 часа
const WITHDRAWAL_DAILY_LIMIT = 1; // Не более 1 вывода за 24 часа

const REFERRAL_INCOME_CAP_THRESHOLD = 20.0; // Если V_i <= 20 USDT, реферальный доход <= Bal_i(t)
const INVESTMENT_GROWTH_BONUS_AMOUNT = 3.0; // Бонус за рост вложений
const REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED = true; // Включить штраф за 0 рефералов за 7 дней

// Бонус за топ-10 лидерборда
const LEADERBOARD_BONUS_AMOUNT = 5.0;

// Новые константы для бонуса "Дивиденды"
const DIVIDEND_BASE_RATE = 0.15; // 0.15 * CFM V_i
const DIVIDEND_RAND_MIN = 0.8;
const DIVIDEND_RAND_MAX = 1.3;
const DIVIDEND_COOLDOWN_HOURS = 24; // Например, раз в 24 часа

// Missing constants that were imported in walletController.ts
const REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05]; // Default values for 3 levels
const RESERVE_FUND_PERCENTAGE = 0.10; // 10% reserve fund
const MINIMUM_WITHDRAWAL_REGULAR = 3.0;
const WITHDRAWAL_FEE_PERCENTAGE = 0.05;
const WITHDRAWAL_REFERRAL_REQUIREMENT = 3;
const WITHDRAWAL_SLOT_REQUIREMENT = 5;
const MINIMUM_WITHDRAWAL_FIRST_100 = 2.0;
const FIRST_100_WITHDRAWALS_LIMIT = 100;
const WITHDRAWAL_MIN_BALANCE_REQUIREMENT = 5.0;

// Lottery Constants
const LOTTERY_TICKET_COST = 1.0; // 1 CFM per ticket
const LOTTERY_DRAW_INTERVAL_HOURS = 24; // New draw every 24 hours
const LOTTERY_JACKPOT_SEED = 100.0; // Starting jackpot
const LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE = 0.5; // 50% of ticket cost goes to jackpot

// Lottery Prize Distribution
const LOTTERY_PRIZE_DISTRIBUTION = {
  MATCH_6: 0.70, // 70% of the jackpot
  MATCH_5: 0.20, // 20% of the jackpot
  MATCH_4: 0.10, // 10% of the jackpot
};

// RANK_BENEFITS for frontend display
const RANK_BENEFITS = {
  'Bronze Investor': {
    referralCommissionL1: RANKED_REFERRAL_COMMISSIONS_L1,
    referralCommissionL2: RANKED_REFERRAL_COMMISSIONS_L2,
    referralCommissionL3: RANKED_REFERRAL_COMMISSIONS_L3,
    slotRateBonus: RANK_SLOT_RATE_BONUS_PERCENTAGE,
  },
  'Gold Magnate': {
    referralCommissionL1: RANKED_REFERRAL_COMMISSIONS_L1,
    referralCommissionL2: RANKED_REFERRAL_COMMISSIONS_L2,
    referralCommissionL3: RANKED_REFERRAL_COMMISSIONS_L3,
    slotRateBonus: RANK_SLOT_RATE_BONUS_PERCENTAGE,
  },
  'Platinum God': {
    referralCommissionL1: RANKED_REFERRAL_COMMISSIONS_L1,
    referralCommissionL2: RANKED_REFERRAL_COMMISSIONS_L2,
    referralCommissionL3: RANKED_REFERRAL_COMMISSIONS_L3,
    slotRateBonus: RANK_SLOT_RATE_BONUS_PERCENTAGE,
  },
};

// Base commissions for comparison, from backend/src/constants.ts
const BASE_REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05];

// ES6 exports for client compatibility
export {
  boosters,
  tasks,
  achievements,
  WELCOME_BONUS_AMOUNT,
  DAILY_BONUS_AMOUNT,
  ACTIVITY_TYPE_DAILY_BONUS,
  REFERRAL_SIGNUP_BONUS,
  REFERRAL_DEPOSIT_BONUS,
  REFERRAL_3_IN_3_DAYS_BONUS,
  SLOT_EXTENSION_COST,
  SLOT_EXTENSION_DAYS,
  BASE_STANDARD_SLOT_WEEKLY_RATE,
  BRONZE_INVESTOR_THRESHOLD,
  GOLD_MAGNATE_THRESHOLD,
  PLATINUM_GOD_THRESHOLD,
  RANK_REFERRAL_BONUS_PERCENTAGE,
  RANK_SLOT_RATE_BONUS_PERCENTAGE,
  RANKED_REFERRAL_COMMISSIONS_L1,
  RANKED_REFERRAL_COMMISSIONS_L2,
  RANKED_REFERRAL_COMMISSIONS_L3,
  REINVESTMENT_BONUS_PERCENTAGE,
  REINVESTMENT_AMOUNT,
  FUND_PERCENTAGE_FROM_INVESTMENTS,
  STARTING_CAPITAL,
  ACTIVE_REFERRAL_MIN_SLOTS,
  ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS,
  SUSPICIOUS_IP_THRESHOLD,
  SUSPICIOUS_DEVICE_THRESHOLD,
  SLOT_PURCHASE_DAILY_LIMIT,
  WITHDRAWAL_DAILY_LIMIT,
  REFERRAL_INCOME_CAP_THRESHOLD,
  INVESTMENT_GROWTH_BONUS_AMOUNT,
  REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED,
  LEADERBOARD_BONUS_AMOUNT,
  DIVIDEND_BASE_RATE,
  DIVIDEND_RAND_MIN,
  DIVIDEND_RAND_MAX,
  DIVIDEND_COOLDOWN_HOURS,
  REFERRAL_COMMISSIONS,
  RESERVE_FUND_PERCENTAGE,
  MINIMUM_WITHDRAWAL_REGULAR,
  WITHDRAWAL_FEE_PERCENTAGE,
  WITHDRAWAL_REFERRAL_REQUIREMENT,
  WITHDRAWAL_SLOT_REQUIREMENT,
  MINIMUM_WITHDRAWAL_FIRST_100,
  FIRST_100_WITHDRAWALS_LIMIT,
  WITHDRAWAL_MIN_BALANCE_REQUIREMENT,
  LOTTERY_TICKET_COST,
  LOTTERY_DRAW_INTERVAL_HOURS,
  LOTTERY_JACKPOT_SEED,
  LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE,
  LOTTERY_PRIZE_DISTRIBUTION,
  RANK_BENEFITS,
  BASE_REFERRAL_COMMISSIONS,
};

// CommonJS exports for server compatibility (using dynamic import detection)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    boosters,
    tasks,
    achievements,
    WELCOME_BONUS_AMOUNT,
    DAILY_BONUS_AMOUNT,
    ACTIVITY_TYPE_DAILY_BONUS,
    REFERRAL_SIGNUP_BONUS,
    REFERRAL_DEPOSIT_BONUS,
    REFERRAL_3_IN_3_DAYS_BONUS,
    SLOT_EXTENSION_COST,
    SLOT_EXTENSION_DAYS,
    BASE_STANDARD_SLOT_WEEKLY_RATE,
    BRONZE_INVESTOR_THRESHOLD,
    GOLD_MAGNATE_THRESHOLD,
    PLATINUM_GOD_THRESHOLD,
    RANK_REFERRAL_BONUS_PERCENTAGE,
    RANK_SLOT_RATE_BONUS_PERCENTAGE,
    RANKED_REFERRAL_COMMISSIONS_L1,
    RANKED_REFERRAL_COMMISSIONS_L2,
    RANKED_REFERRAL_COMMISSIONS_L3,
    REINVESTMENT_BONUS_PERCENTAGE,
    REINVESTMENT_AMOUNT,
    FUND_PERCENTAGE_FROM_INVESTMENTS,
    STARTING_CAPITAL,
    ACTIVE_REFERRAL_MIN_SLOTS,
    ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS,
    SUSPICIOUS_IP_THRESHOLD,
    SUSPICIOUS_DEVICE_THRESHOLD,
    SLOT_PURCHASE_DAILY_LIMIT,
    WITHDRAWAL_DAILY_LIMIT,
    REFERRAL_INCOME_CAP_THRESHOLD,
    INVESTMENT_GROWTH_BONUS_AMOUNT,
    REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED,
    LEADERBOARD_BONUS_AMOUNT,
    DIVIDEND_BASE_RATE,
    DIVIDEND_RAND_MIN,
    DIVIDEND_RAND_MAX,
    DIVIDEND_COOLDOWN_HOURS,
    REFERRAL_COMMISSIONS,
    RESERVE_FUND_PERCENTAGE,
    MINIMUM_WITHDRAWAL_REGULAR,
    WITHDRAWAL_FEE_PERCENTAGE,
    WITHDRAWAL_REFERRAL_REQUIREMENT,
    WITHDRAWAL_SLOT_REQUIREMENT,
    MINIMUM_WITHDRAWAL_FIRST_100,
    FIRST_100_WITHDRAWALS_LIMIT,
    WITHDRAWAL_MIN_BALANCE_REQUIREMENT,
    LOTTERY_TICKET_COST,
    LOTTERY_DRAW_INTERVAL_HOURS,
    LOTTERY_JACKPOT_SEED,
    LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE,
    LOTTERY_PRIZE_DISTRIBUTION,
    RANK_BENEFITS,
    BASE_REFERRAL_COMMISSIONS,
  };
}
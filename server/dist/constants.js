"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOTTERY_JACKPOT_SEED = exports.LOTTERY_DRAW_INTERVAL_HOURS = exports.LOTTERY_TICKET_COST = exports.WITHDRAWAL_MIN_BALANCE_REQUIREMENT = exports.FIRST_100_WITHDRAWALS_LIMIT = exports.MINIMUM_WITHDRAWAL_FIRST_100 = exports.WITHDRAWAL_SLOT_REQUIREMENT = exports.WITHDRAWAL_REFERRAL_REQUIREMENT = exports.WITHDRAWAL_FEE_PERCENTAGE = exports.MINIMUM_WITHDRAWAL_REGULAR = exports.RESERVE_FUND_PERCENTAGE = exports.REFERRAL_COMMISSIONS = exports.DIVIDEND_COOLDOWN_HOURS = exports.DIVIDEND_RAND_MAX = exports.DIVIDEND_RAND_MIN = exports.DIVIDEND_BASE_RATE = exports.LEADERBOARD_BONUS_AMOUNT = exports.REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED = exports.INVESTMENT_GROWTH_BONUS_AMOUNT = exports.REFERRAL_INCOME_CAP_THRESHOLD = exports.WITHDRAWAL_DAILY_LIMIT = exports.SLOT_PURCHASE_DAILY_LIMIT = exports.SUSPICIOUS_DEVICE_THRESHOLD = exports.SUSPICIOUS_IP_THRESHOLD = exports.ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS = exports.ACTIVE_REFERRAL_MIN_SLOTS = exports.STARTING_CAPITAL = exports.FUND_PERCENTAGE_FROM_INVESTMENTS = exports.REINVESTMENT_AMOUNT = exports.REINVESTMENT_BONUS_PERCENTAGE = exports.RANKED_REFERRAL_COMMISSIONS_L3 = exports.RANKED_REFERRAL_COMMISSIONS_L2 = exports.RANKED_REFERRAL_COMMISSIONS_L1 = exports.RANK_SLOT_RATE_BONUS_PERCENTAGE = exports.RANK_REFERRAL_BONUS_PERCENTAGE = exports.PLATINUM_GOD_THRESHOLD = exports.GOLD_MAGNATE_THRESHOLD = exports.BRONZE_INVESTOR_THRESHOLD = exports.BASE_STANDARD_SLOT_WEEKLY_RATE = exports.SLOT_EXTENSION_DAYS = exports.SLOT_EXTENSION_COST = exports.REFERRAL_3_IN_3_DAYS_BONUS = exports.REFERRAL_DEPOSIT_BONUS = exports.REFERRAL_SIGNUP_BONUS = exports.ACTIVITY_TYPE_DAILY_BONUS = exports.DAILY_BONUS_AMOUNT = exports.WELCOME_BONUS_AMOUNT = exports.achievements = exports.tasks = exports.boosters = void 0;
exports.CFMT_CURRENCY = exports.DEFAULT_EXCHANGE_RATE = exports.MAX_EXCHANGE_RATE = exports.MIN_EXCHANGE_RATE = exports.BASE_REFERRAL_COMMISSIONS = exports.RANK_BENEFITS = exports.LOTTERY_PRIZE_DISTRIBUTION = exports.LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE = void 0;
// Shared constants between client and server
exports.boosters = [
    { id: 'booster_1', name: 'GPU Upgrade Mk. II', price: 1.5, powerIncrease: 0.10 },
    { id: 'booster_2', name: 'Quantum Cooler', price: 5, powerIncrease: 0.40 },
    { id: 'booster_3', name: 'Singularity Core', price: 10, powerIncrease: 1.0 },
];
exports.tasks = [
    { taskId: 'JOIN_TELEGRAM', title: 'Join Telegram Channel', description: 'Join our official Telegram channel for updates.', reward: 0.5, link: 'https://t.me/yourchannel' },
    { taskId: 'FOLLOW_X', title: 'Follow us on X', description: 'Follow our official X (Twitter) account.', reward: 0.5, link: 'https://x.com/yourprofile' },
    { taskId: 'SUBSCRIBE_YOUTUBE', title: 'Subscribe on YouTube', description: 'Subscribe to our YouTube channel.', reward: 1.0, link: 'https://youtube.com/yourchannel' },
];
exports.achievements = {
    FIRST_DEPOSIT: { id: 'FIRST_DEPOSIT', title: 'First Deposit', description: 'Make your first deposit of any amount.', reward: 0.5 },
    FIVE_REFERRALS: { id: 'FIVE_REFERRALS', title: 'Friend Zone', description: 'Refer 5 friends to the app.', reward: 1.0 },
    BUY_BOOSTER: { id: 'BUY_BOOSTER', title: 'Power Up!', description: 'Purchase your first booster.', reward: 0.25 },
    COMPLETE_ALL_TASKS: { id: 'COMPLETE_ALL_TASKS', title: 'Taskmaster', description: 'Complete all available social tasks.', reward: 1.0 },
};
exports.WELCOME_BONUS_AMOUNT = 3.0; // New constant for welcome bonus
exports.DAILY_BONUS_AMOUNT = 0.15;
exports.ACTIVITY_TYPE_DAILY_BONUS = 'DAILY_BONUS';
exports.REFERRAL_SIGNUP_BONUS = 3.0; // Бонус за регистрацию
exports.REFERRAL_DEPOSIT_BONUS = 1.0; // Бонус за реферала, вложившего реальные деньги
exports.REFERRAL_3_IN_3_DAYS_BONUS = 1.0; // Бонус за 3 рефералов за 3 дня
exports.SLOT_EXTENSION_COST = 1.0; // в CFM
exports.SLOT_EXTENSION_DAYS = 7;
// Новые константы для доходности слотов
exports.BASE_STANDARD_SLOT_WEEKLY_RATE = 0.3; // Базовая доходность стандартного слота
// Новые константы для рангов (пороги в CFM)
exports.BRONZE_INVESTOR_THRESHOLD = 10.0;
exports.GOLD_MAGNATE_THRESHOLD = 50.0;
exports.PLATINUM_GOD_THRESHOLD = 200.0;
// Бонусы за ранги
exports.RANK_REFERRAL_BONUS_PERCENTAGE = 0.05; // +5% к реферальным выплатам (старая логика)
exports.RANK_SLOT_RATE_BONUS_PERCENTAGE = 0.10; // +10% к доходности слота (0.10, не 0.4)
// Новые фиксированные реферальные выплаты для рангов
exports.RANKED_REFERRAL_COMMISSIONS_L1 = 0.25; // 25% для L1
exports.RANKED_REFERRAL_COMMISSIONS_L2 = 0.15; // 15% для L2
exports.RANKED_REFERRAL_COMMISSIONS_L3 = 0.10; // 10% для L3
exports.REINVESTMENT_BONUS_PERCENTAGE = 0.15; // +15% к доходности за 100% реинвестиции
exports.REINVESTMENT_AMOUNT = 0.9; // Сумма реинвестиции в слот
// Параметры фонда
exports.FUND_PERCENTAGE_FROM_INVESTMENTS = 0.33; // 33% от всех реальных вложений
exports.STARTING_CAPITAL = 100.0; // Стартовый капитал (для симуляции)
// Определение активного реферала
exports.ACTIVE_REFERRAL_MIN_SLOTS = 1;
exports.ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS = 1; // Для Eligible_i и Active_j
// Антифрод и лимиты
exports.SUSPICIOUS_IP_THRESHOLD = 3; // Более 3 IP за 24 часа
exports.SUSPICIOUS_DEVICE_THRESHOLD = 3; // Более 3 устройств за 24 часа (пока не используется)
exports.SLOT_PURCHASE_DAILY_LIMIT = 5; // Не более 5 слотов за 24 часа
exports.WITHDRAWAL_DAILY_LIMIT = 1; // Не более 1 вывода за 24 часа
exports.REFERRAL_INCOME_CAP_THRESHOLD = 20.0; // Если V_i <= 20 USDT, реферальный доход <= Bal_i(t)
exports.INVESTMENT_GROWTH_BONUS_AMOUNT = 3.0; // Бонус за рост вложений
exports.REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED = true; // Включить штраф за 0 рефералов за 7 дней
// Бонус за топ-10 лидерборда
exports.LEADERBOARD_BONUS_AMOUNT = 5.0;
// Новые константы для бонуса "Дивиденды"
exports.DIVIDEND_BASE_RATE = 0.15; // 0.15 * CFM V_i
exports.DIVIDEND_RAND_MIN = 0.8;
exports.DIVIDEND_RAND_MAX = 1.3;
exports.DIVIDEND_COOLDOWN_HOURS = 24; // Например, раз в 24 часа
// Missing constants that were imported in walletController.ts
exports.REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05]; // Default values for 3 levels
exports.RESERVE_FUND_PERCENTAGE = 0.10; // 10% reserve fund
exports.MINIMUM_WITHDRAWAL_REGULAR = 3.0;
exports.WITHDRAWAL_FEE_PERCENTAGE = 0.05;
exports.WITHDRAWAL_REFERRAL_REQUIREMENT = 3;
exports.WITHDRAWAL_SLOT_REQUIREMENT = 5;
exports.MINIMUM_WITHDRAWAL_FIRST_100 = 2.0;
exports.FIRST_100_WITHDRAWALS_LIMIT = 100;
exports.WITHDRAWAL_MIN_BALANCE_REQUIREMENT = 5.0;
// Lottery Constants
exports.LOTTERY_TICKET_COST = 1.0; // 1 CFM per ticket
exports.LOTTERY_DRAW_INTERVAL_HOURS = 24; // New draw every 24 hours
exports.LOTTERY_JACKPOT_SEED = 100.0; // Starting jackpot
exports.LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE = 0.5; // 50% of ticket cost goes to jackpot
// Lottery Prize Distribution
exports.LOTTERY_PRIZE_DISTRIBUTION = {
    MATCH_6: 0.70, // 70% of the jackpot
    MATCH_5: 0.20, // 20% of the jackpot
    MATCH_4: 0.10, // 10% of the jackpot
};
// RANK_BENEFITS for frontend display
exports.RANK_BENEFITS = {
    'Bronze Investor': {
        referralCommissionL1: exports.RANKED_REFERRAL_COMMISSIONS_L1,
        referralCommissionL2: exports.RANKED_REFERRAL_COMMISSIONS_L2,
        referralCommissionL3: exports.RANKED_REFERRAL_COMMISSIONS_L3,
        slotRateBonus: exports.RANK_SLOT_RATE_BONUS_PERCENTAGE,
    },
    'Gold Magnate': {
        referralCommissionL1: exports.RANKED_REFERRAL_COMMISSIONS_L1,
        referralCommissionL2: exports.RANKED_REFERRAL_COMMISSIONS_L2,
        referralCommissionL3: exports.RANKED_REFERRAL_COMMISSIONS_L3,
        slotRateBonus: exports.RANK_SLOT_RATE_BONUS_PERCENTAGE,
    },
    'Platinum God': {
        referralCommissionL1: exports.RANKED_REFERRAL_COMMISSIONS_L1,
        referralCommissionL2: exports.RANKED_REFERRAL_COMMISSIONS_L2,
        referralCommissionL3: exports.RANKED_REFERRAL_COMMISSIONS_L3,
        slotRateBonus: exports.RANK_SLOT_RATE_BONUS_PERCENTAGE,
    },
};
// Base commissions for comparison, from backend/src/constants.ts
exports.BASE_REFERRAL_COMMISSIONS = [0.20, 0.10, 0.05];
// Exchange Rate Constants
exports.MIN_EXCHANGE_RATE = 0.001; // 0.1%
exports.MAX_EXCHANGE_RATE = 0.03; // 3%
exports.DEFAULT_EXCHANGE_RATE = 0.01; // 1%
// CFMT Currency Support
exports.CFMT_CURRENCY = 'CFMT';

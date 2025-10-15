// Shared constants between client and server

// Withdrawal requirements
export const WITHDRAWAL_MIN_BALANCE_REQUIREMENT = 5.0;
export const WITHDRAWAL_REFERRAL_REQUIREMENT = 3;
export const WITHDRAWAL_SLOT_REQUIREMENT = 5;
export const FIRST_100_WITHDRAWALS_LIMIT = 100;
export const WITHDRAWAL_FEE_PERCENTAGE = 0.05;
export const MINIMUM_WITHDRAWAL_FIRST_100 = 2.0;
export const MINIMUM_WITHDRAWAL_REGULAR = 3.0;

// Lottery Constants
export const LOTTERY_TICKET_COST = 1.0; // 1 USD per ticket
export const LOTTERY_DRAW_INTERVAL_HOURS = 24; // New draw every 24 hours
export const LOTTERY_JACKPOT_SEED = 100.0; // Starting jackpot
export const LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE = 0.5; // 50% of ticket cost goes to jackpot

// Lottery Prize Distribution
export const LOTTERY_PRIZE_DISTRIBUTION = {
  MATCH_6: 0.70, // 70% of the jackpot
  MATCH_5: 0.20, // 20% of the jackpot
  MATCH_4: 0.10, // 10% of the jackpot
};

// Бонусы за ранги
export const RANK_SLOT_RATE_BONUS_PERCENTAGE = 0.10; // +10% к доходности слота (0.10, не 0.4)

// Новые фиксированные реферальные выплаты для рангов
export const RANKED_REFERRAL_COMMISSIONS_L1 = 0.25; // 25% для L1
export const RANKED_REFERRAL_COMMISSIONS_L2 = 0.15; // 15% для L2
export const RANKED_REFERRAL_COMMISSIONS_L3 = 0.10; // 10% для L3

// RANK_BENEFITS for frontend display
export const RANK_BENEFITS = {
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
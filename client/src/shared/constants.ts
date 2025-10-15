// Shared constants between client and server

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
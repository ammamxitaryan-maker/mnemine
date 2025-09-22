import { Request, Response } from 'express';
import prisma from '../prisma';
import { REFERRAL_COMMISSIONS, RESERVE_FUND_PERCENTAGE, MINIMUM_WITHDRAWAL_REGULAR, WITHDRAWAL_FEE_PERCENTAGE, WITHDRAWAL_REFERRAL_REQUIREMENT, WITHDRAWAL_SLOT_REQUIREMENT, REFERRAL_DEPOSIT_BONUS, MINIMUM_WITHDRAWAL_FIRST_100, FIRST_100_WITHDRAWALS_LIMIT, WITHDRAWAL_DAILY_LIMIT, WITHDRAWAL_MIN_BALANCE_REQUIREMENT, REFERRAL_INCOME_CAP_THRESHOLD, REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED, RANKED_REFERRAL_COMMISSIONS_L1, RANKED_REFERRAL_COMMISSIONS_L2, RANKED_REFERRAL_COMMISSIONS_L3 } from '../constants';
import { Wallet, MiningSlot, ActivityLogType } from '@prisma/client';
import { isUserEligible, hasReferredInLast7Days, isUserSuspicious } from '../utils/helpers';
import { userSelect, userSelectWithoutMiningSlots } from '../utils/dbSelects';
import { validateDepositRequest, validateWithdrawalRequest, validateDatabaseTransaction, sanitizeString } from '../utils/advancedValidation';
import { ResponseHelper } from '../utils/responseHelpers';

// POST /api/user/:telegramId/deposit
export const depositFunds = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    // Enhanced validation
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    if (!sanitizedTelegramId) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID');
    }

    // Find user with proper error handling
    const depositor = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: userSelect,
    });

    if (!depositor) {
      return ResponseHelper.notFound(res, 'User not found');
    }

    // Validate amount with enhanced checks
    if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      return ResponseHelper.badRequest(res, 'Invalid deposit amount');
    }

    // Check for precision issues
    if (amount !== Math.round(amount * 100) / 100) {
      return ResponseHelper.badRequest(res, 'Amount cannot have more than 2 decimal places');
    }

    const reserveAmount = amount * RESERVE_FUND_PERCENTAGE;
    const netDeposit = amount - reserveAmount;

    // Enhanced transaction with proper error handling
    const transactionResult = await validateDatabaseTransaction(async () => {
      return await prisma.$transaction(async (tx) => {
        const depositorWallet = depositor.wallets.find((w: Wallet) => w.currency === 'CFM');
        if (!depositorWallet) {
          throw new Error('Depositor CFM wallet not found');
        }
        
        // Update wallet with overflow protection
        const newBalance = depositorWallet.balance + netDeposit;
        if (newBalance > Number.MAX_SAFE_INTEGER) {
          throw new Error('Balance would exceed maximum safe integer');
        }

        await tx.wallet.update({
          where: { id: depositorWallet.id },
          data: { balance: { increment: netDeposit } },
        });

        await tx.user.update({
          where: { id: depositor.id },
          data: { 
            totalInvested: { increment: amount },
            lastDepositAt: depositor.lastDepositAt ? depositor.lastDepositAt : new Date(),
          },
        });

        await tx.activityLog.create({
          data: {
            userId: depositor.id,
            type: ActivityLogType.DEPOSIT,
            amount: netDeposit,
            description: `Deposited ${amount.toFixed(2)} CFM (Net after ${RESERVE_FUND_PERCENTAGE * 100}% reserve)`,
            ipAddress: ipAddress,
          },
        });

        // Process referral commissions with enhanced error handling
        let currentReferrerId = depositor.referredById;
        for (let level = 0; level < REFERRAL_COMMISSIONS.length; level++) {
          if (!currentReferrerId) break;

          const referrer = await tx.user.findUnique({
            where: { id: currentReferrerId },
            select: userSelect,
          });

          if (!referrer) break;

          let commissionRate: number;
          if (referrer.rank) {
            if (level === 0) commissionRate = RANKED_REFERRAL_COMMISSIONS_L1;
            else if (level === 1) commissionRate = RANKED_REFERRAL_COMMISSIONS_L2;
            else commissionRate = RANKED_REFERRAL_COMMISSIONS_L3;
          } else {
            commissionRate = REFERRAL_COMMISSIONS[level];
          }

          let commissionAmount = amount * commissionRate;
          
          // Enhanced commission validation
          if (depositor.totalInvested <= REFERRAL_INCOME_CAP_THRESHOLD) {
            const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'CFM')?.balance || 0;
            if (commissionAmount > referrerWallet) {
              commissionAmount = referrerWallet;
            }
          }

          const referrerIsEligible = await isUserEligible(referrer.id);
          if (!referrerIsEligible) {
            const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'CFM')?.balance || 0;
            commissionAmount = Math.min(commissionAmount * 0.5, 0.5 * referrerWallet);
          }

          const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'CFM');

          if (referrerWallet) {
            // Check for balance overflow
            const newReferrerBalance = referrerWallet.balance + commissionAmount;
            if (newReferrerBalance > Number.MAX_SAFE_INTEGER) {
              throw new Error('Referrer balance would exceed maximum safe integer');
            }

            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: { balance: { increment: commissionAmount } },
            });

            await tx.activityLog.create({
              data: {
                userId: referrer.id,
                type: ActivityLogType.REFERRAL_COMMISSION,
                amount: commissionAmount,
                description: `Level ${level + 1} commission from ${depositor.firstName || depositor.username}${!referrerIsEligible ? ' (cut by 50% & capped)' : ''}`,
                sourceUserId: depositor.id,
                ipAddress: ipAddress,
              },
            });

            // Handle deposit bonus with enhanced validation
            if (level === 0 && !depositor.lastDepositAt) {
              let depositBonusAmount = REFERRAL_DEPOSIT_BONUS;
              if (!referrerIsEligible) {
                const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'CFM')?.balance || 0;
                depositBonusAmount = Math.min(depositBonusAmount * 0.5, 0.5 * referrerWallet);
              }

              // Check for bonus balance overflow
              const newBonusBalance = referrerWallet.balance + depositBonusAmount;
              if (newBonusBalance > Number.MAX_SAFE_INTEGER) {
                throw new Error('Referrer bonus balance would exceed maximum safe integer');
              }

              await tx.wallet.update({
                where: { id: referrerWallet.id },
                data: { balance: { increment: depositBonusAmount } },
              });
              
              await tx.activityLog.create({
                data: {
                  userId: referrer.id,
                  type: ActivityLogType.REFERRAL_DEPOSIT_BONUS,
                  amount: depositBonusAmount,
                  description: `Bonus for referred user @${depositor.username || depositor.firstName} making first deposit${!referrerIsEligible ? ' (cut by 50% & capped)' : ''}`,
                  sourceUserId: depositor.id,
                  ipAddress: ipAddress,
                },
              });
            }
          }
          currentReferrerId = referrer.referredById || null;
        }

        return { success: true };
      });
    });

    if (!transactionResult.success) {
      return ResponseHelper.internalError(res, transactionResult.error || 'Transaction failed');
    }

    ResponseHelper.success(res, null, 'Deposit successful');
  } catch (error) {
    console.error(`Error processing deposit for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// POST /api/user/:telegramId/withdraw
export const withdrawFunds = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount, address } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    // Enhanced validation
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    const sanitizedAddress = sanitizeString(address, 100);
    
    if (!sanitizedTelegramId || !sanitizedAddress) {
      return ResponseHelper.badRequest(res, 'Invalid input data');
    }

    // Validate amount with enhanced checks
    if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      return ResponseHelper.badRequest(res, 'Invalid withdrawal amount');
    }

    // Check for precision issues
    if (amount !== Math.round(amount * 100) / 100) {
      return ResponseHelper.badRequest(res, 'Amount cannot have more than 2 decimal places');
    }

    // Enhanced address validation
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(sanitizedAddress)) {
      return ResponseHelper.badRequest(res, 'Invalid CFM TRC20 address format');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: userSelect,
    });

    if (!user) {
      return ResponseHelper.notFound(res, 'User not found');
    }

    // Enhanced eligibility check
    const userIsEligible = await isUserEligible(user.id);
    if (!userIsEligible) {
      return ResponseHelper.badRequest(res, 'Withdrawals are blocked: You need to increase your investments or have at least 3 active direct referrals.');
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet) {
      return ResponseHelper.badRequest(res, 'CFM wallet not found');
    }

    // Enhanced balance validation
    if (cfmWallet.balance < WITHDRAWAL_MIN_BALANCE_REQUIREMENT) {
      return ResponseHelper.badRequest(res, `Minimum balance for withdrawal is ${WITHDRAWAL_MIN_BALANCE_REQUIREMENT.toFixed(2)} CFM`);
    }

    if (cfmWallet.balance < amount) {
      return ResponseHelper.badRequest(res, 'Insufficient balance');
    }

    // Enhanced rate limiting check
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: ActivityLogType.WITHDRAWAL,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recentWithdrawals >= WITHDRAWAL_DAILY_LIMIT) {
      return ResponseHelper.badRequest(res, `You can only withdraw once every ${24 / WITHDRAWAL_DAILY_LIMIT} hours.`);
    }

    // Enhanced minimum withdrawal validation
    const totalWithdrawalsCount = await prisma.activityLog.count({
      where: { type: ActivityLogType.WITHDRAWAL },
    });

    const minimumWithdrawal = totalWithdrawalsCount < FIRST_100_WITHDRAWALS_LIMIT 
      ? MINIMUM_WITHDRAWAL_FIRST_100 
      : MINIMUM_WITHDRAWAL_REGULAR;

    if (amount < minimumWithdrawal) {
      return ResponseHelper.badRequest(res, `Minimum withdrawal is ${minimumWithdrawal.toFixed(2)} CFM`);
    }

    // Enhanced referral and slot requirements
    if (totalWithdrawalsCount >= FIRST_100_WITHDRAWALS_LIMIT) {
      const activeReferralsCount = await prisma.user.count({
        where: {
          referredById: user.id,
          OR: [
            { miningSlots: { some: { isActive: true } } },
            { referrals: { some: {} } }
          ]
        }
      });

      if (activeReferralsCount < WITHDRAWAL_REFERRAL_REQUIREMENT) {
        return ResponseHelper.badRequest(res, `You need at least ${WITHDRAWAL_REFERRAL_REQUIREMENT} active referrals to withdraw.`);
      }

      if (user.miningSlots.length < WITHDRAWAL_SLOT_REQUIREMENT) {
        return ResponseHelper.badRequest(res, `You need at least ${WITHDRAWAL_SLOT_REQUIREMENT} active mining slots to withdraw.`);
      }
    }

    // Enhanced penalty checks
    if (REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED) {
      const hasReferredRecently = await hasReferredInLast7Days(user.id);
      if (!hasReferredRecently) {
        if (!user.lastReferralZeroPenaltyAppliedAt || (new Date().getTime() - user.lastReferralZeroPenaltyAppliedAt.getTime() > 7 * 24 * 60 * 60 * 1000)) {
          const penaltyResult = await validateDatabaseTransaction(async () => {
            return await prisma.$transaction([
              prisma.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: 0 },
              }),
              prisma.user.update({
                where: { id: user.id },
                data: { lastReferralZeroPenaltyAppliedAt: new Date() },
              }),
              prisma.activityLog.create({
                data: {
                  userId: user.id,
                  type: ActivityLogType.BALANCE_ZEROED_PENALTY,
                  amount: -cfmWallet.balance,
                  description: 'Balance zeroed due to no new referrals in the last 7 days.',
                  ipAddress: ipAddress,
                },
              }),
            ]);
          });

          if (penaltyResult.success) {
            return ResponseHelper.badRequest(res, 'Withdrawals blocked: Your balance was reset due to no new referrals in the last 7 days.');
          }
        }
        return ResponseHelper.badRequest(res, 'Withdrawals blocked: You must refer at least one new friend in the last 7 days to withdraw.');
      }
    }

    // Enhanced suspicious activity check
    const isUserCurrentlySuspicious = await isUserSuspicious(user.id);
    if (isUserCurrentlySuspicious) {
      if (!user.lastSuspiciousPenaltyAppliedAt || (new Date().getTime() - user.lastSuspiciousPenaltyAppliedAt.getTime() > 24 * 60 * 60 * 1000)) {
        const suspiciousResult = await validateDatabaseTransaction(async () => {
          return await prisma.$transaction([
            prisma.wallet.update({
              where: { id: cfmWallet.id },
              data: { balance: 0 },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { 
                isSuspicious: true,
                lastSuspiciousPenaltyAppliedAt: new Date(),
              },
            }),
            prisma.activityLog.create({
              data: {
                userId: user.id,
                type: ActivityLogType.BALANCE_ZEROED_PENALTY,
                amount: -cfmWallet.balance,
                description: 'Balance zeroed due to suspicious activity.',
                ipAddress: ipAddress,
              },
            }),
          ]);
        });

        if (suspiciousResult.success) {
          return ResponseHelper.badRequest(res, 'Withdrawals blocked: Your balance was reset due to suspicious activity.');
        }
      }
      return ResponseHelper.badRequest(res, 'Withdrawals blocked: Your account is flagged for suspicious activity.');
    }

    // Enhanced fee calculation with overflow protection
    const fee = amount * WITHDRAWAL_FEE_PERCENTAGE;
    const amountToReceive = amount - fee;

    if (amountToReceive <= 0) {
      return ResponseHelper.badRequest(res, 'Withdrawal amount too small after fees');
    }

    // Enhanced transaction with proper error handling
    const transactionResult = await validateDatabaseTransaction(async () => {
      return await prisma.$transaction([
        prisma.wallet.update({
          where: { id: cfmWallet.id },
          data: { balance: { decrement: amount } },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.WITHDRAWAL,
            amount: -amount,
            description: `Withdrawal of ${amount.toFixed(2)} CFM to ${sanitizedAddress}. Fee: ${fee.toFixed(2)} CFM.`,
            ipAddress: ipAddress,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { lastWithdrawalAt: new Date() },
        }),
      ]);
    });

    if (!transactionResult.success) {
      return ResponseHelper.internalError(res, transactionResult.error || 'Transaction failed');
    }

    ResponseHelper.success(res, { amountToReceive }, `Withdrawal of ${amountToReceive.toFixed(2)} CFM initiated.`);
  } catch (error) {
    console.error(`Error processing withdrawal for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// POST /api/user/:telegramId/claim
export const claimEarnings = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    if (!sanitizedTelegramId) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: userSelect,
    });

    if (!user) {
      return ResponseHelper.notFound(res, 'User not found');
    }

    const now = new Date();
    let totalEarnings = 0;
    const updatedSlotsData = user.miningSlots.map((slot: MiningSlot) => {
      const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
      if (timeElapsedMs > 0) {
        const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
        totalEarnings += earnings;
        return { id: slot.id, lastAccruedAt: now };
      }
      return null;
    }).filter(Boolean) as { id: string; lastAccruedAt: Date }[];

    // Enhanced earnings validation
    if (totalEarnings < 0.000001) {
      return ResponseHelper.success(res, { claimedAmount: 0 }, 'No significant earnings to claim.');
    }

    // Check for earnings overflow
    if (totalEarnings > Number.MAX_SAFE_INTEGER) {
      return ResponseHelper.internalError(res, 'Earnings amount too large');
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet) {
      return ResponseHelper.badRequest(res, 'CFM wallet not found');
    }

    // Check for balance overflow after claiming
    const newBalance = cfmWallet.balance + totalEarnings;
    if (newBalance > Number.MAX_SAFE_INTEGER) {
      return ResponseHelper.internalError(res, 'Balance would exceed maximum safe integer');
    }

    // Enhanced transaction with proper error handling
    const transactionResult = await validateDatabaseTransaction(async () => {
      return await prisma.$transaction(async (tx) => {
        await tx.wallet.update({ 
          where: { id: cfmWallet.id }, 
          data: { balance: { increment: totalEarnings } } 
        });
        
        for (const slotData of updatedSlotsData) {
          await tx.miningSlot.update({ 
            where: { id: slotData.id }, 
            data: { lastAccruedAt: slotData.lastAccruedAt } 
          });
        }
        
        await tx.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.CLAIM,
            amount: totalEarnings,
            description: 'Claimed mining earnings',
            ipAddress: ipAddress,
          },
        });

        return { success: true };
      });
    });

    if (!transactionResult.success) {
      return ResponseHelper.internalError(res, transactionResult.error || 'Transaction failed');
    }

    ResponseHelper.success(res, { claimedAmount: totalEarnings }, 'Earnings claimed successfully!');
  } catch (error) {
    console.error(`Error claiming earnings for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

import { ActivityLogType, Wallet } from '@prisma/client';
import { Request, Response } from 'express';
import { FIRST_100_WITHDRAWALS_LIMIT, MINIMUM_DEPOSIT_FOR_WITHDRAWAL, MINIMUM_WITHDRAWAL_FIRST_100, MINIMUM_WITHDRAWAL_REGULAR, REFERRAL_COMMISSIONS_L1, REFERRAL_COMMISSIONS_L2, REFERRAL_DEPOSIT_BONUS, REFERRAL_INCOME_CAP_ENABLED, RESERVE_FUND_PERCENTAGE, WITHDRAWAL_DAILY_LIMIT, WITHDRAWAL_FEE_PERCENTAGE, WITHDRAWAL_MIN_BALANCE_REQUIREMENT, WITHDRAWAL_REFERRAL_REQUIREMENT, WITHDRAWAL_SLOT_REQUIREMENT } from '../constants.js'; // Updated import for ranked commissions
import prisma from '../prisma.js';
import { userSelect } from '../utils/dbSelects.js'; // Import userSelect
import { isUserSuspicious } from '../utils/helpers.js';
import { sanitizeInput, validateAddress, validateAmount } from '../utils/validation.js';

// POST /api/user/:telegramId/deposit
export const depositFunds = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body; // Only NON deposits
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

  // Validate input
  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  // Sanitize telegramId
  const sanitizedTelegramId = sanitizeInput(telegramId);
  if (!sanitizedTelegramId) {
    return res.status(400).json({ error: 'Invalid telegram ID' });
  }

  try {
    const depositor = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!depositor) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reserveAmount = amount * RESERVE_FUND_PERCENTAGE;
    const netDeposit = amount - reserveAmount;

    await prisma.$transaction(async (tx) => {
      const depositorWallet = depositor.wallets.find((w: Wallet) => w.currency === 'NON');
      if (!depositorWallet) throw new Error('Depositor NON wallet not found');

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
          description: `Deposited ${amount.toFixed(6)} NON (Net after ${RESERVE_FUND_PERCENTAGE * 100}% reserve)`,
          ipAddress: ipAddress,
        },
      });

      let currentReferrerId = depositor.referredById;
      for (let level = 0; level < 2; level++) { // Только 2 уровня
        if (!currentReferrerId) break;

        const referrer = await tx.user.findUnique({
          where: { id: currentReferrerId },
          select: userSelect, // Use the reusable userSelect
        });

        if (!referrer) break;

        // Определяем процент комиссии (только 2 уровня)
        const commissionRate = level === 0 ? REFERRAL_COMMISSIONS_L1 : REFERRAL_COMMISSIONS_L2;

        let commissionAmount = amount * commissionRate;

        // Ограничиваем реферальный доход текущим балансом реферера
        if (REFERRAL_INCOME_CAP_ENABLED) {
          const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'NON')?.balance || 0;
          commissionAmount = Math.min(commissionAmount, referrerWallet);
        }

        const referrerWallet = referrer.wallets.find((w: Wallet) => w.currency === 'NON');

        if (referrerWallet) {
          await tx.wallet.update({
            where: { id: referrerWallet.id },
            data: { balance: { increment: commissionAmount } },
          });

          await tx.activityLog.create({
            data: {
              userId: referrer.id,
              type: ActivityLogType.REFERRAL_COMMISSION,
              amount: commissionAmount,
              description: `Level ${level + 1} commission from ${depositor.firstName || depositor.username}`,
              sourceUserId: depositor.id,
              ipAddress: ipAddress,
            },
          });

          if (level === 0 && !depositor.lastDepositAt) {
            const depositBonusAmount = REFERRAL_DEPOSIT_BONUS;

            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: { balance: { increment: depositBonusAmount } },
            });
            await tx.activityLog.create({
              data: {
                userId: referrer.id,
                type: ActivityLogType.REFERRAL_DEPOSIT_BONUS,
                amount: depositBonusAmount,
                description: `Bonus for referred user @${depositor.username || depositor.firstName} making first deposit`,
                sourceUserId: depositor.id,
                ipAddress: ipAddress,
              },
            });
          }
        }
        currentReferrerId = referrer.referredById || null;
      }
    });

    res.status(200).json({ message: 'Deposit successful' });
  } catch (error) {
    console.error(`Error processing deposit for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/withdraw
export const withdrawFunds = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount, address } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

  // Validate input
  if (!validateAmount(amount) || !address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid amount or address' });
  }

  if (!validateAddress(address)) {
    return res.status(400).json({ error: 'Invalid NON address format' });
  }

  // Sanitize inputs
  const sanitizedTelegramId = sanitizeInput(telegramId);
  const sanitizedAddress = sanitizeInput(address);

  if (!sanitizedTelegramId || !sanitizedAddress) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Проверяем требования для вывода
    const hasMinimumDeposit = user.totalInvested >= MINIMUM_DEPOSIT_FOR_WITHDRAWAL;
    const activeReferralsCount = await prisma.user.count({
      where: {
        referredById: user.id,
        OR: [
          { miningSlots: { some: { isActive: true } } },
          { referrals: { some: {} } }
        ]
      }
    });

    if (!hasMinimumDeposit && activeReferralsCount < 3) {
      return res.status(400).json({
        error: `You need either a minimum deposit of ${MINIMUM_DEPOSIT_FOR_WITHDRAWAL} NON or 3 active referrals to withdraw.`
      });
    }

    const NONWallet = user.wallets.find((w: Wallet) => w.currency === 'NON');
    if (!NONWallet) return res.status(400).json({ error: 'NON wallet not found' });

    if (NONWallet.balance < WITHDRAWAL_MIN_BALANCE_REQUIREMENT) {
      return res.status(400).json({ error: `Minimum balance for withdrawal is ${WITHDRAWAL_MIN_BALANCE_REQUIREMENT.toFixed(2)} NON` });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: ActivityLogType.WITHDRAWAL,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recentWithdrawals >= WITHDRAWAL_DAILY_LIMIT) {
      return res.status(400).json({ error: `You can only withdraw once every ${24 / WITHDRAWAL_DAILY_LIMIT} hours.` });
    }

    const totalWithdrawalsCount = await prisma.activityLog.count({
      where: { type: ActivityLogType.WITHDRAWAL },
    });

    const minimumWithdrawal = totalWithdrawalsCount < FIRST_100_WITHDRAWALS_LIMIT
      ? MINIMUM_WITHDRAWAL_FIRST_100
      : MINIMUM_WITHDRAWAL_REGULAR;

    if (amount < minimumWithdrawal) return res.status(400).json({ error: `Minimum withdrawal is ${minimumWithdrawal.toFixed(2)} NON` });

    if (NONWallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

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
        return res.status(400).json({ error: `You need at least ${WITHDRAWAL_REFERRAL_REQUIREMENT} active referrals to withdraw.` });
      }

      if (user.miningSlots.length < WITHDRAWAL_SLOT_REQUIREMENT) {
        return res.status(400).json({ error: `You need at least ${WITHDRAWAL_SLOT_REQUIREMENT} active mining slots to withdraw.` });
      }
    }

    const isUserCurrentlySuspicious = await isUserSuspicious(user.id);
    if (isUserCurrentlySuspicious) {
      if (!user.lastSuspiciousPenaltyAppliedAt || (new Date().getTime() - user.lastSuspiciousPenaltyAppliedAt.getTime() > 24 * 60 * 60 * 1000)) {
        await prisma.$transaction([
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
              type: ActivityLogType.BALANCE_FROZEN_PENALTY,
              amount: 0,
              description: 'Balance frozen due to suspicious activity.',
              ipAddress: ipAddress,
            },
          }),
        ]);
        return res.status(400).json({ error: 'Withdrawals blocked: Your balance has been frozen due to suspicious activity.' });
      }
      return res.status(400).json({ error: 'Withdrawals blocked: Your account is flagged for suspicious activity.' });
    }

    const fee = amount * WITHDRAWAL_FEE_PERCENTAGE;
    const amountToReceive = amount - fee;

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: NONWallet.id },
        data: { balance: Math.max(0, NONWallet.balance - amount) },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.WITHDRAWAL,
          amount: -amount,
          description: `Withdrawal of ${amount.toFixed(2)} NON to ${address}. Fee: ${fee.toFixed(2)} NON.`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastWithdrawalAt: new Date() },
      }),
    ]);

    res.status(200).json({ message: `Withdrawal of ${amountToReceive.toFixed(2)} NON initiated.` });
  } catch (error) {
    console.error(`Error processing withdrawal for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/claim
export const claimEarnings = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  if (!telegramId) return res.status(400).json({ error: 'Telegram ID is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    let totalEarnings = 0;
    const updatedSlotsData = user.miningSlots.map(slot => {
      // Проверяем, не заблокирован ли слот
      if (slot.isLocked) {
        return null; // Пропускаем заблокированные слоты
      }

      const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
      if (timeElapsedMs > 0) {
        const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
        totalEarnings += earnings;
        return { id: slot.id, lastAccruedAt: now };
      }
      return null;
    }).filter(Boolean) as { id: string; lastAccruedAt: Date }[];

    if (totalEarnings < 0.000001) {
      return res.status(200).json({ message: 'No significant earnings to claim.', claimedAmount: 0 });
    }

    const NONWallet = user.wallets.find((w: Wallet) => w.currency === 'NON');
    if (!NONWallet) return res.status(400).json({ error: 'NON wallet not found' });

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: NONWallet.id },
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
    });

    res.status(200).json({ message: 'Earnings claimed successfully!', claimedAmount: totalEarnings });
  } catch (error) {
    console.error(`Error claiming earnings for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

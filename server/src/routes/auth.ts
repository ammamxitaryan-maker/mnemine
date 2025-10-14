import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { generateUniqueReferralCode } from '../utils/helpers.js';
import { REFERRAL_SIGNUP_BONUS, SLOT_WEEKLY_RATE, WELCOME_BONUS_AMOUNT, AUTO_INVEST_WELCOME_AMOUNT, WELCOME_SLOT_DURATION_DAYS, WELCOME_SLOT_RATE } from '../constants.js';
import { ActivityLogType } from '@prisma/client';
import { userSelectWithoutMiningSlots } from '../utils/dbSelects.js'; // Import userSelect

const router = Router();
const botToken = process.env.TELEGRAM_BOT_TOKEN;

router.post('/validate', async (req, res) => {
  // console.log('[AUTH] Received /validate request.'); // Removed log
  // console.log(`[AUTH] Using bot token ending in ...${botToken ? botToken.slice(-4) : 'UNDEFINED'}`); // Removed log
  const { initData, startParam } = req.body;
  if (!initData || !botToken) {
    console.error('[AUTH] Validation failed: initData or bot token missing.');
    return res.status(400).json({ error: 'initData and bot token are required' });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const userData = JSON.parse(params.get('user') || '{}');
  if (!hash || !userData.id) {
    console.error('[AUTH] Invalid initData structure. Hash or user ID missing.');
    return res.status(400).json({ error: 'Invalid initData structure' });
  }

  // В продакшене проверяем, что это не testuser
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (String(userData.id) === '123456789' || userData.username === 'testuser')) {
    console.log('[AUTH] Rejecting test user in production:', { id: userData.id, username: userData.username });
    return res.status(403).json({ error: 'Test users not allowed in production' });
  }

  params.delete('hash');
  const dataCheckString = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');

  try {
    if (!botToken) {
      console.error('[AUTH] TELEGRAM_BOT_TOKEN not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      console.error('[AUTH] Authentication failed: Hash mismatch.');
      console.error('[AUTH] Expected hash:', calculatedHash);
      console.error('[AUTH] Received hash:', hash);
      return res.status(403).json({ error: 'Authentication failed: Hash mismatch' });
    }
    
    // console.log(`[AUTH] Hash validation successful for user ${userData.id}.`); // Removed log

    const referredByUser = startParam ? await prisma.user.findUnique({ where: { referralCode: startParam } }) : null;
    if (startParam) {
      // console.log(`[AUTH] Start param found: ${startParam}. Referred by user: ${referredByUser?.id || 'not found'}`); // Removed log
    }

    let user;
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: String(userData.id) },
      include: { 
        wallets: true,
        miningSlots: true,
        referrals: true,
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
    });

    if (existingUser) {
      // console.log(`[AUTH] Existing user ${existingUser.id} found. Updating profile data and lastSeenAt.`); // Removed log
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          avatarUrl: userData.photo_url,
          lastSeenAt: new Date(),
        },
        include: { 
          wallets: true,
          miningSlots: true,
          referrals: true,
          activityLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
      });
      // console.log(`[AUTH] User ${user.id} profile updated.`); // Removed log
    } else {
      // console.log('[AUTH] New user. Starting database transaction for creation and bonuses.'); // Removed log
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            telegramId: String(userData.id),
            username: userData.username,
            firstName: userData.first_name,
            lastName: userData.last_name,
            avatarUrl: userData.photo_url,
            referralCode: await generateUniqueReferralCode(),
            referredById: referredByUser?.id,
            wallets: { 
              create: [
                { currency: 'USD', balance: 0 }, // USD кошелек с 0 балансом
                { currency: 'MNE', balance: 3.0 } // MNE кошелек с 3 токенами приветственного бонуса
              ]
            },
            captchaValidated: true,
            lastSeenAt: new Date(),
          },
        });
        // console.log(`[AUTH] Welcome bonus of ${WELCOME_BONUS_AMOUNT} USD applied to new user ${newUser.id}.`); // Removed log

        await tx.activityLog.create({
          data: {
            userId: newUser.id,
            type: ActivityLogType.WELCOME_BONUS,
            amount: 3.0,
            description: 'Welcome bonus: 3 MNE tokens received. Invest in slots to unlock withdrawal.',
          },
        });
        // console.log(`[AUTH] Welcome bonus of ${WELCOME_BONUS_AMOUNT} USD applied to new user ${newUser.id}.`); // Removed log

        if (referredByUser) {
          // console.log(`[AUTH] New user ${newUser.id} was referred by ${referredByUser.id}. Applying referral bonus.`); // Removed log
          const referrerWallet = await tx.wallet.findFirst({
            where: { userId: referredByUser.id, currency: 'USD' },
          });

          if (referrerWallet) {
            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: { balance: { increment: REFERRAL_SIGNUP_BONUS } },
            });
            await tx.activityLog.create({
              data: {
                userId: referredByUser.id,
                type: ActivityLogType.REFERRAL_SIGNUP_BONUS,
                amount: REFERRAL_SIGNUP_BONUS,
                description: `Bonus for referring user @${newUser.username || newUser.firstName}`,
              },
            });
            // console.log(`[AUTH] Referral bonus of ${REFERRAL_SIGNUP_BONUS} USD applied to user ${referredByUser.id}.`); // Removed log
          } else {
            console.warn(`[AUTH] Could not find USD wallet for referrer ${referredByUser.id} to apply bonus.`);
          }
        }
        // Return newUser with all related data
        return await tx.user.findUnique({
          where: { id: newUser.id },
          include: { 
            wallets: true,
            miningSlots: true,
            referrals: true,
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          },
        });
      });
    }
    
    console.log('[AUTH] Authentication successful for user:', userData.id);
    console.log('[AUTH] User created/updated:', user ? user.id : 'NULL');
    console.log('[AUTH] Returning user data with telegramId:', user?.telegramId);

    return res.status(200).json({ message: 'Authentication successful', user });
  } catch (error) {
    console.error('[AUTH] CRITICAL: Error during validation or DB operation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

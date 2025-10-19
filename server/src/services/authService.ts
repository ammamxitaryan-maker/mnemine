import { ActivityLogType } from '@prisma/client';
import crypto from 'crypto';
import {
  REFERRAL_SIGNUP_BONUS,
  WELCOME_BONUS_AMOUNT
} from '../constants.js';
import prisma from '../prisma.js';
import { generateUniqueReferralCode } from '../utils/helpers.js';

export interface TelegramUserData {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
}

export class AuthService {
  private static botToken = process.env.TELEGRAM_BOT_TOKEN;

  /**
   * Validates Telegram WebApp initData
   */
  static validateTelegramData(initData: string): { isValid: boolean; userData?: TelegramUserData; error?: string } {
    if (!initData || !this.botToken) {
      return { isValid: false, error: 'initData and bot token are required' };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userData = JSON.parse(params.get('user') || '{}');

    if (!hash || !userData.id) {
      return { isValid: false, error: 'Invalid initData structure' };
    }

    // Check for test users in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (String(userData.id) === '123456789' || userData.username === 'testuser')) {
      return { isValid: false, error: 'Test users not allowed in production' };
    }

    // Validate hash
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    try {
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (calculatedHash !== hash) {
        return { isValid: false, error: 'Authentication failed: Hash mismatch' };
      }

      return { isValid: true, userData };
    } catch (error) {
      return { isValid: false, error: 'Hash validation failed' };
    }
  }

  /**
   * Validates simple user data (for login endpoint)
   */
  static validateSimpleUserData(userData: { id: string | number; username?: string; first_name?: string; last_name?: string }): { isValid: boolean; error?: string } {
    if (!userData.id) {
      return { isValid: false, error: 'User ID is required' };
    }

    // Check for test users in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (String(userData.id) === '123456789' || userData.username === 'testuser')) {
      return { isValid: false, error: 'Test users not allowed in production' };
    }

    return { isValid: true };
  }

  /**
   * Finds or creates a user with full data loading
   */
  static async findOrCreateUser(
    userData: TelegramUserData,
    referredByCode?: string
  ): Promise<AuthResult> {
    try {
      const referredByUser = referredByCode ?
        await prisma.user.findUnique({ where: { referralCode: referredByCode } }) :
        null;

      let user = await prisma.user.findUnique({
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

      if (!user) {
        // Create new user
        const referralCode = await generateUniqueReferralCode();

        user = await prisma.user.create({
          data: {
            telegramId: String(userData.id),
            username: userData.username || null,
            firstName: userData.first_name || null,
            lastName: userData.last_name || null,
            avatarUrl: userData.avatar_url || null,
            referralCode,
            referredById: referredByUser?.id || null,
            totalInvested: 0,
            isOnline: true,
            lastSeenAt: new Date(),
            lastActivityAt: new Date(),
            wallets: {
              create: [
                { currency: 'USD', balance: 0 },
                { currency: 'NON', balance: WELCOME_BONUS_AMOUNT } // Give 3 NON as welcome bonus
              ]
            }
          },
          include: {
            wallets: true,
            miningSlots: true,
            referrals: true,
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        });

        // Log welcome bonus
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.WELCOME_BONUS,
            amount: WELCOME_BONUS_AMOUNT,
            description: `Welcome bonus of ${WELCOME_BONUS_AMOUNT} NON added to balance`
          }
        });

        // Handle referral bonus
        if (referredByUser) {
          await this.handleReferralBonus(user.id, referredByUser.id);
        }

        // Log user creation
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.LOGIN,
            amount: 0,
            description: 'User registered and logged in'
          }
        });
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: userData.username || user.username,
            firstName: userData.first_name || user.firstName,
            lastName: userData.last_name || user.lastName,
            avatarUrl: userData.avatar_url || user.avatarUrl,
            isOnline: true,
            lastSeenAt: new Date(),
            lastActivityAt: new Date()
          },
          include: {
            wallets: true,
            miningSlots: true,
            referrals: true,
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        });

        // Log login
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.LOGIN,
            amount: 0,
            description: 'User logged in'
          }
        });
      }

      return { success: true, user };
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      return { success: false, error: 'Failed to authenticate user' };
    }
  }


  /**
   * Handles referral bonus for referrer
   */
  private static async handleReferralBonus(newUserId: string, referrerId: string): Promise<void> {
    // Add referral bonus to referrer's USD wallet
    await prisma.wallet.updateMany({
      where: { userId: referrerId, currency: 'USD' },
      data: { balance: { increment: REFERRAL_SIGNUP_BONUS } }
    });

    // Log referral bonus
    await prisma.activityLog.create({
      data: {
        userId: referrerId,
        type: ActivityLogType.REFERRAL_SIGNUP_BONUS,
        amount: REFERRAL_SIGNUP_BONUS,
        description: `Referral signup bonus for new user ${newUserId}`,
        sourceUserId: newUserId
      }
    });
  }

  /**
   * Updates user's last seen timestamp
   */
  static async updateLastSeen(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastSeenAt: new Date(),
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }

  /**
   * Sets user offline status
   */
  static async setUserOffline(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false }
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }
}

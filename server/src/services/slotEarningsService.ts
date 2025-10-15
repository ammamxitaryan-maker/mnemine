import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { sendInvestmentSlotCompletedNotification } from '../controllers/notificationController.js';
import { ActivityLogType } from '@prisma/client';
import { EARNINGS_CLAIMED } from '../constants.js';
import { webSocketManager } from '../websocket/WebSocketManager.js';
import { earningsAccumulator } from './earningsAccumulator.js';
import { ensureUserWalletsByTelegramId } from '../utils/walletUtils.js';

export class SlotEarningsService {
  // GET /api/user/:telegramId/real-time-income
  static async getRealTimeIncome(req: Request, res: Response) {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    try {
      // Ensure user has all required wallets before processing
      await ensureUserWalletsByTelegramId(telegramId);
      
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          miningSlots: {
            where: { isActive: true },
            select: {
              id: true,
              principal: true,
              startAt: true,
              expiresAt: true,
              effectiveWeeklyRate: true,
              accruedEarnings: true,
              type: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const now = new Date();
      let totalRealTimeEarnings = 0;
      const slotDetails = [];

      for (const slot of user.miningSlots) {
        const timeElapsed = now.getTime() - slot.startAt.getTime();
        const slotDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const progress = Math.min(timeElapsed / slotDuration, 1);
        
        const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;
        const currentEarnings = expectedEarnings * progress;
        
        totalRealTimeEarnings += currentEarnings;
        
        slotDetails.push({
          slotId: slot.id,
          principal: slot.principal,
          currentEarnings: currentEarnings,
          expectedEarnings: expectedEarnings,
          progress: progress * 100,
          timeRemaining: Math.max(0, slot.expiresAt.getTime() - now.getTime()),
          isCompleted: progress >= 1
        });
      }

      res.status(200).json({
        telegramId: user.telegramId,
        totalRealTimeEarnings: totalRealTimeEarnings,
        activeSlots: user.miningSlots.length,
        slotDetails: slotDetails,
        lastUpdated: now.toISOString()
      });
    } catch (error) {
      console.error(`Error fetching real-time income for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/user/:telegramId/accrued-earnings
  static async getUserAccruedEarnings(req: Request, res: Response) {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    try {
      // Ensure user has all required wallets before processing
      await ensureUserWalletsByTelegramId(telegramId);
      
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          miningSlots: {
            select: {
              id: true,
              principal: true,
              startAt: true,
              expiresAt: true,
              effectiveWeeklyRate: true,
              accruedEarnings: true,
              isActive: true,
              type: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const now = new Date();
      let totalAccruedEarnings = 0;
      const slotEarnings = [];

      for (const slot of user.miningSlots) {
        const timeElapsed = now.getTime() - slot.startAt.getTime();
        const slotDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
        const progress = Math.min(timeElapsed / slotDuration, 1);
        
        const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;
        const currentEarnings = expectedEarnings * progress;
        
        totalAccruedEarnings += currentEarnings;
        
        slotEarnings.push({
          slotId: slot.id,
          principal: slot.principal,
          accruedEarnings: slot.accruedEarnings,
          currentEarnings: currentEarnings,
          expectedEarnings: expectedEarnings,
          progress: progress * 100,
          isActive: slot.isActive,
          isCompleted: progress >= 1,
          type: slot.type
        });
      }

      res.status(200).json({
        telegramId: user.telegramId,
        totalAccruedEarnings: totalAccruedEarnings,
        totalSlots: user.miningSlots.length,
        activeSlots: user.miningSlots.filter(s => s.isActive).length,
        slotEarnings: slotEarnings,
        lastUpdated: now.toISOString()
      });
    } catch (error) {
      console.error(`Error fetching accrued earnings for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/user/:telegramId/claim-earnings
  static async claimEarnings(req: Request, res: Response) {
    const { telegramId } = req.params;
    const ipAddress = req.ip;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    try {
      // Ensure user has all required wallets before processing
      await ensureUserWalletsByTelegramId(telegramId);
      
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          wallets: {
            where: { currency: 'USD' }
          },
          miningSlots: {
            where: { 
              isActive: true,
              expiresAt: { lte: new Date() } // Only expired slots
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.miningSlots.length === 0) {
        return res.status(400).json({ error: 'No expired slots available for claiming' });
      }

      const USDWallet = user.wallets[0];
      if (!USDWallet) {
        return res.status(400).json({ error: 'USD wallet not found' });
      }

      let totalClaimedAmount = 0;
      const claimedSlots: any[] = [];

      await prisma.$transaction(async (tx) => {
        for (const slot of user.miningSlots) {
          const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;
          
          // Update slot as inactive and set final earnings
          await tx.miningSlot.update({
            where: { id: slot.id },
            data: {
              isActive: false,
              accruedEarnings: expectedEarnings
            }
          });

          // Update user's MNE wallet
          const MNEWallet = user.wallets.find(w => w.currency === 'MNE');
          if (MNEWallet) {
            await tx.wallet.update({
              where: { id: MNEWallet.id },
              data: {
                balance: { increment: expectedEarnings }
              }
            });
          }

          // Update user's total earnings
          await tx.user.update({
            where: { id: user.id },
            data: {
              totalEarnings: { increment: expectedEarnings }
            }
          });

          // Create activity log
          await tx.activityLog.create({
            data: {
              userId: user.id,
              type: ActivityLogType.CLAIM,
              amount: expectedEarnings,
              description: `Claimed earnings from slot: ${expectedEarnings.toFixed(2)} MNE`,
              ipAddress: ipAddress,
            }
          });

          totalClaimedAmount += expectedEarnings;
          claimedSlots.push({
            slotId: slot.id,
            principal: slot.principal,
            earnings: expectedEarnings
          });
        }
      });

      // Send notification
      try {
        await sendInvestmentSlotCompletedNotification(user.telegramId, 'batch-claim', 0, totalClaimedAmount);
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      // Update WebSocket
      try {
        webSocketManager.sendToUser(user.telegramId, 'EARNINGS_CLAIMED', {
          totalAmount: totalClaimedAmount,
          slotsClaimed: claimedSlots.length
        });
      } catch (wsError) {
        console.error('Failed to send WebSocket update:', wsError);
      }

      res.status(200).json({
        message: `Successfully claimed ${totalClaimedAmount.toFixed(2)} USD from ${claimedSlots.length} slots`,
        totalAmount: totalClaimedAmount,
        slotsClaimed: claimedSlots.length,
        claimedSlots: claimedSlots
      });
    } catch (error) {
      console.error(`Error claiming earnings for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/user/:telegramId/slots/:slotId/claim
  static async claimCompletedSlot(req: Request, res: Response) {
    const { telegramId, slotId } = req.params;
    const ipAddress = req.ip;

    if (!telegramId || !slotId) {
      return res.status(400).json({ error: 'Telegram ID and Slot ID are required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          wallets: {
            where: { currency: 'USD' }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const slot = await prisma.miningSlot.findFirst({
        where: { 
          id: slotId, 
          userId: user.id,
          isActive: true,
          expiresAt: { lte: new Date() } // Only expired slots
        }
      });

      if (!slot) {
        return res.status(404).json({ error: 'Expired slot not found' });
      }

      const USDWallet = user.wallets[0];
      if (!USDWallet) {
        return res.status(400).json({ error: 'USD wallet not found' });
      }

      const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;

      await prisma.$transaction([
        // Update slot as inactive
        prisma.miningSlot.update({
          where: { id: slotId },
          data: {
            isActive: false,
            accruedEarnings: expectedEarnings
          }
        }),
        // Update user's USD wallet
        prisma.wallet.update({
          where: { id: USDWallet.id },
          data: {
            balance: { increment: expectedEarnings }
          }
        }),
        // Update user's total earnings
        prisma.user.update({
          where: { id: user.id },
          data: {
            totalEarnings: { increment: expectedEarnings }
          }
        }),
        // Create activity log
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.CLAIM,
            amount: expectedEarnings,
            description: `Claimed earnings from slot: ${expectedEarnings.toFixed(2)} USD`,
            ipAddress: ipAddress,
          }
        })
      ]);

      // Send notification
      try {
        await sendInvestmentSlotCompletedNotification(user.telegramId, 'auto-claim', 0, expectedEarnings);
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      // Update WebSocket
      try {
        webSocketManager.sendToUser(user.telegramId, 'SLOT_EARNINGS_CLAIMED', {
          slotId: slotId,
          amount: expectedEarnings
        });
      } catch (wsError) {
        console.error('Failed to send WebSocket update:', wsError);
      }

      res.status(200).json({
        message: `Successfully claimed ${expectedEarnings.toFixed(2)} USD from slot`,
        slotId: slotId,
        principal: slot.principal,
        earnings: expectedEarnings
      });
    } catch (error) {
      console.error(`Error claiming slot earnings for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Background process for expired slots
  static async processExpiredSlots() {
    try {
      const expiredSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: { lte: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              wallets: {
                where: { currency: 'USD' }
              }
            }
          }
        }
      });

      for (const slot of expiredSlots) {
        try {
          const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;
          const USDWallet = slot.user.wallets[0];

          if (USDWallet) {
            await prisma.$transaction([
              prisma.miningSlot.update({
                where: { id: slot.id },
                data: {
                  isActive: false,
                  accruedEarnings: expectedEarnings
                }
              }),
              prisma.wallet.update({
                where: { id: USDWallet.id },
                data: {
                  balance: { increment: expectedEarnings }
                }
              }),
              prisma.user.update({
                where: { id: slot.userId },
                data: {
                  totalEarnings: { increment: expectedEarnings }
                }
              }),
              prisma.activityLog.create({
                data: {
                  userId: slot.userId,
                  type: ActivityLogType.CLAIM,
                  amount: expectedEarnings,
                  description: `Auto-claimed earnings from expired slot: ${expectedEarnings.toFixed(2)} USD`,
                  ipAddress: 'system'
                }
              })
            ]);

            // Send notification
            try {
              await sendInvestmentSlotCompletedNotification(slot.user.telegramId, slot.id, slot.principal, expectedEarnings);
            } catch (notificationError) {
              console.error('Failed to send notification:', notificationError);
            }
          }
        } catch (error) {
          console.error(`Error processing expired slot ${slot.id}:`, error);
        }
      }

      console.log(`Processed ${expiredSlots.length} expired slots`);
    } catch (error) {
      console.error('Error processing expired slots:', error);
    }
  }
}

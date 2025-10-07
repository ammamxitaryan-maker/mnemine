import { Router } from 'express';
import prisma from '../prisma.js';
import { SLOT_WEEKLY_RATE } from '../constants.js';

const router = Router();

// Простой endpoint для входа через Telegram
router.post('/login', async (req, res) => {
  try {
    const { id, username, first_name, last_name } = req.body;

    if (!id) {
      console.log('[LOGIN] Missing user ID in request');
      return res.status(400).json({ 
        success: false, 
        message: "Нет user.id" 
      });
    }

    // В продакшене проверяем, что это не testuser
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && (String(id) === '123456789' || username === 'testuser')) {
      console.log('[LOGIN] Rejecting test user in production:', { id, username });
      return res.status(403).json({ 
        success: false, 
        message: "Test users not allowed in production" 
      });
    }

    // Reduced logging for production

    // Ищем пользователя в базе данных
    let user = await prisma.user.findUnique({
      where: { telegramId: String(id) },
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

    if (!user) {
      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          telegramId: String(id),
          username: username || null,
          firstName: first_name || null,
          lastName: last_name || null,
          referralCode: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          wallets: {
            create: [
              { currency: 'USD', balance: 0 }, // USD кошелек с 0 балансом
              { currency: 'MNE', balance: 3.0 } // MNE кошелек с 3 токенами приветственного бонуса
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
      // User created successfully
    } else {
      // Обновляем данные существующего пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: username || user.username,
          firstName: first_name || user.firstName,
          lastName: last_name || user.lastName,
          lastSeenAt: new Date()
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
      // User updated successfully
    }

    const responseData = {
      success: true,
      telegramId: id,
      username: username || null,
      user: user
    };

    // Response sent successfully

    res.json(responseData);

  } catch (error) {
    console.error('[LOGIN] Error:', error);
    const errorResponse = {
      success: false,
      message: 'Internal server error'
    };
    console.log('[LOGIN] Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

export default router;


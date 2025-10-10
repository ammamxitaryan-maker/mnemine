import prisma from '../prisma.js';

/**
 * Скрипт для полного сброса базы данных
 * Удаляет все данные пользователей, слотов, транзакций и т.д.
 */
async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Удаляем данные в правильном порядке (с учетом внешних ключей)
    console.log('🗑️  Deleting user-related data...');

    // Удаляем аккаунты заморозки
    await prisma.accountFreeze.deleteMany({});
    console.log('✅ Account freezes deleted');

    // Удаляем инвестиции
    await prisma.investment.deleteMany({});
    console.log('✅ Investments deleted');

    // Удаляем выводы средств
    await prisma.withdrawal.deleteMany({});
    console.log('✅ Withdrawals deleted');

    // Удаляем реферальные доходы
    await prisma.referralEarning.deleteMany({});
    console.log('✅ Referral earnings deleted');

    // Удаляем уведомления
    await prisma.notification.deleteMany({});
    console.log('✅ Notifications deleted');

    // Удаляем кошельки
    await prisma.wallet.deleteMany({});
    console.log('✅ Wallets deleted');

    // Удаляем слоты майнинга
    await prisma.miningSlot.deleteMany({});
    console.log('✅ Mining slots deleted');

    // Удаляем завершенные задачи
    await prisma.completedTask.deleteMany({});
    console.log('✅ Completed tasks deleted');

    // Удаляем логи активности
    await prisma.activityLog.deleteMany({});
    console.log('✅ Activity logs deleted');

    // Удаляем лотерейные билеты
    await prisma.lotteryTicket.deleteMany({});
    console.log('✅ Lottery tickets deleted');

    // Удаляем своп транзакции
    await prisma.swapTransaction.deleteMany({});
    console.log('✅ Swap transactions deleted');

    // Удаляем пользователей (последними, так как они связаны с другими таблицами)
    await prisma.user.deleteMany({});
    console.log('✅ Users deleted');

    // Удаляем задачи (если они существуют)
    await prisma.task.deleteMany({});
    console.log('✅ Tasks deleted');

    // Удаляем курсы обмена
    await prisma.exchangeRate.deleteMany({});
    console.log('✅ Exchange rates deleted');

    // Сбрасываем последовательности автоинкремента (для PostgreSQL)
    try {
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "AccountFreeze_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "ActivityLog_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "CompletedTask_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Investment_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "LotteryTicket_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "MiningSlot_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Notification_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "ReferralEarning_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "SwapTransaction_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Task_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Wallet_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "Withdrawal_id_seq" RESTART WITH 1;`;
      await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "ExchangeRate_id_seq" RESTART WITH 1;`;
      console.log('✅ Auto-increment sequences reset');
    } catch (error) {
      console.log('⚠️  Could not reset sequences (may not exist):', error);
    }

    console.log('🎉 Database reset completed successfully!');
    console.log('📊 All user data has been cleared');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Создаем админ-пользователя после сброса базы данных
async function createDefaultAdmin() {
  try {
    console.log('👑 Creating default admin user...');

    // Генерируем уникальный реферальный код
    const generateReferralCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    let referralCode = generateReferralCode();
    let existingUser = await prisma.user.findUnique({ where: { referralCode } });

    // Убеждаемся, что код уникальный
    while (existingUser) {
      referralCode = generateReferralCode();
      existingUser = await prisma.user.findUnique({ where: { referralCode } });
    }

    // Создаем админ-пользователя
    const adminUser = await prisma.user.create({
      data: {
        telegramId: '6760298907', // Ваш админ ID
        firstName: 'Admin',
        username: 'admin_dev',
        role: 'ADMIN',
        referralCode: referralCode,
        captchaValidated: true,
        isSuspicious: false,
        lastSeenAt: new Date(),
        wallets: {
          create: {
            currency: 'USD',
            balance: 50000 // Стартовый баланс для админа
          }
        },
        miningSlots: {
          create: {
            principal: 1.00,
            startAt: new Date(),
            lastAccruedAt: new Date(),
            effectiveWeeklyRate: 0.3, // 30% в неделю
            expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 год
            isActive: true,
          }
        }
      }
    });

    console.log(`✅ Admin user created with ID: ${adminUser.id}`);
    console.log(`🔗 Referral code: ${referralCode}`);

    // Создаем курс обмена по умолчанию
    await prisma.exchangeRate.create({
      data: {
        rate: 1.0,
        isActive: true,
        createdBy: 'system'
      }
    });
    console.log('✅ Default exchange rate created');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Основная функция
async function main() {
  try {
    await resetDatabase();
    await createDefaultAdmin();
    console.log('🚀 Database setup completed!');
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }
}

// Запускаем только если файл вызывается напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { resetDatabase, createDefaultAdmin };

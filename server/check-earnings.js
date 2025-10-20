import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEarnings() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: {
        wallets: true,
        miningSlots: true,
        activityLogs: {
          where: { type: 'CLAIM' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (user) {
      console.log('User earnings:');
      console.log('Mining Slots:', user.miningSlots.length);
      user.miningSlots.forEach(slot => {
        console.log(`  Slot: ${slot.principal} NON, Earnings: ${slot.accruedEarnings}, Active: ${slot.isActive}`);
      });

      console.log('Recent CLAIM logs:');
      user.activityLogs.forEach(log => {
        console.log(`  ${log.createdAt}: ${log.amount} NON - ${log.description}`);
      });

      console.log('All recent activity logs:');
      const allLogs = await prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      allLogs.forEach(log => {
        console.log(`  ${log.createdAt}: ${log.type} - ${log.amount} - ${log.description}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEarnings();

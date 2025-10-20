import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllLogs() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: {
        wallets: true
      }
    });

    if (user) {
      console.log('User wallets:');
      user.wallets.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.balance}`);
      });

      console.log('\nAll activity logs for this user:');
      const allLogs = await prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      allLogs.forEach(log => {
        console.log(`  ${log.createdAt}: ${log.type} - ${log.amount} - ${log.description}`);
      });

      console.log('\nChecking for any balance-related logs...');
      const balanceLogs = await prisma.activityLog.findMany({
        where: {
          userId: user.id,
          OR: [
            { type: 'ADMIN_ACTION' },
            { type: 'CLAIM' },
            { type: 'WELCOME_BONUS' },
            { type: 'SWAP_USD_TO_MNE' },
            { type: 'SWAP_MNE_TO_USD' }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('Balance-related logs:');
      balanceLogs.forEach(log => {
        console.log(`  ${log.createdAt}: ${log.type} - ${log.amount} - ${log.description}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllLogs();

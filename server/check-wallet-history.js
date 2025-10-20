import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkWalletHistory() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: {
        wallets: true
      }
    });

    if (user) {
      console.log('Current user wallets:');
      user.wallets.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.balance}`);
      });

      // Check if there are any wallet updates in the database
      console.log('\nChecking for wallet updates...');

      // Check if there are any transactions that could affect NON balance
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          currency: 'NON'
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      console.log('NON transactions:');
      transactions.forEach(tx => {
        console.log(`  ${tx.createdAt}: ${tx.type} - ${tx.amount} - ${tx.description}`);
      });

      // Check activity logs for balance changes
      const balanceLogs = await prisma.activityLog.findMany({
        where: {
          userId: user.id,
          amount: { not: 0 }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      console.log('\nBalance-related activity logs:');
      balanceLogs.forEach(log => {
        console.log(`  ${log.createdAt}: ${log.type} - ${log.amount} - ${log.description}`);
      });

      // Check if there are any wallet balance changes in the database
      console.log('\nChecking for any wallet balance changes...');

      // Get the NON wallet
      const nonWallet = user.wallets.find(w => w.currency === 'NON');
      if (nonWallet) {
        console.log(`NON wallet ID: ${nonWallet.id}`);
        console.log(`NON wallet balance: ${nonWallet.balance}`);
        console.log(`NON wallet created at: ${nonWallet.createdAt}`);
        console.log(`NON wallet updated at: ${nonWallet.updatedAt}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWalletHistory();

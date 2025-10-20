const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserBalances() {
  console.log('\n=== Updating user NON balances to 3.0 ===');

  try {
    // Get all users with NON wallets
    const users = await prisma.user.findMany({
      include: {
        wallets: {
          where: {
            currency: 'NON'
          }
        }
      }
    });

    console.log(`Found ${users.length} users with NON wallets`);

    for (const user of users) {
      const nonWallet = user.wallets.find(w => w.currency === 'NON');

      if (nonWallet) {
        console.log(`\n👤 User: ${user.firstName} (${user.telegramId})`);
        console.log(`   Current NON balance: ${nonWallet.balance}`);

        // Update balance to 3.0
        await prisma.wallet.update({
          where: { id: nonWallet.id },
          data: { balance: 3.0 }
        });

        console.log(`   ✅ Updated to: 3.0 NON`);
      }
    }

    console.log('\n🎉 All user balances updated successfully!');

  } catch (error) {
    console.error('❌ Error updating balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserBalances();

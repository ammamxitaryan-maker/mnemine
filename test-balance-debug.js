const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserBalance(telegramId) {
  console.log(`\n=== Debugging balance for user ${telegramId} ===`);

  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallets: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName
    });

    // 2. Check wallets
    console.log('\n📊 Wallets:');
    user.wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // 3. Check NON wallet specifically
    const nonWallet = user.wallets.find(w => w.currency === 'NON');
    if (!nonWallet) {
      console.log('❌ NON wallet not found!');

      // Create NON wallet
      console.log('🔧 Creating NON wallet...');
      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          currency: 'NON',
          balance: 3.0
        }
      });
      console.log('✅ NON wallet created:', newWallet);
    } else {
      console.log('✅ NON wallet found:', {
        id: nonWallet.id,
        balance: nonWallet.balance
      });
    }

    // 4. Test calculateAvailableBalance function
    const { calculateAvailableBalance } = require('./server/src/utils/balanceUtils.js');
    const availableBalance = calculateAvailableBalance(user.wallets);
    console.log('\n💰 Available balance calculation:', availableBalance);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function listUsers() {
  console.log('\n=== Listing all users ===');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        wallets: {
          select: {
            currency: true,
            balance: true
          }
        }
      },
      take: 5
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} (${user.telegramId})`);
      user.wallets.forEach(wallet => {
        console.log(`   ${wallet.currency}: ${wallet.balance}`);
      });
    });

    if (users.length > 0) {
      console.log(`\n🔍 Testing with first user: ${users[0].telegramId}`);
      await debugUserBalance(users[0].telegramId);
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// List users and test with first one
listUsers();
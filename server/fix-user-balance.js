import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixUserBalance() {
  try {
    console.log('=== Fixing user balance ===');

    // Find user
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: { wallets: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.telegramId);
    console.log('📊 Current wallets:');
    user.wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // Find NON wallet
    const nonWallet = user.wallets.find(w => w.currency === 'NON');
    if (!nonWallet) {
      console.log('❌ NON wallet not found');
      return;
    }

    console.log(`\n🔧 Current NON balance: ${nonWallet.balance}`);
    console.log('🎯 Setting balance to 3 NON...');

    // Update balance to 3 NON
    await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { id: nonWallet.id },
        data: { balance: 3.0 }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: 'ADMIN_ACTION',
          amount: 3.0 - nonWallet.balance,
          description: `Admin balance fix: Set balance to 3.0 NON (was ${nonWallet.balance})`
        }
      });
    });

    console.log('✅ Balance updated successfully!');

    // Verify the update
    const updatedUser = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: { wallets: true }
    });

    console.log('\n📊 Updated wallets:');
    updatedUser.wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // Test API call
    console.log('\n🌐 Testing API call...');
    const response = await fetch('http://localhost:10112/api/user/6760298907/data');
    const data = await response.json();

    console.log('📡 API Response:');
    console.log('  balance:', data.balance);
    console.log('  availableBalance:', data.availableBalance);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserBalance();

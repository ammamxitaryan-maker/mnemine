import { PrismaClient } from '@prisma/client';
import { CacheService } from './src/services/cacheService.js';

const prisma = new PrismaClient();

async function clearCacheAndCheck() {
  try {
    console.log('=== Clearing cache and checking user balance ===');

    // Clear all caches
    CacheService.userData.clear();
    CacheService.slotsData.clear();
    CacheService.marketData.clear();

    console.log('✅ All caches cleared');

    // Check user in database
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: { wallets: true }
    });

    if (user) {
      console.log('📊 User in database:');
      console.log('  ID:', user.id);
      console.log('  Telegram ID:', user.telegramId);
      console.log('  Username:', user.username);
      console.log('  Created At:', user.createdAt);
      console.log('  Wallets:');
      user.wallets.forEach(wallet => {
        console.log(`    ${wallet.currency}: ${wallet.balance}`);
      });

      // Test API call
      console.log('\n🌐 Testing API call...');
      const response = await fetch('http://localhost:10112/api/user/6760298907/data');
      const data = await response.json();

      console.log('📡 API Response:');
      console.log('  balance:', data.balance);
      console.log('  availableBalance:', data.availableBalance);
      console.log('  miningPower:', data.miningPower);
      console.log('  accruedEarnings:', data.accruedEarnings);
      console.log('  totalInvested:', data.totalInvested);

    } else {
      console.log('❌ User not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCacheAndCheck();

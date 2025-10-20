import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function forceClearCache() {
  try {
    console.log('=== Force clearing cache and testing ===');

    // Clear cache by making a request with bypassCache parameter
    console.log('🧹 Clearing cache...');
    const clearResponse = await fetch('http://localhost:10112/api/user/6760298907/data?bypassCache=true');
    const clearData = await clearResponse.json();

    console.log('📡 Cache bypass response:');
    console.log('  balance:', clearData.balance);
    console.log('  nonBalance:', clearData.nonBalance);

    // Test normal request
    console.log('\n🔄 Testing normal request...');
    const normalResponse = await fetch('http://localhost:10112/api/user/6760298907/data');
    const normalData = await normalResponse.json();

    console.log('📡 Normal response:');
    console.log('  balance:', normalData.balance);
    console.log('  nonBalance:', normalData.nonBalance);

    // Check database directly
    console.log('\n🗄️ Checking database directly...');
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: { wallets: true }
    });

    if (user) {
      const nonWallet = user.wallets.find(w => w.currency === 'NON');
      console.log('  Database NON balance:', nonWallet?.balance);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceClearCache();

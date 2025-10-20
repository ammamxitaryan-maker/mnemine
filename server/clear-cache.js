import { CacheService } from './src/services/cacheService.js';

async function clearCache() {
  try {
    console.log('Clearing all caches...');

    // Clear all caches
    CacheService.userData.clear();
    CacheService.slotsData.clear();
    CacheService.marketData.clear();

    console.log('✅ All caches cleared');

    // Test API call after cache clear
    console.log('\nTesting API call after cache clear...');
    const response = await fetch('http://localhost:10112/api/user/6760298907/data');
    const data = await response.json();

    console.log('API Response:');
    console.log('  balance:', data.balance);
    console.log('  availableBalance:', data.availableBalance);
    console.log('  miningPower:', data.miningPower);
    console.log('  accruedEarnings:', data.accruedEarnings);
    console.log('  totalInvested:', data.totalInvested);

  } catch (error) {
    console.error('Error:', error);
  }
}

clearCache();

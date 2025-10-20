const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeExtraWallets() {
  console.log('\n=== Removing all wallets except NON ===');
  
  try {
    // Get all users with their wallets
    const users = await prisma.user.findMany({
      include: {
        wallets: true
      }
    });

    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log(`\n👤 User: ${user.firstName} (${user.telegramId})`);
      
      // Check current wallets
      console.log('   Current wallets:');
      user.wallets.forEach(wallet => {
        console.log(`     ${wallet.currency}: ${wallet.balance}`);
      });

      // Find NON wallet
      const nonWallet = user.wallets.find(w => w.currency === 'NON');
      
      if (nonWallet) {
        console.log(`   ✅ NON wallet found: ${nonWallet.balance} NON`);
        
        // Delete all other wallets
        const walletsToDelete = user.wallets.filter(w => w.currency !== 'NON');
        
        if (walletsToDelete.length > 0) {
          console.log(`   🗑️  Deleting ${walletsToDelete.length} extra wallets:`, 
            walletsToDelete.map(w => w.currency).join(', '));
          
          await prisma.wallet.deleteMany({
            where: {
              id: { in: walletsToDelete.map(w => w.id) }
            }
          });
          
          console.log(`   ✅ Deleted extra wallets`);
        } else {
          console.log(`   ✅ Only NON wallet exists, nothing to delete`);
        }
      } else {
        console.log(`   ❌ NON wallet not found! Creating one...`);
        
        // Create NON wallet with 3.0 balance
        const newWallet = await prisma.wallet.create({
          data: {
            userId: user.id,
            currency: 'NON',
            balance: 3.0
          }
        });
        
        console.log(`   ✅ Created NON wallet: ${newWallet.balance} NON`);
        
        // Delete all other wallets
        if (user.wallets.length > 0) {
          await prisma.wallet.deleteMany({
            where: {
              userId: user.id,
              currency: { not: 'NON' }
            }
          });
          
          console.log(`   ✅ Deleted all other wallets`);
        }
      }
    }

    console.log('\n🎉 All extra wallets removed successfully!');
    console.log('📊 Final state: Each user has only one NON wallet with 3.0 balance');

  } catch (error) {
    console.error('❌ Error removing wallets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeExtraWallets();

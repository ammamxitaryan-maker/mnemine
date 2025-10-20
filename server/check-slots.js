import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSlots() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: {
        wallets: true,
        miningSlots: true
      }
    });

    if (user) {
      console.log('User mining slots:');
      console.log('Total slots:', user.miningSlots.length);

      user.miningSlots.forEach((slot, index) => {
        console.log(`  Slot ${index + 1}:`);
        console.log(`    ID: ${slot.id}`);
        console.log(`    Principal: ${slot.principal}`);
        console.log(`    Accrued Earnings: ${slot.accruedEarnings}`);
        console.log(`    Is Active: ${slot.isActive}`);
        console.log(`    Start At: ${slot.startAt}`);
        console.log(`    Expires At: ${slot.expiresAt}`);
        console.log(`    Last Accrued At: ${slot.lastAccruedAt}`);
        console.log(`    Effective Weekly Rate: ${slot.effectiveWeeklyRate}`);
        console.log('---');
      });

      console.log('User wallets:');
      user.wallets.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.balance}`);
      });

      // Check if there are any slots that could be affecting balance
      const activeSlots = user.miningSlots.filter(slot => slot.isActive);
      console.log(`\nActive slots: ${activeSlots.length}`);

      if (activeSlots.length > 0) {
        console.log('Active slots details:');
        activeSlots.forEach((slot, index) => {
          console.log(`  Active Slot ${index + 1}:`);
          console.log(`    Principal: ${slot.principal}`);
          console.log(`    Accrued Earnings: ${slot.accruedEarnings}`);
          console.log(`    Start At: ${slot.startAt}`);
          console.log(`    Last Accrued At: ${slot.lastAccruedAt}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();

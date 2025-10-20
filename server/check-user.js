import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: '6760298907' },
      include: { wallets: true }
    });

    if (user) {
      console.log('User found:');
      console.log('ID:', user.id);
      console.log('Telegram ID:', user.telegramId);
      console.log('Username:', user.username);
      console.log('First Name:', user.firstName);
      console.log('Created At:', user.createdAt);
      console.log('Wallets:');
      user.wallets.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.balance}`);
      });
    } else {
      console.log('User not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

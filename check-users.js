const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    const totalUsers = await prisma.user.count();
    console.log('Total users in database:', totalUsers);

    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        telegramId: true,
        createdAt: true,
        lastActivityAt: true,
        isActive: true
      }
    });

    console.log('Sample users:', users);

    // Check online users (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineUsers = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: fifteenMinutesAgo
        }
      }
    });

    console.log('Online users (last 15 minutes):', onlineUsers);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

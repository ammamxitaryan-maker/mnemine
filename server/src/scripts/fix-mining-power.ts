// Скрипт для исправления mining power в базе данных
import prisma from '../prisma.js';
import { SLOT_WEEKLY_RATE } from '../constants.js';

async function fixMiningPower() {
  console.log('🔧 Исправление mining power в базе данных...');
  
  try {
    // Найти все слоты с неправильной ставкой (не 30%)
    const slotsWithWrongRate = await prisma.miningSlot.findMany({
      where: {
        effectiveWeeklyRate: {
          not: SLOT_WEEKLY_RATE // 0.3
        }
      },
      include: {
        user: {
          select: {
            telegramId: true,
            firstName: true
          }
        }
      }
    });

    console.log(`📊 Найдено ${slotsWithWrongRate.length} слотов с неправильной ставкой:`);
    
    for (const slot of slotsWithWrongRate) {
      console.log(`- Слот ${slot.id}: ${(slot.effectiveWeeklyRate * 100).toFixed(1)}% → 30% (Пользователь: ${slot.user.telegramId})`);
    }

    if (slotsWithWrongRate.length > 0) {
      // Обновить все слоты с неправильной ставкой
      const updateResult = await prisma.miningSlot.updateMany({
        where: {
          effectiveWeeklyRate: {
            not: SLOT_WEEKLY_RATE
          }
        },
        data: {
          effectiveWeeklyRate: SLOT_WEEKLY_RATE
        }
      });

      console.log(`✅ Обновлено ${updateResult.count} слотов до 30% ставки`);
    } else {
      console.log('✅ Все слоты уже имеют правильную ставку 30%');
    }

    // Проверить общую статистику
    const totalSlots = await prisma.miningSlot.count();
    const slotsWithCorrectRate = await prisma.miningSlot.count({
      where: {
        effectiveWeeklyRate: SLOT_WEEKLY_RATE
      }
    });

    console.log(`📈 Статистика:`);
    console.log(`- Всего слотов: ${totalSlots}`);
    console.log(`- С правильной ставкой (30%): ${slotsWithCorrectRate}`);
    console.log(`- С неправильной ставкой: ${totalSlots - slotsWithCorrectRate}`);

  } catch (error) {
    console.error('❌ Ошибка при исправлении mining power:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запустить скрипт
fixMiningPower();

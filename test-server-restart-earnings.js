// Тест системы восстановления доходов при перезапуске сервера
const { earningsAccumulator } = require('./server/dist/services/earningsAccumulator.js');

async function testEarningsRecovery() {
  console.log('🧪 Тестирование системы восстановления доходов...\n');

  try {
    // Тестируем получение информации о восстановленных доходах
    const testTelegramId = '123456789'; // Замените на реальный ID пользователя

    console.log('📊 Получение информации о восстановленных доходах...');
    const recoveryInfo = await earningsAccumulator.getRecoveryInfo(testTelegramId);

    console.log('Результат:', {
      hasRecoveredEarnings: recoveryInfo.hasRecoveredEarnings,
      totalRecovered: recoveryInfo.totalRecovered,
      recoveryDetails: recoveryInfo.recoveryDetails
    });

    if (recoveryInfo.hasRecoveredEarnings) {
      console.log('\n✅ Найдены восстановленные доходы!');
      console.log(`💰 Общая сумма: ${recoveryInfo.totalRecovered.toFixed(8)} NON`);

      recoveryInfo.recoveryDetails.forEach((detail, index) => {
        console.log(`\n📈 Слот ${index + 1}:`);
        console.log(`   ID: ${detail.slotId}`);
        console.log(`   Восстановлено: ${detail.recoveredAmount.toFixed(8)} NON`);
        console.log(`   Время простоя: ${detail.downtimeHours.toFixed(2)} часов`);
        console.log(`   Последнее обновление: ${detail.lastAccruedAt.toLocaleString()}`);
      });
    } else {
      console.log('\n📊 Восстановленные доходы не найдены (сервер работал стабильно)');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запускаем тест
testEarningsRecovery().then(() => {
  console.log('\n🏁 Тест завершен');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});

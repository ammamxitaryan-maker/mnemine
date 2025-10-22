#!/usr/bin/env node

/**
 * Тест фиктивных данных
 * Проверяет, что API всегда возвращает только фиктивные данные
 */

async function testFakeDataOnly() {
  console.log('🎭 Тестирование фиктивных данных...\n');

  try {
    // Test enhanced stats endpoint
    console.log('1. Тестирование /api/stats/enhanced...');
    const enhancedResponse = await fetch('http://localhost:10112/api/stats/enhanced');

    if (enhancedResponse.ok) {
      const enhancedData = await enhancedResponse.json();
      console.log('✅ Enhanced stats API работает');
      console.log(`   - Всего пользователей: ${enhancedData.data.totalUsers}`);
      console.log(`   - Онлайн: ${enhancedData.data.onlineUsers}`);
      console.log(`   - Реальные данные: ${enhancedData.data.isRealData ? 'Да' : 'Нет'}`);
      console.log(`   - Источник: ${enhancedData.data.dataSource}`);

      if (enhancedData.data.isRealData) {
        console.log('❌ ОШИБКА: Enhanced stats показывает реальные данные!');
      } else {
        console.log('✅ Enhanced stats показывает фиктивные данные');
      }
    } else {
      console.log('❌ Enhanced stats API не работает');
    }

    console.log('');

    // Test fake stats endpoint
    console.log('2. Тестирование /api/stats/fake...');
    const fakeResponse = await fetch('http://localhost:10112/api/stats/fake');

    if (fakeResponse.ok) {
      const fakeData = await fakeResponse.json();
      console.log('✅ Fake stats API работает');
      console.log(`   - Всего пользователей: ${fakeData.data.totalUsers}`);
      console.log(`   - Онлайн: ${fakeData.data.onlineUsers}`);
      console.log(`   - Реальные данные: ${fakeData.data.isRealData ? 'Да' : 'Нет'}`);
      console.log(`   - Источник: ${fakeData.data.dataSource}`);

      if (fakeData.data.isRealData) {
        console.log('❌ ОШИБКА: Fake stats показывает реальные данные!');
      } else {
        console.log('✅ Fake stats показывает фиктивные данные');
      }
    } else {
      console.log('❌ Fake stats API не работает');
    }

    console.log('');

    // Test simple stats endpoint
    console.log('3. Тестирование /api/stats/simple...');
    const simpleResponse = await fetch('http://localhost:10112/api/stats/simple');

    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('✅ Simple stats API работает');
      console.log(`   - Всего пользователей: ${simpleData.data.totalUsers}`);
      console.log(`   - Онлайн: ${simpleData.data.onlineUsers}`);
      console.log(`   - Реальные данные: ${simpleData.data.isRealData ? 'Да' : 'Нет'}`);
      console.log(`   - Источник: ${simpleData.data.dataSource}`);

      if (simpleData.data.isRealData) {
        console.log('❌ ОШИБКА: Simple stats показывает реальные данные!');
      } else {
        console.log('✅ Simple stats показывает фиктивные данные');
      }
    } else {
      console.log('❌ Simple stats API не работает');
    }

    console.log('\n🎯 Результат:');
    console.log('Все эндпоинты должны показывать только фиктивные данные');
    console.log('isRealData должно быть false, dataSource должно быть "calculated"');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Run the test
testFakeDataOnly().catch(console.error);

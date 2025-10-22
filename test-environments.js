#!/usr/bin/env node

/**
 * Тест работы в разных режимах
 * Проверяет, что фиктивные данные работают в DEV и PRODUCTION
 */

async function testEnvironments() {
  console.log('🌍 Тестирование работы в разных режимах...\n');

  try {
    // Test in development mode
    console.log('1. Тестирование в режиме DEVELOPMENT...');
    const devResponse = await fetch('http://localhost:10112/api/stats/enhanced');

    if (devResponse.ok) {
      const devData = await devResponse.json();
      console.log('✅ DEV режим работает');
      console.log(`   - Режим: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - Реальные данные: ${devData.data.isRealData ? 'Да' : 'Нет'}`);
      console.log(`   - Источник: ${devData.data.dataSource}`);
      console.log(`   - Всего пользователей: ${devData.data.totalUsers}`);
    } else {
      console.log('❌ DEV режим не работает');
    }

    console.log('');

    // Test all stats endpoints
    console.log('2. Тестирование всех эндпоинтов статистики...');

    const endpoints = [
      { name: 'Enhanced Stats', url: '/api/stats/enhanced' },
      { name: 'Fake Stats', url: '/api/stats/fake' },
      { name: 'Simple Stats', url: '/api/stats/simple' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:10112${endpoint.url}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}:`);
          console.log(`   - Реальные данные: ${data.data.isRealData ? 'Да' : 'Нет'}`);
          console.log(`   - Источник: ${data.data.dataSource}`);

          if (data.data.isRealData) {
            console.log(`   ❌ ОШИБКА: ${endpoint.name} показывает реальные данные!`);
          } else {
            console.log(`   ✅ ${endpoint.name} показывает фиктивные данные`);
          }
        } else {
          console.log(`❌ ${endpoint.name} не работает (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} ошибка: ${error.message}`);
      }
      console.log('');
    }

    console.log('🎯 Результат:');
    console.log('Все эндпоинты должны показывать фиктивные данные в любом режиме');
    console.log('isRealData должно быть false, dataSource должно быть "calculated"');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Run the test
testEnvironments().catch(console.error);

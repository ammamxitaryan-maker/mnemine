const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://localhost:10112';
const FRONTEND_URL = 'http://localhost:5173';

// Генерируем случайный Telegram ID для нового пользователя
const generateRandomTelegramId = () => {
  return Math.floor(Math.random() * 900000000) + 100000000; // 9-значное число
};

// Создаем нового пользователя
async function createNewUser() {
  const telegramId = generateRandomTelegramId();
  console.log(`\n🆕 Создаем нового пользователя с Telegram ID: ${telegramId}`);

  try {
    // Получаем данные пользователя (это создаст пользователя автоматически)
    const response = await axios.get(`${BASE_URL}/api/user/${telegramId}/data`, {
      headers: {
        'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
          id: telegramId,
          telegramId: telegramId.toString(),
          first_name: 'Test',
          last_name: 'User',
          username: `testuser${telegramId}`,
          language_code: 'ru'
        }))}&auth_date=${Math.floor(Date.now() / 1000)}`
      }
    });

    console.log('✅ Пользователь создан успешно!');
    console.log('📊 Данные пользователя:', JSON.stringify(response.data, null, 2));

    return { telegramId, userData: response.data };
  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error.response?.data || error.message);
    throw error;
  }
}

// Получаем приветственные токены
async function claimWelcomeTokens(telegramId) {
  console.log(`\n🎁 Получаем приветственные токены для пользователя ${telegramId}`);

  try {
    // Получаем статус бонусов
    const bonusesResponse = await axios.get(`${BASE_URL}/api/user/${telegramId}/bonuses/summary`, {
      headers: {
        'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
          id: telegramId,
          telegramId: telegramId.toString(),
          first_name: 'Test',
          last_name: 'User',
          username: `testuser${telegramId}`,
          language_code: 'ru'
        }))}&auth_date=${Math.floor(Date.now() / 1000)}`
      }
    });

    console.log('📋 Статус бонусов:', JSON.stringify(bonusesResponse.data, null, 2));

    // Пытаемся получить приветственный бонус
    if (bonusesResponse.data.welcomeBonus?.available) {
      try {
        const claimResponse = await axios.post(`${BASE_URL}/api/user/${telegramId}/claim-leaderboard-bonus`, {}, {
          headers: {
            'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
              id: telegramId,
              telegramId: telegramId.toString(),
              first_name: 'Test',
              last_name: 'User',
              username: `testuser${telegramId}`,
              language_code: 'ru'
            }))}&auth_date=${Math.floor(Date.now() / 1000)}`
          }
        });
        console.log('🎉 Приветственный бонус получен!', claimResponse.data);
      } catch {
        console.log('ℹ️ Приветственный бонус недоступен или уже получен');
      }
    }

    // Получаем обновленные данные пользователя
    const updatedUserResponse = await axios.get(`${BASE_URL}/api/user/${telegramId}/data`, {
      headers: {
        'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
          id: telegramId,
          telegramId: telegramId.toString(),
          first_name: 'Test',
          last_name: 'User',
          username: `testuser${telegramId}`,
          language_code: 'ru'
        }))}&auth_date=${Math.floor(Date.now() / 1000)}`
      }
    });

    console.log('💰 Обновленный баланс:', updatedUserResponse.data.availableBalance);
    return updatedUserResponse.data;
  } catch (error) {
    console.error('❌ Ошибка получения бонусов:', error.response?.data || error.message);
    throw error;
  }
}

// Инвестируем в слот
async function investInSlot(telegramId, amount) {
  console.log(`\n💼 Инвестируем ${amount} NON в слот для пользователя ${telegramId}`);

  try {
    const response = await axios.post(`${BASE_URL}/api/user/${telegramId}/invest`, {
      amount: amount
    }, {
      headers: {
        'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
          id: telegramId,
          telegramId: telegramId.toString(),
          first_name: 'Test',
          last_name: 'User',
          username: `testuser${telegramId}`,
          language_code: 'ru'
        }))}&auth_date=${Math.floor(Date.now() / 1000)}`
      }
    });

    console.log('✅ Инвестиция успешна!', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка инвестирования:', error.response?.data || error.message);
    throw error;
  }
}

// Проверяем баланс после инвестирования
async function checkBalanceAfterInvestment(telegramId) {
  console.log(`\n🔍 Проверяем баланс после инвестирования для пользователя ${telegramId}`);

  try {
    const response = await axios.get(`${BASE_URL}/api/user/${telegramId}/data`, {
      headers: {
        'X-Telegram-Init-Data': `user=${encodeURIComponent(JSON.stringify({
          id: telegramId,
          telegramId: telegramId.toString(),
          first_name: 'Test',
          last_name: 'User',
          username: `testuser${telegramId}`,
          language_code: 'ru'
        }))}&auth_date=${Math.floor(Date.now() / 1000)}`
      }
    });

    console.log('💰 Финальный баланс:', response.data.availableBalance);
    console.log('📊 Полные данные пользователя:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка проверки баланса:', error.response?.data || error.message);
    throw error;
  }
}

// Основная функция тестирования
async function testNewUserInvestment() {
  console.log('🚀 Начинаем тестирование нового пользователя и инвестирования');
  console.log('='.repeat(60));

  try {
    // 1. Создаем нового пользователя
    const { telegramId, userData } = await createNewUser();
    const initialBalance = userData.availableBalance;
    console.log(`💰 Начальный баланс: ${initialBalance} NON`);

    // 2. Получаем приветственные токены
    const userDataAfterBonus = await claimWelcomeTokens(telegramId);
    const balanceAfterBonus = userDataAfterBonus.availableBalance;
    console.log(`💰 Баланс после бонусов: ${balanceAfterBonus} NON`);

    // 3. Инвестируем часть баланса
    const investmentAmount = Math.min(5, balanceAfterBonus * 0.5); // Инвестируем 50% или максимум 5 NON
    if (investmentAmount > 0) {
      await investInSlot(telegramId, investmentAmount);

      // 4. Проверяем баланс после инвестирования
      await checkBalanceAfterInvestment(telegramId);
    } else {
      console.log('⚠️ Недостаточно средств для инвестирования');
    }

    console.log('\n✅ Тестирование завершено успешно!');
    console.log(`🌐 Откройте браузер: ${FRONTEND_URL}`);
    console.log(`📱 Используйте Telegram ID: ${telegramId}`);

  } catch (error) {
    console.error('\n❌ Ошибка во время тестирования:', error.message);
  }
}

// Запускаем тест
testNewUserInvestment();

const axios = require('axios');

const API_BASE = 'http://localhost:10112/api';

async function testWithRealUser() {
  try {
    console.log('🧪 Тестирование с реальным пользователем...\n');

    // Попробуем найти пользователя с балансом
    console.log('1. Поиск пользователей с балансом...');

    // Сначала попробуем получить список пользователей через админ API
    try {
      const usersResponse = await axios.get(`${API_BASE}/admin/users?limit=5`);
      console.log('Найдено пользователей:', usersResponse.data.data.users.length);

      const usersWithBalance = usersResponse.data.data.users.filter(user => user.balance >= 3);
      console.log('Пользователи с балансом >= 3 NON:', usersWithBalance.length);

      if (usersWithBalance.length > 0) {
        const testUser = usersWithBalance[0];
        console.log(`Тестируем с пользователем: ${testUser.telegramId} (баланс: ${testUser.balance} NON)`);
        await testInvestmentFlow(testUser.telegramId);
      } else {
        console.log('Нет пользователей с достаточным балансом для тестирования');
        console.log('Попробуем создать тестового пользователя...');
        await createTestUser();
      }
    } catch (error) {
      console.log('Не удалось получить список пользователей (требуется авторизация)');
      console.log('Попробуем создать тестового пользователя...');
      await createTestUser();
    }

  } catch (error) {
    console.error('❌ Тест не удался:', error.response?.data || error.message);
  }
}

async function createTestUser() {
  try {
    console.log('\n2. Создание тестового пользователя...');

    // Попробуем создать пользователя через API регистрации
    const testUserData = {
      id: '999999999',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUserData);
      console.log('✅ Тестовый пользователь создан:', registerResponse.data);

      // Добавим баланс через админ API
      try {
        const addBalanceResponse = await axios.post(`${API_BASE}/admin/users/${registerResponse.data.user.id}/balance`, {
          action: 'add',
          amount: 10
        });
        console.log('✅ Баланс добавлен:', addBalanceResponse.data);

        await testInvestmentFlow(registerResponse.data.user.telegramId);
      } catch (balanceError) {
        console.log('Не удалось добавить баланс (требуется админ авторизация)');
        console.log('Попробуем тестировать с существующим балансом...');
        await testInvestmentFlow(registerResponse.data.user.telegramId);
      }
    } catch (registerError) {
      console.log('Не удалось создать пользователя:', registerError.response?.data?.error || registerError.message);
    }
  } catch (error) {
    console.error('Ошибка создания тестового пользователя:', error.message);
  }
}

async function testInvestmentFlow(telegramId) {
  try {
    console.log(`\n🧪 Тестирование инвестиций для пользователя ${telegramId}...`);

    console.log('1. Получение начальных данных...');
    const initialData = await axios.get(`${API_BASE}/user/${telegramId}/data?bypassCache=true`);
    console.log('Начальный баланс:', initialData.data.availableBalance);

    if (initialData.data.availableBalance < 3) {
      console.log('❌ Недостаточно средств для тестирования');
      console.log('Текущий баланс:', initialData.data.availableBalance);
      console.log('Нужно минимум 3 NON');
      return;
    }

    console.log('\n2. Создание инвестиционного слота...');
    const investmentResponse = await axios.post(`${API_BASE}/user/${telegramId}/invest`, {
      amount: 3
    });
    console.log('✅ Инвестиция создана:', investmentResponse.data);

    console.log('\n3. Проверка обновленного баланса...');
    const updatedData = await axios.get(`${API_BASE}/user/${telegramId}/data?bypassCache=true`);
    console.log('Обновленный баланс:', updatedData.data.availableBalance);

    const expectedBalance = initialData.data.availableBalance - 3;
    const actualBalance = updatedData.data.availableBalance;

    console.log('\n4. Проверка корректности обновления...');
    console.log('Ожидаемый баланс:', expectedBalance);
    console.log('Фактический баланс:', actualBalance);

    if (Math.abs(actualBalance - expectedBalance) < 0.001) {
      console.log('✅ БАЛАНС ОБНОВИЛСЯ КОРРЕКТНО!');
      console.log('✅ Проблема решена!');
    } else {
      console.log('❌ БАЛАНС НЕ ОБНОВИЛСЯ КОРРЕКТНО!');
      console.log('❌ Проблема НЕ решена!');
      console.log('Разница:', Math.abs(actualBalance - expectedBalance));
    }

    console.log('\n5. Проверка инвестиционных слотов...');
    const slotsResponse = await axios.get(`${API_BASE}/user/${telegramId}/myslots`);
    console.log('Активные слоты:', slotsResponse.data.slots.filter(s => s.status === 'active').length);
    console.log('Общая сумма инвестиций:', slotsResponse.data.slots.reduce((sum, slot) => sum + slot.principal, 0));

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

testWithRealUser();

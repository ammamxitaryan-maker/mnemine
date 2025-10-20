import { Router } from 'express';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename); // Unused variable removed

// Serve admin panel HTML for browser access
router.get('/', (req, res) => {
  // Check if user is accessing from browser (not Telegram WebApp)
  const userAgent = req.get('User-Agent') || '';
  const isTelegramWebApp = userAgent.includes('TelegramWebApp') ||
    userAgent.includes('Telegram') ||
    req.headers['x-telegram-init-data'];

  if (isTelegramWebApp) {
    // Show error message for Telegram users trying to access admin panel
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Доступ запрещен</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
              }
              .error-container {
                  background: white;
                  border-radius: 20px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  padding: 40px;
                  text-align: center;
                  max-width: 400px;
              }
              .error-icon {
                  font-size: 4rem;
                  margin-bottom: 20px;
              }
              .error-title {
                  font-size: 1.5rem;
                  font-weight: bold;
                  color: #e74c3c;
                  margin-bottom: 15px;
              }
              .error-message {
                  color: #666;
                  margin-bottom: 20px;
                  line-height: 1.5;
              }
              .back-btn {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  font-size: 16px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
              }
          </style>
      </head>
      <body>
          <div class="error-container">
              <div class="error-icon">🚫</div>
              <div class="error-title">Доступ запрещен</div>
              <div class="error-message">
                  Админ-панель доступна только через браузер.<br>
                  Для доступа к основному приложению используйте Telegram WebApp.
              </div>
              <a href="/" class="back-btn">Вернуться в приложение</a>
          </div>
      </body>
      </html>
    `);
  }

  // Serve admin login page for browser users
  const adminHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NONMINE Admin Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .admin-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
        }
        
        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .error {
            color: #e74c3c;
            margin-top: 10px;
            font-size: 14px;
        }
        
        .success {
            color: #27ae60;
            margin-top: 10px;
            font-size: 14px;
        }
        
        .admin-panel {
            display: none;
            text-align: left;
        }
        
        .admin-panel.active {
            display: block;
        }
        
        .admin-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .admin-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        
        .admin-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .action-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .action-card:hover {
            transform: translateY(-5px);
        }
        
        .action-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .action-title {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .action-desc {
            color: #666;
            font-size: 14px;
        }
        
        .logout-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div id="loginForm">
            <div class="logo">⚡ NONMINE</div>
            <div class="subtitle">Admin Panel</div>
            
            <form id="adminLoginForm">
                <div class="form-group">
                    <label for="adminPassword">Admin Password:</label>
                    <input type="password" id="adminPassword" name="password" required>
                </div>
                
                <button type="submit" class="login-btn" id="loginBtn">
                    Войти в админ-панель
                </button>
                
                <div id="errorMessage" class="error" style="display: none;"></div>
            </form>
        </div>
        
        <div id="adminPanel" class="admin-panel">
            <button class="logout-btn" onclick="logout()">Выйти</button>
            
            <div class="admin-header">
                <h1>⚡ NONMINE Admin Panel</h1>
                <p>Добро пожаловать в панель администратора</p>
            </div>
            
            <div class="admin-stats" id="adminStats">
                <!-- Stats will be loaded here -->
            </div>
            
            <div class="admin-actions">
                <div class="action-card" onclick="loadUsers()">
                    <div class="action-icon">👥</div>
                    <div class="action-title">Управление пользователями</div>
                    <div class="action-desc">Просмотр и управление пользователями</div>
                </div>
                
                <div class="action-card" onclick="loadTransactions()">
                    <div class="action-icon">💰</div>
                    <div class="action-title">Транзакции</div>
                    <div class="action-desc">Просмотр всех транзакций</div>
                </div>
                
                <div class="action-card" onclick="loadAnalytics()">
                    <div class="action-icon">📊</div>
                    <div class="action-title">Аналитика</div>
                    <div class="action-desc">Статистика и отчеты</div>
                </div>
                
                <div class="action-card" onclick="loadSettings()">
                    <div class="action-icon">⚙️</div>
                    <div class="action-title">Настройки</div>
                    <div class="action-desc">Системные настройки</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let adminToken = null;
        
        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            const loginBtn = document.getElementById('loginBtn');
            const errorMessage = document.getElementById('errorMessage');
            
            loginBtn.disabled = true;
            loginBtn.textContent = 'Проверка...';
            errorMessage.style.display = 'none';
            
            try {
                const response = await fetch('/api/admin/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    adminToken = data.token;
                    document.getElementById('loginForm').style.display = 'none';
                    document.getElementById('adminPanel').classList.add('active');
                    loadStats();
                } else {
                    errorMessage.textContent = data.error || 'Ошибка входа';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Ошибка соединения';
                errorMessage.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Войти в админ-панель';
            }
        });
        
        async function loadStats() {
            try {
                const response = await fetch('/api/admin/dashboard-stats', {
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.data;
                    document.getElementById('adminStats').innerHTML = \`
                        <div class="stat-card">
                            <div class="stat-number">\${stats.totalUsers || 0}</div>
                            <div class="stat-label">Всего пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.activeUsers || 0}</div>
                            <div class="stat-label">Активных пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">$\${stats.totalInvested || 0}</div>
                            <div class="stat-label">Общие инвестиции</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">$\${stats.totalEarnings || 0}</div>
                            <div class="stat-label">Общие выплаты</div>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        function loadUsers() {
            alert('Функция управления пользователями будет реализована');
        }
        
        function loadTransactions() {
            alert('Функция просмотра транзакций будет реализована');
        }
        
        function loadAnalytics() {
            alert('Функция аналитики будет реализована');
        }
        
        function loadSettings() {
            alert('Функция настроек будет реализована');
        }
        
        function logout() {
            adminToken = null;
            document.getElementById('adminPanel').classList.remove('active');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    </script>
</body>
</html>
  `;

  res.send(adminHtml);
});

export default router;

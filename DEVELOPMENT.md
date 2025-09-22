# 🚀 Development Mode

## Local Development without Telegram

The application now supports a development mode that allows you to work in the browser without needing to run the Telegram bot.

### 🎯 How to run in development mode:

1. **Start only the frontend:**
   ```bash
   cd client
   pnpm run dev
   ```

2. **Open your browser:** http://localhost:5173

3. **If the server is not running**, you will see a "Development Mode" message with a "Continue as Admin" button

4. **Click "Continue as Admin"** - the application will work with administrator privileges

5. **Access admin panel:** Navigate to http://localhost:5173/admin

### 🔧 Development mode features:

- **Mock user:** Admin User (ID: 6760298907)
- **ADMIN indicator:** Red "ADMIN" badge in the header
- **Administrator privileges:** Full access to all functions
- **Balance:** 10,000 CFM for testing
- **Rank:** Diamond
- **Admin panel access:** /admin
- **Automatic detection:** Works only on localhost in development mode
- **Fallback data:** All functions work with test data

### 📱 Full mode (with server):

If you want to run with full functionality:

```bash
# Terminal 1 - Backend
cd server
pnpm run dev

# Terminal 2 - Frontend  
cd client
pnpm run dev
```

### 🛠️ Development mode management:

- **Enable:** `localStorage.setItem('dev_mode', 'true')`
- **Disable:** `localStorage.removeItem('dev_mode')`
- **Reload the page** to apply changes

### ⚠️ Important:

- Development mode works only on `localhost` and `127.0.0.1`
- In production, all authentication checks remain strict
- Mock data is not saved to the database
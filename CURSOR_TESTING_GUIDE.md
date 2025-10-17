# 🚀 Cursor Testing Guide - FastMine Application

## 📋 Quick Start

### 1. **One-Click Testing** (Recommended)
- Press `F5` or go to **Run and Debug** panel
- Select **🏃‍♂️ Quick Start (Auto)** from the dropdown
- This will automatically start both client and server

### 2. **Full Stack Debugging**
- Press `F5` or go to **Run and Debug** panel  
- Select **🎯 Debug Full Stack (Chrome + Server)** from the dropdown
- This opens Chrome with the app and debugs the server simultaneously

## 🛠️ Available Launch Configurations

### 🌐 **Quick Start Options**
- **🏃‍♂️ Quick Start (Auto)** - Starts everything automatically
- **🌐 Launch Full Stack (Auto)** - Server with auto client startup

### 🖥️ **Server Debugging**
- **🖥️ Debug Server (TypeScript)** - Debug server in TypeScript mode
- **🏗️ Debug Server (Built)** - Debug compiled server
- **🧪 Test Production Build** - Test production build locally
- **🔧 Debug with Database Setup** - Debug with automatic DB setup

### 🌐 **Client Testing**
- **🚀 Launch Chrome (Client)** - Opens Chrome with the app
- **🔗 Attach to Chrome (Client)** - Attach to existing Chrome instance

## 📝 Available Tasks (Ctrl+Shift+P → "Tasks: Run Task")

### 🔨 **Build Tasks**
- **Build All** - Builds both client and server
- **Build Client** - Builds only the frontend
- **Build Server** - Builds only the backend
- **Clean All** - Removes all build artifacts

### 🚀 **Development Tasks**
- **Start Full Stack Dev** - Starts both client and server in dev mode
- **Start Client Dev Server** - Starts only the frontend dev server
- **Start Server Dev** - Starts only the backend dev server

### 🗄️ **Database Tasks**
- **Database Setup** - Sets up the database schema
- **Generate Prisma Client** - Generates Prisma client

### 🔍 **Quality Tasks**
- **Lint Check** - Runs ESLint checks
- **Type Check** - Runs TypeScript type checking

## 🎯 Testing Workflow

### **For Frontend Development:**
1. Use **🚀 Launch Chrome (Client)** to test UI changes
2. Set breakpoints in `client/src/` files
3. Hot reload is enabled for instant feedback

### **For Backend Development:**
1. Use **🖥️ Debug Server (TypeScript)** for API development
2. Set breakpoints in `server/src/` files
3. Test API endpoints with the integrated terminal

### **For Full Stack Testing:**
1. Use **🎯 Debug Full Stack (Chrome + Server)** for complete testing
2. Debug both frontend and backend simultaneously
3. Test real-time features like WebSocket connections

### **For Production Testing:**
1. Use **🧪 Test Production Build** to test the production build locally
2. Ensures your code works in production environment
3. Tests with `NODE_ENV=production`

## 🔧 Environment Setup

The application uses the following environment configuration:
- **Database**: PostgreSQL (production database for testing)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:10112
- **WebSocket**: ws://localhost:10112/ws

## 🐛 Debugging Tips

### **Setting Breakpoints:**
- Click in the gutter next to line numbers
- Use conditional breakpoints for specific conditions
- Set logpoints for non-intrusive logging

### **Debug Console:**
- Use the Debug Console to evaluate expressions
- Inspect variables and call functions
- Test API calls directly

### **Call Stack:**
- Navigate through the call stack
- Inspect variables at each level
- Understand the execution flow

## 📱 Mobile Testing

Since this is a Telegram Web App:
- Use Chrome DevTools device emulation
- Test with mobile viewport sizes
- Use **🚀 Launch Chrome (Client)** with mobile emulation

## 🚨 Troubleshooting

### **If the app doesn't start:**
1. Check if ports 5173 and 10112 are available
2. Run **Database Setup** task first
3. Check the Debug Console for errors

### **If database connection fails:**
1. Verify `.env` file exists and has correct DATABASE_URL
2. Run **Generate Prisma Client** task
3. Check network connectivity to the database

### **If Chrome doesn't open:**
1. Make sure Chrome is installed
2. Try **🔗 Attach to Chrome (Client)** instead
3. Check if Chrome is running in debug mode

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Chrome opens with the app at http://localhost:5173
- ✅ Server starts without errors on port 10112
- ✅ Database connection is established
- ✅ No red errors in the Debug Console
- ✅ Breakpoints are hit when expected

## 📞 Quick Commands

- **F5** - Start debugging
- **Ctrl+Shift+F5** - Restart debugging
- **Shift+F5** - Stop debugging
- **Ctrl+Shift+P** - Command palette
- **Ctrl+`** - Toggle terminal

---

**Happy Testing! 🎯**

The application is now fully configured for testing directly in the Cursor interface. Use the launch configurations and tasks to efficiently develop and test your FastMine application.

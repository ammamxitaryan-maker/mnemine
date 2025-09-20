# 🚀 Render Single Service Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Project Structure ✅
- [x] Frontend build located in `server/public/`
- [x] Server build located in `server/dist/`
- [x] Express server configured to serve frontend from `server/public/`
- [x] SPA routing configured for all non-API routes
- [x] API routes properly configured under `/api/*`

### 2. Dockerfile ✅
- [x] Multi-stage build implemented
- [x] Frontend build copied to `server/public/`
- [x] Production image with non-root user
- [x] Dynamic port handling (uses Render's PORT)
- [x] Health check configured
- [x] Production dependencies only in final stage

### 3. Environment Variables ✅
- [x] All required variables configured in `render.yaml`
- [x] No localhost values for production
- [x] Security variables properly set
- [x] Database URL configured
- [x] Telegram bot token configured

### 4. Code Quality ✅
- [x] No TypeScript errors
- [x] No implicit `any` types
- [x] Proper path handling for frontend build
- [x] Express server correctly configured
- [x] WebSocket support enabled
- [x] Telegram bot integration working

### 5. Build Process ✅
- [x] Frontend builds successfully
- [x] Backend builds successfully
- [x] Frontend copied to `server/public/`
- [x] No build errors or warnings
- [x] Production-ready build artifacts

## 🎯 Deployment Steps

### 1. Create PostgreSQL Database
```bash
# In Render Dashboard:
# 1. Go to "New +" → "PostgreSQL"
# 2. Configure:
#    - Name: mnemine-db
#    - Database: mnemine
#    - User: mnemine_user
#    - Region: Same as your app
# 3. Note the External Database URL
```

### 2. Create Web Service
```bash
# In Render Dashboard:
# 1. Go to "New +" → "Web Service"
# 2. Connect your GitHub repository
# 3. Configure:
#    - Name: mnemine-app
#    - Environment: Docker
#    - Dockerfile Path: ./Dockerfile
#    - Docker Context: .
#    - Plan: Starter (or higher)
#    - Health Check Path: /health
```

### 3. Set Environment Variables
```bash
# Required Variables:
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
JWT_SECRET=your_32_character_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret
ADMIN_TELEGRAM_ID=your_telegram_user_id
BACKEND_URL=https://your-app-name.onrender.com
VITE_BACKEND_URL=https://your-app-name.onrender.com
VITE_WS_URL=wss://your-app-name.onrender.com/ws
ALLOWED_ORIGINS=https://your-app-name.onrender.com

# Optional Variables:
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5
LOG_LEVEL=info
```

### 4. Deploy
```bash
# 1. Click "Create Web Service"
# 2. Monitor build logs
# 3. Wait for deployment to complete
# 4. Test the application
```

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-app-name.onrender.com/health
# Expected: JSON response with status: "healthy"
```

### 2. Frontend
```bash
curl https://your-app-name.onrender.com/
# Expected: HTML response with React app
```

### 3. API Routes
```bash
curl https://your-app-name.onrender.com/api/health
# Expected: API response
```

### 4. WebSocket
```bash
# Test WebSocket connection at:
wss://your-app-name.onrender.com/ws
```

### 5. Telegram Bot
```bash
# Test bot functionality
# Send /start command to your bot
# Verify webhook is set correctly
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check environment variables are set
   - Verify DATABASE_URL format
   - Check Render build logs

2. **Frontend Not Loading**
   - Verify frontend build copied to server/public
   - Check Express static file serving
   - Review server logs

3. **API Routes Not Working**
   - Check API routes are under /api/
   - Verify CORS configuration
   - Check backend logs

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database is accessible from Render
   - Run Prisma migrations if needed

5. **Telegram Bot Issues**
   - Verify TELEGRAM_BOT_TOKEN is correct
   - Check webhook URL is HTTPS
   - Verify bot permissions

## 📊 Monitoring

- **Health Checks**: Automatic monitoring via `/health`
- **Logs**: Available in Render dashboard
- **Metrics**: CPU, memory, response times
- **Alerts**: Email notifications for issues

## 🔄 Updates

To update your application:
1. Push changes to your repository
2. Render automatically rebuilds and redeploys
3. Monitor deployment logs for issues

## ✅ Success Criteria

Your deployment is successful when:
- [x] Health check returns 200 OK
- [x] Frontend loads at root URL
- [x] API routes respond correctly
- [x] WebSocket connections work
- [x] Telegram bot responds
- [x] Database operations work
- [x] No 404 errors for frontend routes
- [x] No CORS errors
- [x] All environment variables loaded

---

## 🎉 Ready for Production!

Your application is now ready for production deployment on Render as a single Web Service! 🚀

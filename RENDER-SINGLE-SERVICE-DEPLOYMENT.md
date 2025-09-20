# Render Single Service Deployment Guide

This guide explains how to deploy the Mnemine application as a single Web Service on Render, combining both frontend and backend into one service.

## 🏗️ Architecture Overview

The application is now configured as a **single Web Service** that serves:
- **Backend API**: All routes under `/api/*`
- **Frontend**: All other routes (`/*`) serve the React application
- **WebSocket**: Real-time features via `/ws`
- **Health Check**: Available at `/health`

## 📁 Project Structure

```
├── server/
│   ├── dist/           # Server build output
│   ├── public/         # Frontend build (copied here during build)
│   │   ├── index.html
│   │   ├── js/
│   │   ├── css/
│   │   └── ...
│   ├── src/            # Backend source code
│   └── prisma/         # Database schema
├── src/                # Frontend source code
├── Dockerfile          # Multi-stage Docker build
├── render.yaml         # Render deployment configuration
└── package.json        # Build scripts
```

## 🚀 Deployment Steps

### 1. Prerequisites

- Render account
- PostgreSQL database (Render provides this)
- Telegram Bot Token
- Domain name (optional, Render provides free subdomain)

### 2. Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `mnemine-db`
   - **Database**: `mnemine`
   - **User**: `mnemine_user`
   - **Region**: Same as your app
4. Note the **External Database URL** for later use

### 3. Deploy Web Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

#### Basic Settings
- **Name**: `mnemine-app`
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.`
- **Plan**: `Starter` (or higher for production)

#### Build & Deploy
- **Build Command**: (leave empty - handled by Dockerfile)
- **Start Command**: (leave empty - handled by Dockerfile)
- **Health Check Path**: `/health`

### 4. Environment Variables

Set these environment variables in Render Dashboard:

#### Required Variables
```bash
# Application
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_ID=your_telegram_user_id

# Security (generate secure random strings)
JWT_SECRET=your_32_character_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret_here

# URLs (will be set automatically by Render)
BACKEND_URL=https://your-app-name.onrender.com
VITE_BACKEND_URL=https://your-app-name.onrender.com
VITE_WS_URL=wss://your-app-name.onrender.com/ws

# CORS
ALLOWED_ORIGINS=https://your-app-name.onrender.com
```

#### Optional Variables
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Logging
LOG_LEVEL=info
```

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Build the Docker image
   - Install dependencies
   - Build frontend and backend
   - Copy frontend to server/public
   - Start the service

## 🔧 Build Process

The Dockerfile uses a multi-stage build:

### Stage 1: Dependencies
- Installs pnpm and all dependencies

### Stage 2: Builder
- Builds frontend with Vite
- Builds backend with TypeScript
- Copies frontend build to server/public

### Stage 3: Production
- Creates optimized production image
- Installs only production dependencies
- Runs as non-root user
- Exposes port (automatically set by Render)

## 🌐 URL Structure

Once deployed, your app will be available at:
- **Main App**: `https://your-app-name.onrender.com/`
- **API**: `https://your-app-name.onrender.com/api/*`
- **Health Check**: `https://your-app-name.onrender.com/health`
- **WebSocket**: `wss://your-app-name.onrender.com/ws`

## 🔍 Verification

After deployment, verify:

1. **Health Check**: Visit `/health` - should return JSON with status
2. **Frontend**: Visit `/` - should load React app
3. **API**: Test API endpoints under `/api/`
4. **WebSocket**: Check WebSocket connection at `/ws`

## 🐛 Troubleshooting

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
   - Check API routes are under `/api/`
   - Verify CORS configuration
   - Check backend logs

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database is accessible from Render
   - Run Prisma migrations if needed

### Logs

Check Render service logs for debugging:
- Build logs: Show build process
- Runtime logs: Show application output
- Health check logs: Show health status

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **HTTPS**: Render provides HTTPS automatically
3. **CORS**: Configure ALLOWED_ORIGINS properly
4. **Rate Limiting**: Configure appropriate limits
5. **Database**: Use strong passwords and SSL

## 📈 Monitoring

Render provides:
- **Metrics**: CPU, memory, response times
- **Logs**: Application and system logs
- **Health Checks**: Automatic health monitoring
- **Alerts**: Email notifications for issues

## 🔄 Updates

To update your application:
1. Push changes to your repository
2. Render automatically rebuilds and redeploys
3. Monitor deployment logs for issues

## 💰 Cost Optimization

- **Starter Plan**: Good for development/testing
- **Standard Plan**: Recommended for production
- **Auto-sleep**: Starter plan sleeps after inactivity
- **Database**: Choose appropriate PostgreSQL plan

## 📞 Support

- **Render Documentation**: https://render.com/docs
- **Render Support**: Available in dashboard
- **Application Logs**: Check Render service logs
- **Health Checks**: Monitor `/health` endpoint

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Web service created with Docker
- [ ] All environment variables set
- [ ] Health check endpoint working
- [ ] Frontend loading correctly
- [ ] API endpoints responding
- [ ] WebSocket connection working
- [ ] Telegram bot configured
- [ ] CORS properly configured
- [ ] Security variables set

Your application is now ready for production! 🎉

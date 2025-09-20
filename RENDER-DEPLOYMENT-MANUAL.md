# Mnemine Render Deployment Manualgit 

## 🚀 Complete Deployment Guide for Mnemine on Render

This manual provides step-by-step instructions for deploying the Mnemine application to Render.com.

## 📋 Prerequisites

### Required Accounts
- [Render.com account](https://render.com) (Free tier available)
- [GitHub repository](https://github.com) with your code
- [Telegram Bot Token](https://core.telegram.org/bots#creating-a-new-bot) (for bot functionality)

### Required Environment Variables
You'll need to gather these values before deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | `1234567890:ABCdefGhIjKlMnOpQrStUvWxYz` |
| `ADMIN_TELEGRAM_ID` | Your Telegram user ID | `6760298907` |
| `JWT_SECRET` | 32+ character secret for JWT tokens | `your-super-secret-jwt-key-32-chars-min` |
| `ENCRYPTION_KEY` | 32 character encryption key | `your-32-char-encryption-key-here` |
| `SESSION_SECRET` | Session secret for cookies | `your-session-secret-here` |

## 🎯 Deployment Options

### Option 1: Single Service Deployment (Recommended)
Deploy both frontend and backend as a single web service.

### Option 2: Separate Services Deployment
Deploy frontend as static site and backend as web service.

## 📦 Option 1: Single Service Deployment

### Step 1: Prepare Your Repository
1. Ensure your code is pushed to GitHub
2. Make sure you're on the `main` branch
3. Verify the `render.yaml` file is in your repository root

### Step 2: Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your repository and click "Apply"

### Step 3: Configure Environment Variables
In the Render dashboard, add these environment variables:

#### Required Variables
```
NODE_ENV=production
PORT=10000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=your_telegram_user_id
JWT_SECRET=your_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret
```

#### Optional Variables
```
CORS_ORIGIN=https://your-app-name.onrender.com
FRONTEND_URL=https://your-app-name.onrender.com
ALLOWED_ORIGINS=https://your-app-name.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Step 4: Database Setup
1. In Render dashboard, create a new PostgreSQL database:
   - Name: `mnemine-db`
   - Plan: Starter (Free)
2. The database URL will be automatically provided via `DATABASE_URL` environment variable

### Step 5: Deploy
1. Click "Create Blueprint" to start deployment
2. Monitor the build logs for any errors
3. Once deployed, your app will be available at `https://your-app-name.onrender.com`

## 📦 Option 2: Separate Services Deployment

### Backend Service
1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install --frozen-lockfile && npx prisma generate && tsc && pnpm run postbuild`
   - **Start Command**: `node dist/index.js`
   - **Environment**: Node.js

### Frontend Service
1. Create a new Static Site in Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `pnpm install --frozen-lockfile && vite build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_BACKEND_URL=https://your-backend-service.onrender.com`
     - `VITE_WS_URL=wss://your-backend-service.onrender.com/ws`

### Database Service
1. Create a new PostgreSQL database
2. Name it `mnemine-db`
3. Use Starter plan for free tier

## 🔧 Post-Deployment Configuration

### 1. Database Migration
After deployment, run database migrations:
```bash
# This happens automatically via Prisma generate in build command
npx prisma db push
```

### 2. Telegram Bot Setup
1. Set your bot's webhook URL to: `https://your-backend.onrender.com/webhook`
2. Use your bot token from environment variables

### 3. Health Check
Verify your deployment is working:
- Backend health: `https://your-backend.onrender.com/health`
- Frontend: `https://your-frontend.onrender.com`

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
1. **TypeScript Errors**: Check `pnpm run type-check` locally
2. **Missing Dependencies**: Verify all dependencies are in `package.json`
3. **Prisma Issues**: Ensure `DATABASE_URL` is set correctly

#### Runtime Issues
1. **Database Connection**: Verify PostgreSQL database is created and `DATABASE_URL` is correct
2. **Environment Variables**: Check all required variables are set
3. **Port Issues**: Ensure `PORT` environment variable is set to `10000`

#### Frontend Issues
1. **API Connection**: Verify `VITE_BACKEND_URL` points to your backend service
2. **CORS Errors**: Check `CORS_ORIGIN` matches your frontend URL
3. **WebSocket Issues**: Ensure `VITE_WS_URL` uses `wss://` for production

### Debug Commands
```bash
# Check build locally
pnpm run build
pnpm run verify:deployment

# Test server locally
pnpm run start

# Check environment variables
echo $DATABASE_URL
echo $TELEGRAM_BOT_TOKEN
```

## 📊 Monitoring

### Render Dashboard
- Monitor service health in Render dashboard
- Check build logs for deployment issues
- View service metrics and uptime

### Application Logs
- Backend logs are available in Render service logs
- Use `LOG_LEVEL=debug` for detailed logging
- Monitor database connections and API calls

## 🔄 Updates and Maintenance

### Automatic Deployments
- Services auto-deploy when you push to `main` branch
- Monitor build status in Render dashboard
- Rollback if needed using Render's deployment history

### Manual Deployments
1. Push changes to GitHub
2. Trigger manual deployment in Render dashboard
3. Monitor build logs for issues

### Database Migrations
```bash
# Add new migrations to your Prisma schema
# Push to GitHub - migrations run automatically on deployment
```

## 💰 Cost Considerations

### Free Tier Limits
- **Web Services**: 750 hours/month
- **PostgreSQL**: 1GB storage, 1GB RAM
- **Static Sites**: Unlimited

### Paid Plans
- **Starter**: $7/month per service
- **Standard**: $25/month per service
- **Pro**: $85/month per service

## 🛡️ Security Best Practices

### Environment Variables
- Never commit secrets to Git
- Use Render's environment variable encryption
- Rotate secrets regularly

### Database Security
- Use strong database passwords
- Enable SSL connections (automatic on Render)
- Regular backups

### API Security
- Rate limiting is enabled by default
- CORS is configured for production
- Security headers via Helmet.js

## 📞 Support

### Render Support
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

### Application Support
- Check application logs in Render dashboard
- Verify environment variables
- Test endpoints manually

## 🎉 Success Checklist

- [ ] Repository connected to Render
- [ ] Environment variables configured
- [ ] Database created and connected
- [ ] Backend service deployed successfully
- [ ] Frontend accessible
- [ ] Health check passes
- [ ] Telegram bot configured
- [ ] Database migrations applied
- [ ] Monitoring set up

---

## 📝 Quick Start Commands

```bash
# Local development
pnpm install
pnpm run dev

# Build for production
pnpm run build
pnpm run verify:deployment

# Deploy to Render
# 1. Push to GitHub main branch
# 2. Render auto-deploys from render.yaml
```

**Happy Deploying! 🚀**

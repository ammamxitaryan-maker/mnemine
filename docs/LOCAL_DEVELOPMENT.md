# Local Development Setup

This guide will help you set up the Mnemine application for local development.

## Quick Start

1. **Run the setup script:**
   ```bash
   setup-local.bat
   ```

2. **Start the development server:**
   ```bash
   pnpm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:10112

## Environment Configuration

The application uses the following environment files:

- `env.local` - Local development template
- `env.example` - General template with your production values
- `env.production` - Production configuration

### Local Development Features

✅ **Fallback Authentication** - No Telegram required for local testing  
✅ **Test User Creation** - Automatic test user creation  
✅ **Mock Telegram Data** - Simulated Telegram WebApp data  
✅ **Relaxed Rate Limiting** - Higher limits for development  
✅ **Debug Logging** - Detailed logs for troubleshooting  

## Environment Variables

### Required for Local Development

```bash
# Database (using production database for testing)
DATABASE_URL="postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYvNlB2YtL@dpg-d38dq93e5dus73a34u3g-a/mnemine_zupy"

# Security Keys
JWT_SECRET="+j/7gDO4Fd/P7DPpLrCbm1YgW4GwDP+9cn3p8g7GpOo="
ENCRYPTION_KEY="zfKOacMk2xRvNhLQjHRmzF3j+ApmNvkQ3g8bBeScl0k="
SESSION_SECRET="WWJZPa9U1cIvLIi414eEpdx6TNLMNjAT6NhDF/vQAs0="

# Development Flags
LOCAL_DEV_MODE=true
ENABLE_FALLBACK_AUTH=true
NODE_ENV=development
```

### Frontend Configuration

```bash
# Backend URLs
VITE_BACKEND_URL=http://localhost:10112
VITE_WS_URL=ws://localhost:10112/ws

# App Information
VITE_APP_NAME=Mnemine
VITE_APP_VERSION=1.0.0
VITE_ADMIN_TELEGRAM_IDS="6760298907"
```

## Local Development Features

### 1. Fallback Authentication

The application automatically detects when running locally and provides fallback authentication:

- **No Telegram required** - Works in any browser
- **Test user creation** - Automatic test user setup
- **Mock Telegram data** - Simulated WebApp environment

### 2. Test Users

The application includes several test users for development:

- **Admin User** (ID: 6760298907) - Full admin access
- **Test User** (ID: 123456789) - Regular user
- **Custom Users** - Create your own test users

### 3. Development Tools

- **Local Dev Auth Component** - User switching interface
- **Debug Logging** - Detailed console output
- **Hot Reload** - Automatic code updates
- **WebSocket Support** - Real-time features

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if the production database is accessible
   - Verify DATABASE_URL is correct

2. **Authentication Issues**
   - Ensure LOCAL_DEV_MODE=true
   - Check browser console for errors
   - Try clearing localStorage

3. **Port Conflicts**
   - Backend runs on port 10112
   - Frontend runs on port 5173
   - Check if ports are available

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

This will show detailed logs for:
- Database queries
- Authentication flow
- WebSocket connections
- API requests

## Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| Authentication | Fallback + Telegram | Telegram only |
| Database | Production DB | Production DB |
| Rate Limiting | Relaxed | Strict |
| Logging | Debug | Error only |
| HTTPS | Not required | Required |
| Telegram Bot | Optional | Required |

## Next Steps

1. **Test the application** - Verify all features work
2. **Create test users** - Use the LocalDevAuth component
3. **Test admin features** - Use admin user (ID: 6760298907)
4. **Check WebSocket** - Verify real-time updates
5. **Test API endpoints** - Use the test-admin-api.js script

## Support

If you encounter issues:

1. Check the console logs
2. Verify environment variables
3. Ensure database connectivity
4. Try clearing browser cache
5. Restart the development server

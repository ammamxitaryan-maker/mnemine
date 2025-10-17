# NONMINE Deployment Guide

## Overview

This guide covers deploying the NONMINE application to production environments, including Render.com, Vercel, and Docker.

## Prerequisites

- Node.js 20+ and pnpm 8+
- PostgreSQL database
- Telegram Bot Token
- Domain name (optional)

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=10112

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
ENCRYPTION_KEY=your-super-secure-encryption-key-32chars
SESSION_SECRET=your-super-secure-session-secret-for-production

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=your_admin_telegram_id

# URLs
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
TELEGRAM_WEBHOOK_URL=https://your-backend-domain.com/api/webhook
```

### Optional Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Logging
LOG_LEVEL=warn
LOG_FILE_PATH=/app/server/logs/app.log

# Performance
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=16

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
ERROR_REPORTING_ENABLED=true
```

## Deployment Options

### 1. Render.com (Recommended)

#### Backend Deployment

1. **Connect Repository**
   - Go to [Render.com](https://render.com)
   - Connect your GitHub repository
   - Select "Web Service"

2. **Configure Build Settings**
   ```yaml
   Build Command: pnpm install --frozen-lockfile && pnpm run build:prod && pnpm run copy:frontend
   Start Command: cd server && node dist/index.js
   ```

3. **Environment Variables**
   - Add all required environment variables
   - Set `NODE_ENV=production`
   - Configure database URL

4. **Database Setup**
   - Create PostgreSQL database
   - Run migrations: `npx prisma migrate deploy`
   - Generate Prisma client: `npx prisma generate`

#### Frontend Deployment

1. **Static Site**
   - Connect repository to Render
   - Select "Static Site"
   - Build Command: `pnpm install --frozen-lockfile && pnpm run build:client`
   - Publish Directory: `client/dist`

2. **Environment Variables**
   ```bash
   VITE_BACKEND_URL=https://your-backend.onrender.com
   VITE_WS_URL=wss://your-backend.onrender.com/ws
   ```

### 2. Vercel (Frontend Only)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select "Next.js" framework

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "cd client && pnpm install --frozen-lockfile && pnpm run build",
     "outputDirectory": "client/dist",
     "installCommand": "pnpm install --frozen-lockfile"
   }
   ```

3. **Environment Variables**
   ```bash
   VITE_BACKEND_URL=https://your-backend.onrender.com
   VITE_WS_URL=wss://your-backend.onrender.com/ws
   ```

### 3. Docker Deployment

#### Build Docker Image

```bash
# Build optimized image
docker build -f Dockerfile.optimized -t nonmine:latest .

# Run container
docker run -d \
  --name nonmine \
  -p 10112:10112 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:password@host:port/database \
  -e JWT_SECRET=your-secret \
  -e TELEGRAM_BOT_TOKEN=your-token \
  nonmine:latest
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.optimized
    ports:
      - "10112:10112"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/nonmine
      - JWT_SECRET=your-super-secure-jwt-secret
      - TELEGRAM_BOT_TOKEN=your-telegram-bot-token
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=NONMINE
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 4. Manual Server Deployment

#### Prerequisites

- Ubuntu 20.04+ server
- Node.js 20+
- PostgreSQL 15+
- Nginx
- PM2

#### Setup Steps

1. **Install Dependencies**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/NONMINE.git
   cd NONMINE
   ```

3. **Install Dependencies**
   ```bash
   pnpm install --frozen-lockfile
   ```

4. **Build Application**
   ```bash
   pnpm run build:prod
   ```

5. **Setup Database**
   ```bash
   # Create database
   sudo -u postgres createdb NONMINE

   # Run migrations
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Setup PM2**
   ```bash
   # Install PM2
   npm install -g pm2

   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'NONMINE',
       script: 'server/dist/index.js',
       cwd: '/path/to/NONMINE',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 10112
       }
     }]
   };
   EOF

   # Start application
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /path/to/NONMINE/server/public;
           try_files $uri $uri/ /index.html;
       }

       # API
       location /api {
           proxy_pass http://localhost:10112;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # WebSocket
       location /ws {
           proxy_pass http://localhost:10112;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## Database Setup

### PostgreSQL

1. **Create Database**
   ```sql
   CREATE DATABASE NONMINE;
   CREATE USER NONMINE_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE NONMINE TO NONMINE_user;
   ```

2. **Run Migrations**
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Seed Data**
   ```bash
   npx prisma db seed
   ```

### Database Optimization

1. **Indexes**
   ```sql
   -- User indexes
   CREATE INDEX idx_users_telegram_id ON "User"("telegramId");
   CREATE INDEX idx_users_created_at ON "User"("createdAt");
   CREATE INDEX idx_users_last_seen ON "User"("lastSeenAt");

   -- Mining slot indexes
   CREATE INDEX idx_mining_slots_user_id ON "MiningSlot"("userId");
   CREATE INDEX idx_mining_slots_active ON "MiningSlot"("isActive");
   CREATE INDEX idx_mining_slots_expires ON "MiningSlot"("expiresAt");

   -- Activity log indexes
   CREATE INDEX idx_activity_logs_user_id ON "ActivityLog"("userId");
   CREATE INDEX idx_activity_logs_type ON "ActivityLog"("type");
   CREATE INDEX idx_activity_logs_created_at ON "ActivityLog"("createdAt");
   ```

2. **Connection Pooling**
   ```typescript
   // server/src/prisma.ts
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
     log: ['query', 'info', 'warn', 'error'],
   });

   // Connection pooling
   prisma.$connect();
   ```

## SSL/TLS Setup

### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rest of configuration...
}
```

## Monitoring Setup

### Health Checks

1. **Application Health**
   ```bash
   curl -f http://localhost:10112/health || exit 1
   ```

2. **Database Health**
   ```bash
   pg_isready -h localhost -p 5432 -U NONMINE_user
   ```

### Logging

1. **Log Rotation**
   ```bash
   # /etc/logrotate.d/NONMINE
   /var/log/NONMINE/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 www-data www-data
       postrotate
           pm2 reloadLogs
       endscript
   }
   ```

2. **Log Monitoring**
   ```bash
   # Install log monitoring
   npm install -g pm2-logrotate
   pm2 install pm2-logrotate
   ```

### Performance Monitoring

1. **PM2 Monitoring**
   ```bash
   # Install PM2 monitoring
   pm2 install pm2-server-monit
   ```

2. **Database Monitoring**
   ```sql
   -- Monitor slow queries
   SELECT query, mean_time, calls, total_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

## Backup Strategy

### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/NONMINE"
DB_NAME="NONMINE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U NONMINE_user -d $DB_NAME > $BACKUP_DIR/NONMINE_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/NONMINE_$DATE.sql

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: NONMINE_$DATE.sql.gz"
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   ```nginx
   upstream NONMINE_backend {
       server 127.0.0.1:10112;
       server 127.0.0.1:10113;
       server 127.0.0.1:10114;
   }

   server {
       location /api {
           proxy_pass http://NONMINE_backend;
       }
   }
   ```

2. **PM2 Cluster**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'NONMINE',
       script: 'server/dist/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 10112
       }
     }]
   };
   ```

### Database Scaling

1. **Read Replicas**
   ```typescript
   // server/src/prisma.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });

   const prismaRead = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_READ_URL,
       },
     },
   });
   ```

2. **Connection Pooling**
   ```typescript
   // Use PgBouncer for connection pooling
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1',
       },
     },
   });
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connection
   psql -h localhost -U NONMINE_user -d NONMINE -c "SELECT 1;"
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Restart if needed
   pm2 restart NONMINE
   ```

3. **SSL Issues**
   ```bash
   # Check SSL certificate
   openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout
   ```

### Performance Issues

1. **Slow Queries**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```

2. **High CPU Usage**
   ```bash
   # Monitor CPU usage
   top -p $(pgrep -f "node.*NONMINE")
   ```

## Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] SSL/TLS configured
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Regular backups scheduled
- [ ] Monitoring configured
- [ ] Log rotation configured

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check application logs
   - Monitor performance metrics
   - Verify backups

2. **Monthly**
   - Update dependencies
   - Review security patches
   - Analyze performance trends

3. **Quarterly**
   - Security audit
   - Performance optimization
   - Disaster recovery test


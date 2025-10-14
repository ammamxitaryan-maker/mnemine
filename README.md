# Mnemine - Professional Telegram Financial Simulator

A sophisticated, professional-grade Telegram-based financial simulation platform with real-time synchronization, advanced analytics, and enterprise-level security features.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment (optional - defaults work for local dev)
cp env.example .env.local

# 3. Start development server
pnpm dev
```

**That's it!** 🎉 
- Frontend: http://localhost:5173
- Backend: http://localhost:10112

For detailed setup instructions, see [QUICK_START.md](QUICK_START.md) or [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md).

## 🚀 Key Features

### 💼 Professional Financial Interface
- **Dual View Modes**: Classic mobile-friendly view and professional desktop dashboard
- **Real-time Data Synchronization**: Live updates with WebSocket-like functionality
- **Advanced Analytics**: Comprehensive market insights and portfolio tracking
- **Trust Indicators**: Security badges, user statistics, and platform certifications
- **Professional Animations**: Smooth transitions and engaging user interactions

### 🔒 Enterprise Security
- **Bank-level Security**: 256-bit SSL encryption and secure transactions
- **Real-time Monitoring**: Live system health checks and performance metrics
- **Rate Limiting**: Advanced request throttling and abuse prevention
- **Data Freshness**: Intelligent caching with conditional requests
- **Audit Trails**: Comprehensive activity logging and tracking

### 💰 Advanced Financial Features
- **Real-time Mining Simulation**: Live earnings calculation with millisecond precision
- **Multi-tier Referral System**: Sophisticated referral bonuses and tracking
- **Dynamic Task Management**: Adaptive daily tasks with progressive rewards
- **Intelligent Lottery System**: Smart jackpot calculations and fair draws
- **Competitive Leaderboards**: Real-time rankings with bonus distributions
- **Portfolio Analytics**: Detailed investment tracking and performance metrics

### 🌍 Global Accessibility
- **Multi-language Support**: English, Russian, and Armenian with RTL support
- **Responsive Design**: Seamless experience across all devices
- **Offline Capability**: Graceful degradation when connectivity is limited
- **Progressive Web App**: Native app-like experience with offline functionality

## 🛠 Tech Stack

### Frontend Architecture
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** with custom professional design system
- **React Query** for advanced data synchronization and caching
- **React Router** for seamless navigation
- **i18next** for comprehensive internationalization
- **Framer Motion** for professional animations

### Backend Infrastructure
- **Node.js** with Express and TypeScript
- **Prisma ORM** with SQLite for reliable data management
- **Real-time Middleware** for live data synchronization
- **Advanced Caching** with ETags and conditional requests
- **Rate Limiting** and security middleware
- **Telegram Bot API** integration with webhook support

### Database & Storage
- **SQLite** with Prisma for development
- **PostgreSQL** ready for production scaling
- **Real-time Data Sync** with intelligent caching
- **Audit Logging** for compliance and security

## 🚀 Quick Start

### 1. Environment Setup

Create `.env` in the root directory:
```env
# Frontend Configuration
VITE_BACKEND_URL=http://localhost:10112
VITE_WS_URL=ws://localhost:10112/ws
VITE_APP_NAME=Mnemine
VITE_APP_VERSION=1.0.0

# Development Mode
NODE_ENV=development
```

Create `server/.env`:
```env
# Server Configuration
PORT=10112
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:10112

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=your_admin_telegram_id

# Database Configuration
DATABASE_URL="file:./dev.db"

# Security (Development - Use strong secrets in production!)
JWT_SECRET=dev-jwt-secret-32-chars-minimum-length-required
ENCRYPTION_KEY=dev-encryption-key-32chars-1234
SESSION_SECRET=dev-session-secret-for-development-only

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5
```

### 2. Installation & Launch

```bash
# Install dependencies
pnpm install

# Start the application in development mode
pnpm run dev

# Or start individually:
# Frontend only
pnpm --prefix client run dev

# Backend only  
pnpm --prefix server run dev
```

**Access Points:**
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend API: http://localhost:10112
- 📊 Real-time API: http://localhost:10112/api/realtime
- 🔌 WebSocket: ws://localhost:10112/ws
- 📊 Admin Panel: http://localhost:5173/admin (admin users only)

## 📊 Professional Dashboard Features

### Real-time Portfolio Tracking
- Live balance updates with animated counters
- Real-time earnings calculation and display
- Market performance indicators
- Investment growth analytics

### Advanced Analytics
- Portfolio performance metrics
- Market trend analysis
- User activity insights
- Referral network visualization

### Trust & Security Indicators
- SSL security badges
- Platform certification displays
- User count and volume statistics
- 24/7 support availability indicators

## 🔄 Real-time Synchronization

### Live Data Updates
- **User Data**: 15-second refresh intervals
- **Market Data**: 30-second refresh intervals
- **Mining Slots**: 10-second refresh intervals
- **Activity Feed**: 20-second refresh intervals

### Smart Caching
- ETag-based conditional requests
- Intelligent stale-while-revalidate patterns
- Background synchronization
- Offline data persistence

## 🏗 Project Architecture

```
mnemine/
├── src/                           # Frontend source
│   ├── components/                # React components
│   │   ├── ProfessionalTheme.tsx  # Professional design system
│   │   ├── TrustIndicators.tsx    # Security & trust components
│   │   ├── RealTimeSync.tsx       # Live synchronization
│   │   ├── EnhancedBalanceDisplay.tsx # Advanced balance UI
│   │   └── ProfessionalDashboard.tsx  # Main dashboard
│   ├── hooks/                     # Custom React hooks
│   │   └── useRealTimeData.tsx    # Real-time data hooks
│   ├── pages/                     # Page components
│   └── lib/                       # Utility libraries
├── server/                        # Server source
│   ├── src/
│   │   ├── controllers/
│   │   │   └── realTimeController.ts # Real-time data handling
│   │   ├── middleware/
│   │   │   └── realTimeMiddleware.ts # Live sync middleware
│   │   └── routes/
│   │       └── realTime.ts        # Real-time API endpoints
│   └── prisma/                    # Database schema
└── public/                        # Static assets
```

## 🔌 API Endpoints

### Real-time Endpoints
- `GET /api/realtime/user/:telegramId` - Live user data
- `GET /api/realtime/market` - Live market data
- `GET /api/realtime/slots/:telegramId` - Live mining slots
- `GET /api/realtime/activity/:telegramId` - Live activity feed
- `GET /api/realtime/health` - System health check

### Core API Endpoints
- `POST /api/auth/telegram` - Telegram authentication
- `GET /api/user/:telegramId` - User profile data
- `POST /api/user/claim` - Claim earnings
- `POST /api/user/reinvest` - Reinvest earnings
- `GET /api/tasks` - Available tasks
- `GET /api/lottery` - Lottery information

## 🚀 Development Commands

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Start production server
```

### Database Management
```bash
cd backend
npx prisma studio    # Open Prisma Studio
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
```

## 🌐 Deployment

### Frontend (Vercel/Netlify)
1. Connect repository to deployment platform
2. Set environment variables
3. Configure build settings
4. Deploy with automatic CI/CD

### Backend (Railway/Render/DigitalOcean)
1. Connect repository
2. Set environment variables
3. Configure build: `npm run build`
4. Configure start: `npm start`
5. Set up database (PostgreSQL for production)

## 🔧 Advanced Configuration

### Real-time Sync Configuration
```typescript
// Customize sync intervals
const syncConfig = {
  userData: 15000,    // 15 seconds
  marketData: 30000,  // 30 seconds
  slotsData: 10000,   // 10 seconds
  activityFeed: 20000 // 20 seconds
};
```

### Security Configuration
```typescript
// Rate limiting settings
const rateLimitConfig = {
  maxRequests: 200,
  windowMs: 60000,    // 1 minute
  skipSuccessfulRequests: true
};
```

## 📈 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Multi-layer caching system
- **Database Indexing**: Optimized query performance

## 🔒 Security Features

- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Token-based validation
- **Rate Limiting**: Request throttling
- **Audit Logging**: Complete activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@mnemine.com
- 💬 Telegram: @mnemine_support
- 📖 Documentation: [docs.mnemine.com](https://docs.mnemine.com)
- 🐛 Issues: [GitHub Issues](https://github.com/mnemine/issues)

---

**Built with ❤️ for the Telegram community**

---

## 📚 Additional Documentation

For detailed setup instructions and troubleshooting, see:
- [Development Guide](DEVELOPMENT.md) - Local development setup
- [QA Documentation](QA_README.md) - Quality assurance and testing
- [Deployment Guide](DEPLOYMENT-READY-NOW.md) - Production deployment#   F a s t m i n e  
 
# 📊 MNEMINE - Complete Application Analysis

## 🎯 High-Level Overview

**Mnemine** is a sophisticated Telegram-based financial simulation platform that combines cryptocurrency mining simulation, investment management, and gamification elements. The application serves as a comprehensive financial ecosystem where users can:

- **Invest in mining slots** with fixed 30% weekly returns
- **Participate in lotteries** with daily draws and substantial jackpots
- **Build referral networks** with multi-level commission structures
- **Exchange currencies** between USD and MNE tokens
- **Complete tasks** for additional rewards
- **Access administrative controls** for platform management

The platform is designed as a **simulation/game** rather than a real financial instrument, providing users with an engaging experience while maintaining professional-grade security and user experience standards.

---

## 🏗 Core Functionality

### 1. **User Registration & Authentication**
- **Telegram WebApp Integration**: Seamless authentication via Telegram's official WebApp API
- **Automatic User Creation**: New users receive welcome bonuses and initial mining slots
- **Role-Based Access**: Admin, Manager, Staff, and User roles with different permissions
- **Security Features**: JWT tokens, encryption, rate limiting, and audit trails

### 2. **Mining Slot System**
- **Fixed Returns**: All slots provide 30% weekly returns regardless of investment amount
- **Slot Types**: Welcome slots (locked for 7 days) and standard slots (claimable anytime)
- **Investment Limits**: Minimum 3 USD, maximum 5 slots per day per user
- **Automatic Processing**: Expired slots automatically credit earnings to user wallets
- **Slot Management**: Users can extend slots, upgrade principals, and reinvest earnings

### 3. **Currency Exchange System**
- **Dual Currency**: USD (internal) and MNE (external) with admin-controlled exchange rates
- **Swap Functionality**: Users can convert between currencies with dynamic rates
- **Withdrawal System**: MNE withdrawals with admin approval and processing
- **Rate Management**: Administrators can adjust exchange rates in real-time

### 4. **Referral System**
- **Multi-Level Commissions**: 2-level referral structure (25% L1, 15% L2)
- **Signup Bonuses**: 3 USD for referrer when new user joins
- **Activity Bonuses**: Additional rewards for active referral networks
- **Rank-Based Benefits**: Higher ranks provide increased commission rates

### 5. **Lottery System**
- **Daily Draws**: Lottery draws every 24 hours with substantial jackpots
- **Ticket System**: Users purchase tickets with 6 numbers (1-49)
- **Prize Distribution**: 70% for 6 matches, 20% for 5 matches, 10% for 4 matches
- **Admin Controls**: Administrators can manually select winning numbers

### 6. **Task & Achievement System**
- **Social Tasks**: Join Telegram channels, follow social media accounts
- **Reward Structure**: Tasks provide USD rewards for completion
- **Achievement Tracking**: Users unlock achievements for various milestones
- **Progress Monitoring**: Real-time tracking of task completion status

### 7. **Real-Time Features**
- **WebSocket Integration**: Live updates for earnings, market data, and notifications
- **Live Earnings Display**: Real-time calculation and display of mining earnings
- **Market Data**: Simulated market statistics and price movements
- **Notification System**: In-app and Telegram notifications for important events

### 8. **Administrative System**
- **Comprehensive Admin Panel**: Full control over users, transactions, and platform settings
- **User Management**: Freeze accounts, monitor activity, process withdrawals
- **Analytics Dashboard**: Detailed statistics on user behavior and platform performance
- **Automated Processing**: Daily payouts, slot expiration, and user activity monitoring

---

## 🗺 Structure Map

### **Frontend Architecture (React + TypeScript)**

#### **Core Components**
```
client/src/
├── components/
│   ├── ui/                    # Reusable UI components (buttons, cards, dialogs)
│   ├── layout/                # Layout components (MainLayout, AdminLayout)
│   ├── admin/                 # Admin-specific components
│   ├── MainCardFront.tsx      # Primary dashboard card
│   ├── MainCardBack.tsx       # Secondary dashboard information
│   ├── BottomNavBar.tsx       # Mobile navigation
│   ├── FlippableCard.tsx      # Interactive card component
│   ├── SlotCard.tsx           # Mining slot display
│   ├── SwapCard.tsx           # Currency exchange interface
│   └── [30+ other components] # Specialized UI components
├── pages/
│   ├── Index.tsx              # Main dashboard
│   ├── Slots.tsx              # Mining slots management
│   ├── Wallet.tsx             # Wallet and balance management
│   ├── Lottery.tsx            # Lottery participation
│   ├── Referrals.tsx          # Referral network management
│   ├── Tasks.tsx              # Task completion interface
│   ├── admin/                 # Admin panel pages
│   └── [15+ other pages]      # Additional feature pages
├── hooks/
│   ├── useUserData.tsx        # User data management
│   ├── useSlotsData.tsx       # Mining slots data
│   ├── useLotteryData.tsx     # Lottery information
│   ├── useWebSocketOptimized.tsx # Real-time data
│   └── [25+ other hooks]      # Specialized data hooks
├── lib/
│   ├── api.ts                 # API client configuration
│   └── utils.ts               # Utility functions
└── types/
    └── telegram.d.ts          # Telegram WebApp types
```

#### **Key Frontend Features**
- **Responsive Design**: Mobile-first approach with desktop optimizations
- **Dark Theme**: Professional dark theme with customizable accents
- **Internationalization**: Support for Armenian (default), Russian, and English
- **Real-Time Updates**: WebSocket integration for live data
- **State Management**: React Query for server state, local state for UI
- **Error Handling**: Comprehensive error boundaries and user feedback

### **Backend Architecture (Node.js + Express + TypeScript)**

#### **API Structure**
```
server/src/
├── controllers/
│   ├── slotController.ts      # Mining slot operations
│   ├── lotteryController.ts   # Lottery management
│   ├── walletController.ts    # Wallet and balance operations
│   ├── swapController.ts      # Currency exchange
│   ├── adminController.ts     # Administrative functions
│   ├── notificationController.ts # Notification system
│   └── [10+ other controllers] # Additional business logic
├── routes/
│   ├── index.ts              # Main router configuration
│   ├── user.ts               # User-related endpoints
│   ├── admin.ts              # Admin panel endpoints
│   ├── lottery.ts            # Lottery endpoints
│   ├── realTime.ts           # Real-time data endpoints
│   └── [10+ other route files] # Additional API routes
├── websocket/
│   └── WebSocketServer.ts    # Real-time communication
├── utils/
│   ├── helpers.ts            # Utility functions
│   ├── validation.ts         # Input validation
│   ├── slotProcessor.ts      # Automated slot processing
│   └── [5+ other utilities]  # Additional utilities
└── prisma/
    └── schema.prisma         # Database schema
```

#### **Database Schema (Prisma + PostgreSQL)**
```
Key Models:
├── User                      # User accounts and profiles
├── Wallet                    # Multi-currency wallets
├── MiningSlot               # Investment slots
├── Lottery                  # Lottery draws and jackpots
├── LotteryTicket            # User lottery tickets
├── Task                     # Available tasks
├── CompletedTask            # User task completions
├── ActivityLog              # All user actions
├── Notification             # User notifications
├── SwapTransaction          # Currency exchange records
├── ExchangeRate             # Admin-controlled exchange rates
├── Investment               # Investment tracking
├── Withdrawal               # Withdrawal requests
├── ReferralEarning          # Referral commission tracking
├── DailyPayout              # Daily payout processing
├── AccountFreeze            # Account suspension records
└── [Additional models]      # Supporting data structures
```

---

## 🧭 Navigation Flow

### **Primary User Journey**

1. **Entry Point**: User accesses via Telegram WebApp
2. **Authentication**: Automatic login via Telegram credentials
3. **Dashboard**: Main interface showing balance, earnings, and navigation
4. **Core Activities**:
   - **Mining Slots**: Purchase, monitor, and claim earnings
   - **Lottery**: Buy tickets and check results
   - **Referrals**: Share referral codes and monitor network
   - **Tasks**: Complete social media tasks for rewards
   - **Wallet**: Manage balances and currency exchanges
5. **Administrative Access**: Admin users can access management panel

### **Navigation Structure**
```
Main App (Bottom Navigation):
├── Home (/)                  # Dashboard with earnings and quick actions
├── Wallet (/wallet)          # Balance management and transactions
├── Lottery (/lottery)        # Lottery participation and history
├── Referrals (/referrals)    # Referral network management
└── Profile (/profile)        # User settings and account info

Additional Pages:
├── Slots (/slots)            # Mining slot management
├── Tasks (/tasks)            # Task completion interface
├── Leaderboard (/leaderboard) # User rankings
├── Achievements (/achievements) # Achievement tracking
├── Bonuses (/bonuses)        # Bonus management
├── Stats (/stats)            # User statistics
├── Deposit (/deposit)        # Deposit interface
├── Withdraw (/withdraw)      # Withdrawal interface
└── Settings (/settings)      # Application settings

Admin Panel:
├── Dashboard (/admin)        # Admin overview
├── Users (/admin/users)      # User management
├── Transactions (/admin/transactions) # Transaction monitoring
├── Analytics (/admin/analytics) # Platform analytics
├── Lottery (/admin/lottery)  # Lottery management
├── Notifications (/admin/notifications) # Notification management
├── Processing (/admin/processing) # Automated processing
├── Exchange (/admin/exchange) # Exchange rate management
├── Logs (/admin/logs)        # System logs
└── Settings (/admin/settings) # Platform settings
```

### **User Flow Examples**

#### **New User Registration**
1. Telegram WebApp → Authentication → Welcome bonus (3 USD)
2. Automatic slot creation → 7-day locked mining slot
3. Dashboard tour → Core features explanation
4. First task completion → Additional rewards
5. Referral code sharing → Network building

#### **Investment Flow**
1. Dashboard → View current earnings
2. Slots page → Purchase new mining slot
3. Wallet management → Monitor balance changes
4. Real-time updates → Live earnings display
5. Slot expiration → Automatic earnings credit

#### **Lottery Participation**
1. Lottery page → View current jackpot
2. Number selection → Choose 6 numbers (1-49)
3. Ticket purchase → Deduct 1 USD from balance
4. Jackpot contribution → 50% goes to jackpot
5. Draw results → Check winning numbers and prizes

---

## ⚠️ Complexity & Confusion Points

### **High Complexity Areas**

#### **1. Mining Slot System**
- **Multiple Slot Types**: Welcome slots vs standard slots with different rules
- **Locking Mechanism**: Welcome slots locked for 7 days, standard slots claimable anytime
- **Earnings Calculation**: Real-time vs end-of-period earnings
- **Extension Logic**: Slot extension costs and duration calculations
- **Reinvestment System**: Bonus rates for reinvesting earnings

#### **2. Referral System**
- **Multi-Level Structure**: 2-level referral commissions with different rates
- **Activity Requirements**: Referral bonuses dependent on user activity
- **Rank-Based Benefits**: Higher ranks provide increased commission rates
- **Balance Caps**: Referral earnings limited by user's balance
- **Penalty System**: Zero referrals in 7 days triggers penalties

#### **3. Currency Exchange**
- **Dual Currency System**: USD (internal) vs MNE (external) with different rules
- **Exchange Rate Management**: Admin-controlled rates with variation limits
- **Withdrawal Process**: Multi-step approval process for MNE withdrawals
- **Minimum Amounts**: Different minimums for different operations

#### **4. Administrative System**
- **Role Hierarchy**: Admin, Manager, Staff with different permissions
- **Automated Processing**: Daily payouts, slot expiration, user monitoring
- **Account Management**: Freeze/unfreeze accounts, activity monitoring
- **Analytics Complexity**: Multiple metrics and reporting systems

### **Potential User Confusion Points**

#### **1. Earnings Display**
- **Real-Time vs Actual**: Users see live earnings but can only claim after slot expiration
- **Welcome Slot Locking**: New users may not understand why they can't claim immediately
- **Rate Calculations**: 30% weekly rate may be confusing for users expecting daily returns

#### **2. Referral System**
- **Commission Structure**: 2-level system with different rates may be unclear
- **Activity Requirements**: Users may not understand why referral bonuses stop
- **Balance Caps**: Referral earnings limited by balance may seem unfair

#### **3. Currency System**
- **USD vs MNE**: Users may not understand why they need to convert currencies
- **Exchange Rates**: Admin-controlled rates may seem arbitrary
- **Withdrawal Process**: Multi-step approval may frustrate users

#### **4. Lottery System**
- **Number Selection**: 6 numbers from 1-49 may be overwhelming
- **Prize Distribution**: Complex prize structure may be unclear
- **Draw Timing**: 24-hour draws may not align with user expectations

### **Technical Complexity**

#### **1. Real-Time Updates**
- **WebSocket Management**: Multiple connection types and subscription handling
- **Data Synchronization**: Keeping client and server data in sync
- **Performance Optimization**: Efficient broadcasting to multiple clients

#### **2. Automated Processing**
- **Slot Expiration**: Batch processing of expired slots
- **Daily Payouts**: Complex calculation and distribution logic
- **User Monitoring**: Activity tracking and account management

#### **3. Security & Validation**
- **Input Validation**: Comprehensive validation across all endpoints
- **Rate Limiting**: Protection against abuse and spam
- **Audit Logging**: Complete activity tracking for compliance

---

## 🔌 Dependencies & Integrations

### **Frontend Dependencies**

#### **Core Framework**
- **React 18.3.1**: Modern React with concurrent features
- **TypeScript 5.9.3**: Type-safe development
- **Vite 6.3.6**: Fast build tool and development server

#### **UI & Styling**
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-tooltip`
- **Lucide React 0.462.0**: Icon library
- **Next Themes 0.3.0**: Theme management
- **Tailwind CSS Animate 1.0.7**: Animation utilities

#### **State Management & Data Fetching**
- **TanStack React Query 5.90.2**: Server state management
- **React Router DOM 6.30.1**: Client-side routing
- **Axios 1.12.2**: HTTP client for API communication

#### **Internationalization**
- **React i18next 11.18.6**: Internationalization framework
- **i18next 25.5.3**: Core i18n library
- **i18next-browser-languagedetector 8.2.0**: Language detection
- **i18next-http-backend 2.7.3**: Translation loading

#### **Charts & Visualization**
- **Recharts 2.15.4**: Chart library for data visualization

#### **Development Tools**
- **Vitest 2.1.9**: Testing framework
- **Playwright 1.55.1**: End-to-end testing
- **ESLint 9.37.0**: Code linting
- **TypeScript ESLint 8.45.0**: TypeScript-specific linting

### **Backend Dependencies**

#### **Core Framework**
- **Express 4.21.2**: Web application framework
- **Node.js 20+**: Runtime environment
- **TypeScript 5.9.3**: Type-safe development

#### **Database & ORM**
- **Prisma 6.16.3**: Database ORM and toolkit
- **@prisma/client 6.16.3**: Prisma client for database operations
- **PostgreSQL**: Primary database (production)
- **SQLite**: Development database (fallback)

#### **Authentication & Security**
- **jsonwebtoken 9.0.2**: JWT token handling
- **helmet 8.1.0**: Security headers
- **express-rate-limit 7.5.1**: Rate limiting
- **cors 2.8.5**: Cross-origin resource sharing

#### **Real-Time Communication**
- **ws 8.18.3**: WebSocket server implementation
- **Telegraf 4.16.3**: Telegram Bot API wrapper

#### **Utilities & Middleware**
- **compression 1.8.1**: Response compression
- **morgan 1.10.1**: HTTP request logger
- **dotenv 16.6.1**: Environment variable management

#### **Development Tools**
- **tsc-watch 6.3.1**: TypeScript compilation with watch mode
- **Vitest 2.1.9**: Testing framework
- **Supertest 7.1.4**: HTTP assertion testing

### **External Integrations**

#### **Telegram Integration**
- **Telegram WebApp API**: User authentication and data
- **Telegram Bot API**: Bot functionality and webhooks
- **Telegram WebApp**: In-app browser environment

#### **Deployment & Infrastructure**
- **Render.com**: Primary deployment platform
- **PostgreSQL (Render)**: Production database
- **Vercel/Netlify**: Frontend deployment (alternative)

#### **Development Tools**
- **pnpm 8.15.0**: Package manager
- **Git**: Version control
- **ESLint**: Code quality
- **Prettier**: Code formatting (implicit)

### **Build & Deployment**

#### **Frontend Build**
- **Vite**: Fast bundling and optimization
- **Rollup**: Module bundling
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

#### **Backend Build**
- **TypeScript Compiler**: Type checking and compilation
- **Prisma Generate**: Database client generation
- **Node.js**: Runtime execution

#### **Deployment Scripts**
- **Concurrently**: Parallel script execution
- **Custom deployment scripts**: Automated deployment to Render

### **Monitoring & Analytics**

#### **Built-in Monitoring**
- **Health Check Endpoints**: System status monitoring
- **Activity Logging**: Comprehensive user action tracking
- **Error Tracking**: Centralized error handling and logging
- **Performance Metrics**: Response time and throughput monitoring

#### **External Monitoring** (Potential)
- **Application Performance Monitoring**: Could integrate with services like New Relic
- **Error Tracking**: Could integrate with Sentry
- **Analytics**: Could integrate with Google Analytics or similar

---

## 📈 Performance & Scalability

### **Current Performance Optimizations**

#### **Frontend Optimizations**
- **Code Splitting**: Lazy loading of components and routes
- **Bundle Optimization**: Manual chunk splitting for vendor libraries
- **Image Optimization**: Efficient asset loading
- **Caching Strategy**: React Query with intelligent cache management
- **Real-Time Updates**: Optimized WebSocket connections

#### **Backend Optimizations**
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Response Compression**: Gzip compression for API responses
- **Rate Limiting**: Protection against abuse and overload
- **Batch Processing**: Efficient handling of bulk operations

### **Scalability Considerations**

#### **Database Scaling**
- **PostgreSQL**: Production-ready database with ACID compliance
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Indexed queries and efficient data access
- **Migration Strategy**: Prisma migrations for schema evolution

#### **Application Scaling**
- **Stateless Design**: No server-side session storage
- **Horizontal Scaling**: Multiple server instances possible
- **Load Balancing**: Ready for load balancer deployment
- **Caching Layer**: Redis integration potential

#### **Real-Time Scaling**
- **WebSocket Management**: Efficient connection handling
- **Broadcast Optimization**: Selective message broadcasting
- **Connection Limits**: Configurable connection limits
- **Fallback Mechanisms**: Graceful degradation when WebSocket unavailable

---

## 🔒 Security Features

### **Authentication & Authorization**
- **Telegram WebApp**: Secure authentication via Telegram's official API
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-Based Access**: Admin, Manager, Staff, and User roles
- **Session Management**: Secure session handling

### **Data Protection**
- **Input Validation**: Comprehensive validation on all user inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Protection**: Content Security Policy and input sanitization
- **CSRF Protection**: Token-based validation

### **Rate Limiting & Abuse Prevention**
- **Request Throttling**: Configurable rate limits per endpoint
- **IP-based Limiting**: Protection against abuse from specific IPs
- **User-based Limiting**: Per-user request limits
- **Admin Override**: Admin users exempt from rate limits

### **Audit & Compliance**
- **Activity Logging**: Complete audit trail of all user actions
- **Error Tracking**: Comprehensive error logging and monitoring
- **Data Retention**: Configurable data retention policies
- **Privacy Controls**: User data protection and deletion capabilities

---

## 🚀 Deployment & Infrastructure

### **Current Deployment**
- **Platform**: Render.com (primary)
- **Database**: PostgreSQL on Render
- **Frontend**: Served from backend (monolithic deployment)
- **Domain**: Custom domain with SSL
- **Environment**: Production with development fallbacks

### **Deployment Process**
- **Automated Build**: pnpm-based build process
- **Database Migrations**: Prisma migrations on deployment
- **Environment Variables**: Secure configuration management
- **Health Checks**: Automated health monitoring
- **Rollback Strategy**: Git-based rollback capabilities

### **Monitoring & Maintenance**
- **Health Endpoints**: System status monitoring
- **Log Aggregation**: Centralized logging
- **Performance Monitoring**: Response time tracking
- **Error Alerting**: Automated error notifications
- **Backup Strategy**: Database backup and recovery

---

## 📊 Analytics & Reporting

### **User Analytics**
- **Registration Tracking**: User signup patterns and sources
- **Activity Monitoring**: User engagement and behavior
- **Financial Metrics**: Investment patterns and earnings
- **Referral Analysis**: Network growth and effectiveness

### **Platform Analytics**
- **System Performance**: Response times and throughput
- **Error Rates**: Application error tracking
- **Usage Patterns**: Feature adoption and usage
- **Revenue Metrics**: Platform financial performance

### **Administrative Reporting**
- **User Management**: Account status and activity
- **Transaction Monitoring**: Financial transaction tracking
- **System Health**: Infrastructure and application status
- **Compliance Reporting**: Audit trail and regulatory compliance

---

## 🎯 Future Enhancements

### **Potential Improvements**
- **Mobile App**: Native mobile application development
- **Advanced Analytics**: Enhanced reporting and insights
- **API Expansion**: Third-party integration capabilities
- **Multi-Language Support**: Additional language options
- **Advanced Security**: Enhanced security features
- **Performance Optimization**: Further performance improvements

### **Scalability Roadmap**
- **Microservices**: Service decomposition for better scalability
- **CDN Integration**: Content delivery network for global performance
- **Database Sharding**: Horizontal database scaling
- **Caching Layer**: Redis integration for improved performance
- **Load Balancing**: Advanced load balancing strategies

---

## 📝 Conclusion

Mnemine represents a sophisticated financial simulation platform that successfully combines:

- **Professional-grade architecture** with modern web technologies
- **Comprehensive user experience** with real-time features and responsive design
- **Robust administrative controls** with detailed analytics and monitoring
- **Scalable infrastructure** ready for growth and expansion
- **Security-first approach** with comprehensive protection measures

The application demonstrates excellent engineering practices with clean code architecture, comprehensive documentation, and production-ready deployment strategies. The combination of gamification elements with financial simulation creates an engaging user experience while maintaining the technical rigor expected of a professional platform.

The platform is well-positioned for future growth with its modular architecture, comprehensive feature set, and scalable infrastructure. The extensive documentation and well-organized codebase provide a solid foundation for continued development and maintenance.

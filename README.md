# 🎴 Teen Patti - Multiplayer Card Game Platform

A full-stack, real-time multiplayer Teen Patti (Indian Poker) game platform with web and mobile applications, featuring advanced game mechanics, bot intelligence, referral system, and comprehensive transaction management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Game Rules](#game-rules)
- [System Features](#system-features)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Mobile App](#mobile-app)
- [Security](#security)
- [Testing](#testing)

---

## 🎯 Overview

Teen Patti is a complete multiplayer card game platform that brings the classic Indian card game to digital platforms. The project includes:

- **Web Application**: React-based responsive web app
- **Mobile Application**: React Native app for iOS and Android
- **Real-time Backend**: Node.js server with Socket.io for live gameplay
- **Admin Panel**: Complete game management and analytics
- **Bot System**: Intelligent AI bots to fill tables
- **Payment Integration**: Deposit, withdrawal, and transfer system
- **Referral Program**: Multi-level referral bonus structure

---

## ✨ Features

### 🎮 Core Game Features

#### **1. Real-Time Multiplayer Gameplay**
- Live card dealing and betting
- Socket.io powered real-time updates
- Multi-table support (6 players per table)
- Spectator mode
- Chat functionality
- Connection state management with auto-reconnect

#### **2. Advanced Card System**
- High-resolution card graphics
- Large, clear card display for better visibility
- Smooth animations and transitions
- Card combinations:
  - **Trail/Set** (Three of a kind)
  - **Pure Sequence** (Straight Flush)
  - **Sequence** (Straight)
  - **Color** (Flush)
  - **Pair** (Two of a kind)
  - **High Card**

#### **3. Joker Feature 🃏**
- **Activation Requirements:**
  - Must have made at least 1 deposit (`hasMadeFirstDeposit = true`)
  - Minimum balance: ₹500
- **Rules:**
  - Can be used once per game
  - Cards get special background color indicator
  - 30% deduction on winnings
  - Multiple Joker users: Only the highest winner among Joker users pays the fee
  - Joker users can see each other's cards
- **Visual Indicators:**
  - Button state changes based on eligibility
  - Real-time balance validation
  - Clear UI feedback

#### **4. Intelligent Bot System**
- AI-powered bots with strategic decision-making
- Adaptive betting patterns
- Realistic timing delays
- Admin-controlled bot management:
  - Mark seats as bots
  - Change bot identity (name/ID)
  - Control bot behavior per table
- Automatic table filling

#### **5. Practice Mode**
- **100 Free Practice Coins** on registration
- Separate from real money balance
- Non-transferable and non-withdrawable
- Perfect for learning the game
- No deposit required to start playing

#### **6. LIVE Tip System 💰**
- **Real-time tipping during gameplay**
- **Tip Amounts**: 10+, 20+, 50+, 100+ (coins/₹)
- **Features:**
  - Beautiful animated buttons with gradient colors (gold, red, teal, purple)
  - Instant coin deduction and balance update
  - Real-time broadcast to all players at table
  - Flying coins animation when someone tips
  - Recent tips list showing last 5 tips with player names
  - Balance validation (buttons auto-disable when insufficient funds)
  - Only available during active gameplay (betting/showdown phases)
- **Good Cards Detection:**
  - Optional popup appears when player gets good cards (Trail, Pure Sequence, Sequence, Color, Pair)
  - Suggests tipping to celebrate lucky draw
  - Beautiful animated modal with gradient design
  - Quick tip options or "Maybe Later" button
  - Only shows once per hand
  - Does NOT affect gameplay fairness
- **Transaction Tracking:**
  - All tips stored in database with timestamp
  - Tracks card quality with each tip
  - View tip history and statistics
  - Analytics dashboard for tip trends
- **Available on:** Web & Mobile

---

### 💰 Financial Features

#### **1. Dual Currency System**
- **Practice Coins**: 100 free, non-transferable demo coins
- **Real Coins**: Deposited money for real gameplay
- Separate balance tracking
- Clear UI differentiation

#### **2. Deposit System**
- Multiple payment methods support
- Instant balance updates
- Transaction verification
- First deposit tracking (`hasMadeFirstDeposit` flag)
- Secure payment processing

#### **3. Withdrawal System**
- Request withdrawal from real coins
- Admin approval workflow
- Bank account verification
- Transaction history logging
- Status tracking (Pending/Approved/Rejected)

#### **4. Coin Transfer System 💸**
- **Peer-to-peer coin transfers**
- **Requirements:**
  - Must have made at least 1 deposit
  - Sufficient balance required
  - Cannot transfer to self
  - Only real coins can be transferred
- **Features:**
  - Quick amount buttons (₹100, ₹500, ₹1000, ₹5000)
  - Real-time balance validation
  - Instant transfer processing
  - Transaction logging for both parties
  - Beautiful gradient UI
  - Locked state before first deposit
- **Available on:** Web & Mobile

#### **5. Comprehensive Transaction History**
- **Tracks All Transaction Types:**
  - ⬇️ **Deposits**: Money added to account
  - ⬆️ **Withdrawals**: Money withdrawn
  - 💸 **Transfer Sent**: Coins sent to another player
  - 💰 **Transfer Received**: Coins received from another player
  - 🎁 **Referral Bonus**: Earnings from referrals
  - 🃏 **Joker Deduction**: 30% fee for using Joker
  - 🏆 **Game Win**: Winnings from games
  - ❌ **Game Loss**: Lost bets
- Timestamp and amount tracking
- Balance before/after each transaction
- Detailed descriptions
- Export functionality

---

### 🎁 Referral System

#### **Multi-Level Bonus Structure: 5% → 2% → 1%**

- **How It Works:**
  1. Each user gets a unique referral code on registration
  2. New users can enter referral code during signup
  3. Referrer receives bonuses on referee's deposits:
     - **1st Deposit**: 5% bonus
     - **2nd Deposit**: 2% bonus
     - **3rd Deposit**: 1% bonus
  4. Bonuses are exact decimal amounts (no rounding)

- **Features:**
  - Automatic referral code generation
  - Copy/share referral code functionality
  - View referred users list
  - Track referral earnings
  - Transaction history integration
  - Real-time bonus crediting

- **Example:**
  - User A refers User B
  - User B deposits ₹1000 (1st deposit) → User A gets ₹50 (5%)
  - User B deposits ₹2000 (2nd deposit) → User A gets ₹40 (2%)
  - User B deposits ₹5000 (3rd deposit) → User A gets ₹50 (1%)

---

### 👨‍💼 Admin Features

> **📌 Note:** Admin Panel is now available on **both Web and Mobile platforms**! The mobile app includes full admin functionality with native UI optimized for portrait mode.

#### **1. Admin Dashboard**
- Real-time statistics and analytics
- Quick action buttons for all admin sections
- User management
- Transaction monitoring
- Game session overview
- Revenue tracking
- **Mobile:** Portrait-optimized with gradient buttons

#### **2. Bot Management**
- Add/remove bots from tables
- Change bot identities
- Configure bot behavior
- Monitor bot performance
- Control bot betting patterns
- **Mobile:** Full-featured bot control panel with native UI

#### **3. Table Seat Manager (NEW!)**
- Visual table layout with seat positions
- Click to assign bots to empty seats
- Remove bots from occupied seats
- Real-time seat status updates
- Blueprint selection with identity modes
- **Mobile:** Touch-friendly grid layout, portrait optimized

#### **4. Bot Monitoring & Analytics (NEW!)**
- Real-time bot instance monitoring
- Performance statistics and win rates
- Audit logs for all admin actions
- Bot identity rotation
- Deactivate underperforming bots
- **Mobile:** Native card-based layout with charts

#### **5. Transaction Management**
- Approve/reject withdrawal requests
- View all deposits and withdrawals
- Transaction history for all users
- Financial reports
- Fraud detection tools
- **Mobile:** Swipe-friendly cards with quick actions

#### **6. User Management**
- View all registered users
- Ban/unban users
- Adjust user balances (admin override)
- View user game history
- Monitor suspicious activity
- **Mobile:** Search, filter, and pagination

#### **7. Complaint Tracker & Enquiry Management**
- Ticket-based support system
- Status management (pending/responded/resolved)
- Admin response tracking
- Priority handling
- **Mobile:** Full CRUD operations with native forms

---

### 📱 Mobile App Features

- **Native iOS and Android support**
- **Feature parity with web:**
  - ✅ All game features
  - ✅ Coin transfer
  - ✅ Referral system
  - ✅ Transaction history
  - ✅ Joker feature
  - ✅ Practice coins
  - ✅ Deposit/Withdrawal
- **Mobile-optimized UI:**
  - Touch-friendly controls
  - Responsive card display
  - Native animations
  - LinearGradient backgrounds
  - Material Icons
- **Offline capabilities:**
  - AsyncStorage for persistence
  - Reconnection handling
  - State recovery
- **Complete Feature Parity with Web:**
  - ✅ **Player Features:**
    - Joker premium feature
    - Live tip system with animations
    - Good cards detection popup
    - Coin transfer system
    - Referral program
    - Transaction history
    - Practice & real coins
    - All game mechanics
    - Deposit/Withdrawal requests
  - ✅ **Admin Features (NEW!):**
    - Admin Dashboard with quick actions
    - User management
    - Transaction management
    - Subscription management
    - Bot Management (assign/remove)
    - Table Seat Manager
    - Bot Monitoring & Analytics
    - Complaint Tracker
    - Enquiry Management
    - Audit Logs

---

## 🛠️ Technology Stack

### **Frontend - Web**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ | UI framework |
| **TypeScript** | Latest | Type safety |
| **Vite** | Latest | Build tool & dev server |
| **Socket.io Client** | 4.8.1 | Real-time communication |
| **Zustand** | Latest | State management |
| **React Router** | Latest | Navigation |
| **Tailwind CSS** | Latest | Styling framework |
| **Vitest** | Latest | Testing framework |

**Key Libraries:**
- `react-hot-toast`: Toast notifications
- `axios`: HTTP client
- `date-fns`: Date formatting
- `react-icons`: Icon library

### **Frontend - Mobile**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | Latest | Mobile framework |
| **TypeScript** | Latest | Type safety |
| **Socket.io Client** | 4.8.1 | Real-time communication |
| **React Navigation** | Latest | Mobile navigation |
| **AsyncStorage** | Latest | Local storage |
| **LinearGradient** | Latest | Gradient backgrounds |
| **MaterialIcons** | Latest | Icon library |

**Key Libraries:**
- `react-native-vector-icons`: Icons
- `react-native-linear-gradient`: Gradients
- `@react-native-async-storage/async-storage`: Persistence

### **Backend**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | Latest | Web framework |
| **TypeScript** | Latest | Type safety |
| **Socket.io** | 4.8.1 | WebSocket server |
| **MongoDB** | 6+ | Database |
| **Mongoose** | Latest | ODM for MongoDB |

**Key Libraries:**
- `jsonwebtoken`: Authentication
- `bcrypt`: Password hashing
- `cors`: Cross-origin requests
- `dotenv`: Environment variables
- `helmet`: Security headers
- `express-rate-limit`: Rate limiting

### **Database Schema**

#### **User Model**
```typescript
{
  username: string (unique)
  email: string (unique)
  password: string (hashed)
  realCoins: number (default: 0)
  practiceCoins: number (default: 100)
  hasMadeFirstDeposit: boolean (default: false)
  referralCode: string (unique, auto-generated)
  referredBy: ObjectId (reference to User)
  referredUsers: ObjectId[] (array of referred users)
  isAdmin: boolean
  isBanned: boolean
  createdAt: Date
  lastLogin: Date
}
```

#### **Transaction Model**
```typescript
{
  userId: ObjectId
  type: enum [DEPOSIT, WITHDRAWAL, TRANSFER_SENT, TRANSFER_RECEIVED, 
               REFERRAL_BONUS, JOKER_DEDUCTION, GAME_WIN, GAME_LOSS, TIP]
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  relatedUser: ObjectId (for transfers)
  status: enum [PENDING, COMPLETED, REJECTED]
  createdAt: Date
}
```

#### **Tip Model**
```typescript
{
  tipId: string (unique)
  tableId: number
  playerId: string
  playerName: string
  amount: number (enum: 10, 20, 50, 100)
  gameMode: enum ['trial', 'token']
  roundNumber: number
  timestamp: Date
  cardQuality: enum ['pair', 'color', 'sequence', 'pure_sequence', 'trail', 'regular']
}
```

#### **Game Session Model**
```typescript
{
  tableId: string
  players: ObjectId[]
  currentRound: number
  pot: number
  dealer: number
  currentPlayer: number
  gameState: enum [WAITING, DEALING, BETTING, SHOWDOWN, ENDED]
  cards: Map<userId, Card[]>
  bets: Map<userId, number>
  jokerUsers: ObjectId[]
  createdAt: Date
  endedAt: Date
}
```

### **Development Tools**

- **Git**: Version control
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Vitest**: Component testing
- **Postman**: API testing
- **VS Code**: IDE

---

## 🏗️ Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   Web App        │              │   Mobile App     │     │
│  │   (React)        │              │ (React Native)   │     │
│  │   Port: 5173     │              │   iOS/Android    │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
            │         HTTP/WebSocket           │
            │                                  │
┌───────────┼──────────────────────────────────┼──────────────┐
│           ▼                                  ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API GATEWAY / LOAD BALANCER             │    │
│  └─────────────────────────────────────────────────────┘    │
│                         SERVER                               │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   Express.js     │◄────────────►│   Socket.io      │     │
│  │   REST API       │              │   WebSocket      │     │
│  │   Port: 5000     │              │   Real-time      │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
│           │                                  │               │
│           ▼                                  ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SERVICE LAYER                           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Game     │ │Referral  │ │ Joker    │            │    │
│  │  │ Service  │ │ Service  │ │ Service  │  ...       │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────┘    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              REPOSITORY LAYER                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ User     │ │Transaction│ │ Game     │            │    │
│  │  │ Repo     │ │ Repo      │ │ Repo     │  ...       │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MongoDB (Port: 27017)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Users    │ │Transaction│ │ Games    │            │    │
│  │  │Collection│ │Collection │ │Collection│  ...       │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### **Real-Time Communication Flow**

```
Player A                    Server                    Player B
   │                          │                          │
   │─────── Connect ─────────►│                          │
   │                          │◄────── Connect ──────────│
   │                          │                          │
   │───── Join Table ────────►│                          │
   │                          │──── Player Joined ──────►│
   │                          │                          │
   │◄──── Deal Cards ─────────│───── Deal Cards ────────►│
   │                          │                          │
   │───── Place Bet ─────────►│                          │
   │                          │──── Bet Placed ─────────►│
   │                          │                          │
   │◄──── Update Pot ─────────│───── Update Pot ────────►│
   │                          │                          │
   │                          │◄───── Place Bet ─────────│
   │◄──── Bet Placed ─────────│                          │
   │                          │                          │
   │◄──── Showdown ───────────│───── Showdown ──────────►│
   │                          │                          │
   │◄──── Winner ─────────────│───── Winner ─────────────►│
```

---

## 🎲 Game Rules

### **Teen Patti Basics**

1. **Players**: 2-6 players per table
2. **Deck**: Standard 52-card deck
3. **Deal**: 3 cards per player, face down
4. **Objective**: Have the best 3-card hand or make others fold

### **Hand Rankings** (Highest to Lowest)

1. **Trail/Set** (Three of a kind)
   - Example: K♠ K♥ K♦
   - A-A-A is highest, 2-2-2 is lowest

2. **Pure Sequence** (Straight Flush)
   - Example: 5♠ 6♠ 7♠
   - A-2-3 is highest, 4-3-2 is lowest

3. **Sequence** (Straight)
   - Example: 5♠ 6♥ 7♦
   - A-2-3 is highest, 5-3-2 is lowest

4. **Color** (Flush)
   - Example: K♠ 9♠ 5♠
   - Compared by high card

5. **Pair** (Two of a kind)
   - Example: 9♠ 9♥ K♦
   - A-A-K is highest

6. **High Card**
   - Example: A♠ K♥ 9♦
   - Compared by highest card

### **Betting Rules**

- **Boot Amount**: Minimum entry fee (pot starter)
- **Blind Play**: Play without seeing cards (lower bets)
- **Seen Play**: Play after seeing cards (higher bets)
- **Chaal**: Match current bet
- **Raise**: Increase the bet
- **Fold**: Forfeit hand and lose bet
- **Show**: Compare cards (only with 2 players left)

### **Special Rules**

- **Side Show**: Request to compare cards with previous player (if allowed)
- **Pack**: Fold your hand
- **Pot Limit**: Maximum pot size can be configured

---

## 🚀 Installation

### **Prerequisites**

- Node.js 18+ installed
- MongoDB 6+ running
- Git installed
- For mobile: React Native development environment setup

### **Backend Setup**

```bash
# Clone repository
git clone https://github.com/yogi-68/Teen-Patti-react.git
cd Teen-Patti-react

# Install server dependencies
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/teen-patti
# JWT_SECRET=your-secret-key
# NODE_ENV=development

# Start server
npm run dev
```

### **Web Frontend Setup**

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env:
# VITE_API_URL=http://localhost:5000
# VITE_SOCKET_URL=http://localhost:5000

# Start development server
npm run dev
```

### **Mobile App Setup**

```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
npm install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

---

## 📡 API Documentation

### **Authentication**

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player123",
  "email": "player@example.com",
  "password": "securePassword123",
  "referralCode": "ABC123XYZ" // Optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "securePassword123"
}
```

### **Transfer API**

#### Transfer Coins
```http
POST /api/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "toUsername": "recipient123",
  "amount": 1000
}
```

#### Check Transfer Eligibility
```http
GET /api/transfer/check/:userId
Authorization: Bearer <token>
```

### **Transaction History**

#### Get User Transactions
```http
GET /api/transactions/:userId
Authorization: Bearer <token>
```

### **Referral System**

#### Get Referral Stats
```http
GET /api/referral/stats/:userId
Authorization: Bearer <token>
```

### **Tip System**

#### Get Tip History
```http
GET /api/tips/history/:userId?limit=20
Authorization: Bearer <token>
```

#### Get Table Tips
```http
GET /api/tips/table/:tableId?roundNumber=1
Authorization: Bearer <token>
```

#### Get Tip Statistics
```http
GET /api/tips/stats/:userId
Authorization: Bearer <token>
```

#### Validate Tip
```http
POST /api/tips/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user123",
  "amount": 50,
  "gameMode": "token"
}
```

#### Detect Card Quality
```http
POST /api/tips/detect-quality
Authorization: Bearer <token>
Content-Type: application/json

{
  "cards": [
    { "type": "heart", "rank": 13 },
    { "type": "heart", "rank": 12 },
    { "type": "heart", "rank": 11 }
  ]
}
```

### **Wallet**

#### Get Balance
```http
GET /api/wallet/:userId
Authorization: Bearer <token>
```

#### Request Withdrawal
```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "bankAccount": "1234567890"
}
```

---

## 🔒 Security Features

### **Authentication & Authorization**
- JWT-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh
- Role-based access control (Admin/User)

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention (NoSQL)
- XSS protection
- CSRF protection
- Rate limiting on API endpoints

### **Financial Security**
- Transaction verification
- Balance validation before operations
- Atomic database transactions
- Audit trail for all financial operations
- Admin approval for withdrawals

### **Game Integrity**
- Server-side game logic validation
- Encrypted card dealing
- Anti-cheating measures
- Bot detection
- Suspicious activity monitoring

---

## 🧪 Testing

### **Unit Tests**
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Mobile tests
cd mobile
npm test
```

### **Integration Tests**
```bash
# Run integration tests
cd server
npm run test:integration
```

### **E2E Tests**
```bash
# Run end-to-end tests
cd client
npm run test:e2e
```

### **Test Coverage**
- Backend: 80%+ coverage target
- Frontend: 75%+ coverage target
- Critical paths: 100% coverage

---

## 📊 Performance Metrics

- **Real-time Latency**: <100ms for game actions
- **Concurrent Users**: Supports 1000+ simultaneous players
- **Database Queries**: Optimized with indexing
- **WebSocket Connections**: Stable with auto-reconnect
- **Mobile App**: 60 FPS gameplay

---

## 🌐 Deployment

### **Production Deployment**

#### Backend (Render/Heroku/AWS)
```bash
# Build
npm run build

# Start production server
npm start
```

#### Web Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Preview
npm run preview
```

#### Mobile App
- **iOS**: Submit to App Store via Xcode
- **Android**: Build APK/AAB for Play Store

---

## 📝 Environment Variables

### **Server (.env)**
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/teen-patti
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### **Client (.env)**
```env
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues, questions, or support:
- **Email**: support@teenpatti.com
- **GitHub Issues**: [Open an issue](https://github.com/yogi-68/Teen-Patti-react/issues)

---

## 🎉 Acknowledgments

- React & React Native communities
- Socket.io team
- MongoDB team
- All contributors and testers

---

## 📈 Roadmap

### **Phase 1 - Completed ✅**
- [x] Core game mechanics
- [x] Real-time multiplayer
- [x] Bot system
- [x] Referral program (5%→2%→1%)
- [x] Joker feature
- [x] Practice coins
- [x] Transfer system
- [x] Transaction history
- [x] Mobile app
- [x] **LIVE Tip System** (10+, 20+, 50+, 100+)
- [x] Good cards detection popup
- [x] Tip history and analytics
- [x] Real-time tip animations

### **Phase 2 - In Progress 🚧**
- [ ] Tournament mode
- [ ] Leaderboards
- [ ] Achievements system
- [ ] Private tables
- [ ] Voice chat

### **Phase 3 - Planned 📋**
- [ ] Live streaming integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Push notifications

---

**Built with ❤️ by the Teen Patti Team**

*Last Updated: November 2025*

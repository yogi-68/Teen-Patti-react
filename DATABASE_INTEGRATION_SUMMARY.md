# Database Integration Summary

## ✅ What's Been Done

### 1. Database Models
- **Updated User Model** (`server/src/models/User.model.ts`)
  - Added `coins` field (100 free, max 100)
  - Added `cashBalance` field (starts at ₹0)
  - Added `totalCashWinnings` field (separate tracking)
  - Added methods: `updateCoins()`, `updateCashBalance()`, `updateGameStats()`

### 2. Repository Layer
- **Updated UserRepository** (`server/src/repositories/UserRepository.ts`)
  - `updateCoins()` - Update practice coins
  - `updateCashBalance()` - Update real money
  - `addCash()` - Add cash with validation (max ₹10,000)
  - `updateGameStats()` - Track wins/losses separately for coins/cash

### 3. Service Layer
- **Created UserService** (`server/src/services/UserService.ts`)
  - `loginUser()` - Login or register
  - `updateCoinsAfterGame()` - Update after coins game
  - `updateCashAfterGame()` - Update after cash game
  - `validateBalance()` - Check sufficient balance before game
  - `addCash()` - Add money to account
  - `getUserStats()` - Get player statistics

### 4. API Routes
- **Created User Routes** (`server/src/routes/userRoutes.ts`)
  - `POST /api/users/login` - Login/register
  - `GET /api/users/:userId` - Get user data
  - `GET /api/users/:userId/stats` - Get statistics
  - `POST /api/users/:userId/cash/add` - Add cash (max ₹10,000)
  - `POST /api/users/:userId/coins/update` - Update coins
  - `POST /api/users/:userId/cash/update` - Update cash
  - `GET /api/users/leaderboard/top` - Get top players

### 5. Server Configuration
- **Updated server/src/index.ts**
  - Imported and mounted user routes
  - Database connection on startup
  - Graceful shutdown with database disconnect

## 📋 Quick Start Guide

### Step 1: Setup MongoDB

**Option A: Local (Quick)**
```powershell
# Install MongoDB from https://www.mongodb.com/try/download/community
# Update server/.env
MONGO_URI=mongodb://localhost:27017/teen-patti
```

**Option B: Cloud (Recommended)**
```powershell
# Create free account at https://www.mongodb.com/cloud/atlas
# Get connection string and update server/.env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/teen-patti
```

### Step 2: Install Dependencies (if needed)
```powershell
cd server
npm install mongoose
```

### Step 3: Test the Server
```powershell
cd server
npm run dev
```

Look for:
```
✅ MongoDB connected successfully
📍 Database: teen-patti
```

### Step 4: Test API
```powershell
# Test login
curl -X POST http://localhost:3001/api/users/login -H "Content-Type: application/json" -d "{\"username\":\"player1\"}"

# Test add cash
curl -X POST http://localhost:3001/api/users/USER_ID_HERE/cash/add -H "Content-Type: application/json" -d "{\"amount\":1000}"
```

## 🔗 Frontend Integration

### Update Dashboard Component

```typescript
// Add these functions to Dashboard.tsx

const API_URL = 'http://localhost:3001/api';

// Login user on component mount
useEffect(() => {
  const initUser = async () => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Player1' }) // Get from auth
      });
      const data = await response.json();
      setUserId(data.user._id);
      setCurrentCoins(data.user.coins);
      setCashBalance(data.user.cashBalance);
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };
  initUser();
}, []);

// Update handleAddMoney to save to database
const handleAddMoney = async () => {
  const amount = parseFloat(customAmount);
  
  if (amount <= 0 || amount > 10000) {
    alert('Please enter amount between ₹1 and ₹10,000');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/${userId}/cash/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await response.json();
    
    if (data.user) {
      setCashBalance(data.user.cashBalance);
      alert(data.message);
    }
  } catch (error) {
    console.error('Failed to add cash:', error);
    alert('Failed to add cash');
  }
};

// Update balance after game ends
const updateBalanceAfterGame = async (amount: number, won: boolean) => {
  const endpoint = gameMode === 'coins' ? 'coins' : 'cash';
  
  try {
    const response = await fetch(
      `${API_URL}/users/${userId}/${endpoint}/update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: won ? amount : -amount })
      }
    );
    const data = await response.json();
    
    if (data.user) {
      if (gameMode === 'coins') {
        setCurrentCoins(data.user.coins);
      } else {
        setCashBalance(data.user.cashBalance);
      }
    }
  } catch (error) {
    console.error('Failed to update balance:', error);
  }
};
```

## 📊 Database Structure

```
teen-patti (database)
  └── users (collection)
      ├── _id: ObjectId
      ├── username: "player1"
      ├── email: "player1@example.com"
      ├── coins: 100 (free practice)
      ├── cashBalance: 0 (real money)
      ├── gamesPlayed: 0
      ├── gamesWon: 0
      ├── totalWinnings: 0
      ├── totalCashWinnings: 0
      ├── createdAt: 2025-01-01T00:00:00.000Z
      └── updatedAt: 2025-01-01T00:00:00.000Z
```

## 🔐 Security Notes (TODO)

Current implementation is **NOT production-ready**. Add:
1. **Authentication** - JWT tokens for user sessions
2. **Authorization** - Users can only access their own data
3. **Rate Limiting** - Prevent API abuse
4. **Input Validation** - Sanitize all inputs
5. **HTTPS** - Encrypt data in transit
6. **Payment Gateway** - For real money transactions

## 📁 Files Created/Modified

**Created:**
- `server/src/routes/userRoutes.ts` - API endpoints
- `server/src/services/UserService.ts` - Business logic
- `DATABASE_SETUP_COMPLETE.md` - Detailed setup guide
- `DATABASE_INTEGRATION_SUMMARY.md` - This file

**Modified:**
- `server/src/models/User.model.ts` - Added coins/cash fields
- `server/src/repositories/UserRepository.ts` - Added new methods
- `server/src/index.ts` - Mounted user routes

## 🚀 Next Steps

1. **Setup MongoDB** (see DATABASE_SETUP_COMPLETE.md)
2. **Test Server** - Run and verify connection
3. **Update Frontend** - Integrate API calls
4. **Test Flow** - Login → Add Cash → Play Game → Update Balance
5. **Add Authentication** - Secure user sessions
6. **Payment Integration** - Real money deposits/withdrawals
7. **Deploy** - Production deployment

## 📖 Documentation

- Full setup guide: `DATABASE_SETUP_COMPLETE.md`
- MongoDB setup: `server/MONGODB_SETUP.md`
- Mongoose guide: `server/MONGOOSE_GUIDE.md`

## ✨ Features Ready

✅ User registration/login
✅ Separate coins and cash tracking
✅ Balance updates after games
✅ Cash addition (max ₹10,000)
✅ Game statistics tracking
✅ Leaderboard support
✅ Database persistence
✅ RESTful API endpoints

## ⚠️ Important

**Database is OPTIONAL for development:**
- Server will run without MongoDB
- Data won't persist between restarts
- Good for testing game logic
- Production REQUIRES database

**To enable database:**
- Set MONGO_URI in server/.env
- Server will auto-connect on startup

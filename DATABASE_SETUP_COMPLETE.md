# Database Setup Guide

## Overview
The Teen Patti game now stores user data in MongoDB, including:
- User profiles (username, email)
- Coins balance (100 free, non-refillable)
- Cash balance (real money, starts at ₹0)
- Game statistics (games played, won, total winnings)

## Database Schema

### User Model
```typescript
{
  username: string (required, unique)
  email: string (optional, unique)
  coins: number (default: 100, max: 100)
  cashBalance: number (default: 0)
  avatar: string (optional)
  gamesPlayed: number (default: 0)
  gamesWon: number (default: 0)
  totalWinnings: number (default: 0)
  totalCashWinnings: number (default: 0)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

## Setup Options

### Option 1: Local MongoDB (Development)

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Windows: Run the installer and follow the setup wizard
   - Install as a Windows Service (recommended)

2. **Verify Installation**
   ```powershell
   mongo --version
   # or
   mongod --version
   ```

3. **Start MongoDB**
   - If installed as service, it starts automatically
   - Manual start: `mongod --dbpath C:\data\db`

4. **Update .env file**
   ```bash
   MONGO_URI=mongodb://localhost:27017/teen-patti
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (Free tier includes 512MB storage)

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select a cloud provider and region (closest to you)
   - Name your cluster (e.g., "teen-patti-cluster")

3. **Setup Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Create username and password (save these!)
   - Set privileges to "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific server IP

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `teen-patti`

6. **Update .env file**
   ```bash
   MONGO_URI=mongodb+srv://username:TeenPatti123@cluster.mongodb.net/teen-patti?retryWrites=true&w=majority
   ```

## Testing the Connection

1. **Start the server**
   ```powershell
   cd server
   npm run dev
   ```

2. **Check console output**
   - You should see: `✅ MongoDB connected successfully`
   - And: `📍 Database: teen-patti`

3. **Test API endpoints**
   ```powershell
   # Check server status
   curl http://localhost:3001/api/status

   # Login/create user
   curl -X POST http://localhost:3001/api/users/login -H "Content-Type: application/json" -d "{\"username\":\"testuser\"}"
   ```

## API Endpoints

### User Management

**POST /api/users/login**
- Login or create user
- Body: `{ username: string, email?: string }`
- Returns: `{ user: IUser, message: string }`

**GET /api/users/:userId**
- Get user by ID
- Returns: `{ user: IUser }`

**GET /api/users/:userId/stats**
- Get user statistics
- Returns: `{ stats: UserStats }`

### Balance Management

**POST /api/users/:userId/cash/add**
- Add cash to user balance (max ₹10,000 per transaction)
- Body: `{ amount: number }`
- Returns: `{ user: IUser, message: string }`

**POST /api/users/:userId/coins/update**
- Update coins (for game wins/losses)
- Body: `{ amount: number }` (positive or negative)
- Returns: `{ user: IUser }`

**POST /api/users/:userId/cash/update**
- Update cash balance (for game wins/losses)
- Body: `{ amount: number }` (positive or negative)
- Returns: `{ user: IUser }`

### Leaderboard

**GET /api/users/leaderboard/top**
- Get top players by total winnings
- Query: `?limit=10` (optional, default: 10)
- Returns: `{ players: IUser[] }`

## Frontend Integration

Update your frontend to use the database:

1. **Login on app start**
   ```typescript
   const loginUser = async (username: string) => {
     const response = await fetch('http://localhost:3001/api/users/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ username })
     });
     const data = await response.json();
     return data.user;
   };
   ```

2. **Add cash**
   ```typescript
   const addCash = async (userId: string, amount: number) => {
     const response = await fetch(`http://localhost:3001/api/users/${userId}/cash/add`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ amount })
     });
     return await response.json();
   };
   ```

3. **Update after game**
   ```typescript
   const updateBalanceAfterGame = async (
     userId: string, 
     amount: number, 
     gameMode: 'coins' | 'cash'
   ) => {
     const endpoint = gameMode === 'coins' ? 'coins' : 'cash';
     const response = await fetch(
       `http://localhost:3001/api/users/${userId}/${endpoint}/update`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount })
       }
     );
     return await response.json();
   };
   ```

## Troubleshooting

### Connection Failed
- **Local MongoDB**: Make sure MongoDB service is running
- **Atlas**: Check network access whitelist includes your IP
- **Both**: Verify connection string is correct in .env file

### Authentication Failed (Atlas)
- Double-check username and password
- Make sure password doesn't contain special characters that need URL encoding
- User must have "Read and write" privileges

### Server Crashes on Start
- MongoDB URI is invalid
- Database access credentials are wrong
- Network/firewall blocking connection

### Data Not Persisting
- Check MongoDB connection logs in console
- Verify user was created successfully (check _id in response)
- Use MongoDB Compass to view database directly

## MongoDB Compass (GUI Tool)

Download MongoDB Compass to view and manage your database:
- https://www.mongodb.com/try/download/compass
- Connect using same URI from your .env file
- View collections, documents, and run queries

## Production Checklist

- [ ] Use MongoDB Atlas (not local MongoDB)
- [ ] Set strong database password
- [ ] Whitelist only production server IPs
- [ ] Enable MongoDB backup (Atlas Pro tier)
- [ ] Set up monitoring alerts
- [ ] Use environment variables (never commit .env)
- [ ] Enable authentication on all endpoints
- [ ] Rate limit API requests
- [ ] Encrypt sensitive data

## Next Steps

1. Set up MongoDB (local or Atlas)
2. Configure .env file with connection string
3. Test server connection
4. Integrate frontend with API endpoints
5. Test user login and balance updates
6. Add authentication (JWT) for security
7. Set up payment gateway integration

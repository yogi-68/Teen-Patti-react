# 🚀 Quick Start Guide - Teen Patti React

## Step 1: Install Dependencies

### Server Dependencies
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\server
npm install
```

### Client Dependencies
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\client
npm install
```

## Step 2: Verify Environment Files

Both `.env` files are already created! Verify they exist:

**Server:** `teen-patti-react/server/.env`
**Client:** `teen-patti-react/client/.env`

## Step 3: Start Development Servers

### Terminal 1 - Backend Server
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║   🎮 Teen Patti Server Running! 🎮   ║
╠═══════════════════════════════════════╣
║  Port:        3001                    ║
║  Environment: development             ║
║  Client URL:  http://localhost:5173   ║
╚═══════════════════════════════════════╝
```

### Terminal 2 - React Frontend
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\client
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open in Browser

Navigate to: **http://localhost:5173**

## 📁 What's Been Created

### ✅ Server (Backend)
```
server/
├── src/
│   ├── index.ts                    ✅ Main server file
│   ├── models/
│   │   ├── Card.ts                 ✅ Card model with ranks & types
│   │   ├── Deck.ts                 ✅ 52-card deck with shuffle
│   │   ├── Player.ts               ✅ Player with chips & cards
│   │   └── Table.ts                ✅ Game table management
│   ├── services/
│   │   ├── CardComparer.ts         ✅ Hand ranking & comparison
│   │   └── GameService.ts          ✅ Game logic (bet, fold, show)
│   └── socket/
│       └── SocketHandler.ts        ✅ Real-time communication
├── package.json                    ✅ Dependencies configured
├── tsconfig.json                   ✅ TypeScript config
└── .env                            ✅ Environment variables
```

### ✅ Client (Frontend - Partial)
```
client/
├── src/
│   ├── types/
│   │   └── game.types.ts           ✅ TypeScript interfaces
│   ├── utils/
│   │   └── socket.ts               ✅ Socket.IO client
│   ├── store/
│   │   └── gameStore.ts            ✅ Zustand state management
│   ├── hooks/
│   │   └── useSocket.ts            ✅ Socket hook
│   ├── components/                 ⏳ (Next step)
│   ├── App.tsx                     ⏳ (Need to create)
│   └── main.tsx                    ⏳ (Need to create)
├── package.json                    ✅ Dependencies configured
├── tsconfig.json                   ✅ TypeScript config
└── .env                            ✅ Environment variables
```

## 🎯 Next Steps

### Immediate (Required for app to work)
1. ✅ Install dependencies (npm install in both folders)
2. ⏳ Create React components:
   - `App.tsx` - Main application
   - `Lobby.tsx` - Join game interface
   - `GameTable.tsx` - Main game UI
   - `PlayerCard.tsx` - Player display
   - `PlayingCard.tsx` - Card component
   - `BettingPanel.tsx` - Bet controls
   - `Timer.tsx` - Countdown timer

### Optional (Enhancements)
3. Add CSS styling
4. Add animations
5. Add sound effects
6. Mobile responsive design

## 🔍 Troubleshooting

### TypeScript Errors in VS Code
**Normal!** Install dependencies first:
```powershell
cd server
npm install

cd ../client
npm install
```

### Port Already in Use
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process by PID
taskkill /PID <process_id> /F
```

### Cannot Connect to MongoDB
The server will run without MongoDB for now. To use MongoDB:
1. Install MongoDB locally OR
2. Use MongoDB Atlas (cloud)
3. Update `MONGODB_URI` in server/.env

## 📞 What to Ask Me Next

You can ask me to:

1. **"Create the React components"** - I'll build all the UI components
2. **"Add styling to the game"** - I'll create CSS for a beautiful UI
3. **"Set up MongoDB"** - I'll add database integration
4. **"Add user authentication"** - I'll implement login/signup
5. **"Deploy the app"** - I'll help deploy to production

## 🎮 Game Features Implemented

✅ **Core Game Logic**
- Full deck implementation
- Hand rankings (Trail, Straight Flush, Flush, Straight, Pair, High Card)
- Winner determination
- Blind/Chaal betting
- Turn timer (20 seconds)
- Auto-bet on timeout
- Side show
- Fold
- Show

✅ **Real-time Features**
- Socket.IO bidirectional communication
- Live game updates
- Player actions broadcast
- Turn timer synchronization

✅ **Game Mechanics**
- 2-6 players
- Boot amount collection
- Dynamic minimum bet calculation
- Pot management
- Game state machine

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Server Setup | ✅ Complete | All backend files created |
| Game Logic | ✅ Complete | Full Teen Patti rules implemented |
| Socket.IO | ✅ Complete | Real-time communication ready |
| Client Setup | ✅ Complete | Project structure ready |
| React Components | ⏳ Pending | Next step! |
| Styling | ⏳ Pending | After components |
| Database | ⏳ Optional | Can add later |
| Auth | ⏳ Optional | Can add later |

---

**Ready to continue? Just say:**
- "Install the dependencies" 
- "Create the React components"
- "I need help with [specific part]"

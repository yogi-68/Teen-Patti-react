# 🎮 Teen Patti React - Quick Reference

## 🚀 Quick Start

```powershell
# Start Backend (Terminal 1)
cd server
npm run dev

# Start Frontend (Terminal 2)
cd client
npm run dev
```

**URLs:**
- Frontend: http://localhost:5174
- Backend: http://localhost:3001

---

## 📂 Project Structure

```
teen-patti-react/
├── server/               # Backend (TypeScript + Express + Socket.IO)
│   ├── src/
│   │   ├── models/      # Card, Deck, Player, Table
│   │   ├── services/    # GameService, CardComparer
│   │   └── socket/      # SocketHandler
│   └── package.json
│
└── client/              # Frontend (React + TypeScript + Vite)
    ├── src/
    │   ├── components/  # UI Components
    │   │   ├── GameMenu.tsx       ⭐ NEW
    │   │   ├── TableInfo.tsx      ⭐ NEW
    │   │   ├── Lobby.tsx
    │   │   ├── GameTable.tsx
    │   │   ├── PlayerCard.tsx
    │   │   ├── PlayingCard.tsx
    │   │   ├── BettingPanel.tsx
    │   │   └── Timer.tsx
    │   ├── store/       # Zustand state management
    │   ├── types/       # TypeScript types
    │   └── utils/       # Socket utilities
    └── package.json
```

---

## 🎯 New Components (Latest Update)

### 1. GameMenu Component
**File:** `client/src/components/GameMenu.tsx`

**Props:**
```typescript
interface GameMenuProps {
  onPlayTable: () => void;
}
```

**Features:**
- Player profile display
- 4 menu options (View Lobby, Play Tournament, Play Table, Play Private)
- Animated gradient cards
- Responsive design

---

### 2. TableInfo Component
**File:** `client/src/components/TableInfo.tsx`

**Props:**
```typescript
interface TableInfoProps {
  table: TableState;
}
```

**Displays:**
- Boot Amount
- Min/Max Bet
- Current Pot (highlighted)
- Round Number

---

## 🎨 CSS Files (New)

1. **GameMenu.css** - Menu screen styling with animations
2. **TableInfo.css** - Table info card styling
3. **GameTable.css** - Enhanced game table styles

---

## 🔄 Screen Flow

```
┌─────────────┐
│ Game Menu   │ ← Start here
└──────┬──────┘
       │ Click "View Lobby" or "Play Table"
       ↓
┌─────────────┐
│   Lobby     │ ← Enter username, select boot
└──────┬──────┘
       │ Join Table
       ↓
┌─────────────┐
│ Game Table  │ ← Play game
└─────────────┘
```

---

## 🎮 Game Rules

### Hand Rankings (Highest to Lowest)
1. **Trail (Three of a Kind)** - AAA, KKK, etc.
2. **Straight Flush** - Consecutive same suit
3. **Flush** - Same suit
4. **Straight** - Consecutive cards
5. **Pair** - Two same rank
6. **High Card** - Highest card

### Actions
- **Blind Bet:** Bet without seeing cards (1x boot)
- **Chaal (Play):** Bet after seeing cards (2x blind)
- **Fold:** Give up hand
- **Show:** Compare cards (only 2 players left)
- **Side Show:** Request to see another player's cards

### Timing
- 20 seconds per turn
- Auto-bet minimum if time expires

---

## 🛠️ Development Commands

### Backend
```powershell
cd server
npm install        # Install dependencies
npm run dev        # Start dev server (port 3001)
npm run build      # Build TypeScript
npm start          # Run production build
```

### Frontend
```powershell
cd client
npm install        # Install dependencies
npm run dev        # Start dev server (port 5174)
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🔧 Configuration

### Environment Variables

**Server** (`server/.env`):
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/teenpatti
NODE_ENV=development
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## 🎨 Styling Guide

### CSS Variables (Customize in `client/src/index.css`)
```css
--primary-color: #667eea      /* Purple Blue */
--secondary-color: #10b981    /* Green */
--warning-color: #f59e0b      /* Amber */
--danger-color: #ef4444       /* Red */
--bg-primary: #0f3460         /* Dark Blue */
--bg-secondary: #16213e       /* Darker Blue */
```

### Animation Classes
- `.fade-in-down` - Top entrance
- `.fade-in-up` - Bottom entrance
- `.bounce` - Bounce effect
- `.pulse` - Pulse attention

---

## 📡 Socket Events

### Client → Server
```typescript
socket.emit('joinTable', { userName, bootAmount });
socket.emit('startGame', { tableId });
socket.emit('bet', { amount, isBlind });
socket.emit('fold');
socket.emit('show');
socket.emit('sideShow', { targetPlayerId });
```

### Server → Client
```typescript
socket.on('tableState', (state: TableState));
socket.on('turnTimer', ({ playerId, timeLeft }));
socket.on('gameOver', (winnerData));
socket.on('playerBet', ({ playerId, amount, isBlind }));
socket.on('playerFolded', ({ playerId }));
```

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Frontend (change port in vite.config.ts)
# Or kill process on port 5174
netstat -ano | findstr :5174
taskkill /PID <PID> /F
```

### TypeScript Errors
```powershell
# Client
cd client
npm run build    # Check for errors
```

### Socket Connection Issues
1. Check if server is running on port 3001
2. Verify CORS settings in `server/src/index.ts`
3. Check browser console for errors

---

## 📚 Key Files to Know

### Backend Core
- `server/src/index.ts` - Main server entry
- `server/src/socket/SocketHandler.ts` - All game logic
- `server/src/services/GameService.ts` - Game rules
- `server/src/services/CardComparer.ts` - Hand comparison

### Frontend Core
- `client/src/App.tsx` - Main app & routing
- `client/src/store/gameStore.ts` - Global state
- `client/src/utils/socket.ts` - Socket connection
- `client/src/components/GameTable.tsx` - Main game UI

---

## 🎯 Testing Multiplayer

1. Open http://localhost:5174 in **multiple browser tabs**
2. In each tab:
   - Enter different username
   - Select same boot amount
   - Join table
3. Start game when 2+ players joined
4. Take turns betting/folding

---

## 🚀 Deployment

### Backend (Node.js hosting)
- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables
- Update CORS origins

### Frontend (Static hosting)
- Build: `npm run build`
- Deploy `dist/` folder to:
  - Vercel
  - Netlify
  - GitHub Pages

### Update URLs
- Change `VITE_API_URL` and `VITE_SOCKET_URL` in client
- Update CORS origins in server

---

## 📊 Performance Tips

1. **Use React DevTools** - Check component re-renders
2. **Monitor Socket Events** - Use Chrome DevTools Network tab
3. **Check Bundle Size** - Run `npm run build` and check size
4. **Lighthouse Score** - Test with Chrome Lighthouse

---

## 🎉 Features Checklist

### ✅ Completed
- [x] Game Menu screen
- [x] Lobby system
- [x] Game table UI
- [x] Table information display
- [x] Player cards display
- [x] Betting panel with slider
- [x] Turn timer (20 seconds)
- [x] Auto-bet on timeout
- [x] Winner celebration
- [x] Last action display
- [x] Fold functionality
- [x] Show cards (2 players)
- [x] Responsive design
- [x] Real-time multiplayer

### 📋 Optional Enhancements
- [ ] Side show accept/deny UI
- [ ] Player avatars
- [ ] Chat system
- [ ] Sound effects
- [ ] Game history
- [ ] Statistics dashboard
- [ ] Tournament mode
- [ ] Private rooms
- [ ] Achievements

---

## 📞 Support

**Documentation:**
- `README.md` - Complete project overview
- `FEATURES_ADDED.md` - Latest features summary
- `SETUP_GUIDE.md` - Detailed setup instructions
- `ARCHITECTURE.md` - System architecture

**Need Help?**
- Check browser console for errors
- Review server logs
- Verify all dependencies installed
- Ensure both servers are running

---

## 🏆 Credits

**Original Project:** Teen Patti (Angular.js 2014)  
**Modern Version:** Teen Patti React (2024)  
**Tech Stack:** React 18 + TypeScript + Socket.IO 4 + Express

---

*Happy Gaming! 🎴🎲*

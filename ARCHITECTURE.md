# 🏗️ Teen Patti Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                     http://localhost:5173                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   React Components                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │  Lobby   │  │GameTable │  │  Player  │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │   Card   │  │  Betting │  │  Timer   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │              Zustand State Store                        │   │
│  │  • tableState  • myPlayerId  • connected               │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │           Socket.IO Client (useSocket hook)             │   │
│  │  • joinTable  • bet  • fold  • show  • seeCards       │   │
│  └───────────────────────┬─────────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ WebSocket Connection
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        SERVER (Node.js)                          │
│                     http://localhost:3001                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Express Server                         │   │
│  │  • /health  • /api/status  • CORS  • Helmet            │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │              Socket.IO Server                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         SocketHandler                            │  │   │
│  │  │  • on('joinTable')  • on('startGame')           │  │   │
│  │  │  • on('bet')        • on('fold')                │  │   │
│  │  │  • on('show')       • on('sideShow')            │  │   │
│  │  │  • Turn Timer (20s) • Auto-bet                  │  │   │
│  │  └────────────────┬─────────────────────────────────┘  │   │
│  └───────────────────┼─────────────────────────────────────┘   │
│                      │                                           │
│  ┌───────────────────▼─────────────────────────────────────┐   │
│  │                 GameService                             │   │
│  │  • handleBet()  • handleFold()  • handleShow()         │   │
│  │  • startGame()  • getMinimumBet()                      │   │
│  └───────────────────┬─────────────────────────────────────┘   │
│                      │                                           │
│  ┌───────────────────▼─────────────────────────────────────┐   │
│  │                    Models                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │  Table   │  │  Player  │  │   Deck   │             │   │
│  │  │  • pot   │  │  • chips │  │  • cards │             │   │
│  │  │  • turn  │  │  • bet   │  │  • shuffle│            │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐                                          │   │
│  │  │   Card   │                                          │   │
│  │  │  • rank  │                                          │   │
│  │  │  • type  │                                          │   │
│  │  └──────────┘                                          │   │
│  └───────────────────┬─────────────────────────────────────┘   │
│                      │                                           │
│  ┌───────────────────▼─────────────────────────────────────┐   │
│  │              CardComparer                               │   │
│  │  • evaluateHand()  • compareHands()                     │   │
│  │  • findWinner()                                         │   │
│  │  • Hand Rankings: Trail, Straight Flush, Flush, etc.   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                           │
                           │ (Optional)
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    MongoDB Database                              │
│                  mongodb://localhost:27017                       │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                     │
│  • users      (userName, chips, games played)                   │
│  • games      (game history, winners, pots)                     │
│  • tables     (active tables, current state)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Player Joins Game
```
React Component (Lobby)
    ↓
  emit('joinTable', { tableId, playerInfo })
    ↓
SocketHandler.handleJoinTable()
    ↓
GameService.joinTable()
    ↓
Table.addPlayer()
    ↓
  emit('joinedTable', { success, playerId })
    ↓
Zustand Store (setMyPlayerId)
    ↓
React Component (re-render)
```

### 2. Player Makes Bet
```
React Component (BettingPanel)
    ↓
  emit('bet', { tableId, playerId, amount })
    ↓
SocketHandler.handleBet()
    ↓
GameService.handleBet()
    ↓
Player.makeBet() & Table.nextTurn()
    ↓
  broadcast('tableUpdate', tableState)
    ↓
Zustand Store (setTableState)
    ↓
React Component (all players re-render)
```

### 3. Turn Timer Countdown
```
SocketHandler.startTurnTimer()
    ↓
setInterval (every 1 second)
    ↓
  emit('turnTimer', { playerId, timeLeft })
    ↓
React Component (Timer)
    ↓
Display countdown (20...19...18...)
    ↓
If timeout (0 seconds)
    ↓
Auto-bet minimum amount
```

### 4. Determine Winner
```
React Component (GameTable)
    ↓
  emit('show', { tableId, playerId })
    ↓
SocketHandler.handleShow()
    ↓
GameService.handleShow()
    ↓
CardComparer.findWinner()
    ↓
CardComparer.evaluateHand() for each player
    ↓
Compare hand rankings
    ↓
Winner.chips += pot
    ↓
  broadcast('gameOver', { winner, results })
    ↓
React Component (display winner)
```

## Component Hierarchy

```
App
├── Lobby (Join/Create Game)
│   ├── UserInput (Name, Chips)
│   └── TableList (Available Tables)
│
└── GameTable (Main Game)
    ├── TableInfo (Pot, Round)
    │
    ├── PlayerCards[] (6 max)
    │   ├── PlayerInfo (Name, Chips)
    │   ├── Cards (3 cards)
    │   ├── BetAmount
    │   └── Timer (if player's turn)
    │
    ├── CenterPot (Total Pot Display)
    │
    ├── MyHand (Your cards - highlighted)
    │   ├── Card (x3)
    │   └── SeeCardsButton
    │
    └── BettingPanel (Your controls)
        ├── BetSlider (Amount)
        ├── ActionButtons
        │   ├── Bet
        │   ├── Fold
        │   ├── Show
        │   └── SideShow
        └── ChipDisplay (Your chips)
```

## Socket.IO Events Flow

### Client → Server
```typescript
socket.emit('joinTable', { tableId, playerInfo })
socket.emit('startGame', { tableId })
socket.emit('seeCards', { tableId, playerId })
socket.emit('bet', { tableId, playerId, amount })
socket.emit('fold', { tableId, playerId })
socket.emit('sideShow', { tableId, playerId, targetPlayerId })
socket.emit('show', { tableId, playerId })
socket.emit('currentBetUpdate', { playerId, amount })
```

### Server → Client
```typescript
socket.emit('joinedTable', { success, playerId })
socket.broadcast.emit('tableUpdate', tableState)
socket.emit('gameStarted', tableState)
socket.emit('playerBet', { playerId, amount, isBlind })
socket.emit('playerFolded', { playerId })
socket.emit('turnTimer', { playerId, timeLeft })
socket.emit('gameOver', { winner, results, reason })
socket.emit('cardsVisible', tableState)
socket.emit('playerSawCards', { playerId })
socket.emit('sideShowResult', { playerId, targetPlayerId, loser })
socket.emit('requestCurrentBet', { playerId })
```

## Technology Stack

### Frontend
```
React 18.3.1
  ├── TypeScript 5.6.2
  ├── Vite 5.4.8 (Build Tool)
  ├── Zustand 5.0.0 (State)
  ├── Socket.IO Client 4.7.5
  └── React Router 6.26.2
```

### Backend
```
Node.js 18+
  ├── Express 4.19.2
  ├── TypeScript 5.6.2
  ├── Socket.IO 4.7.5
  ├── MongoDB 6.9.0 (optional)
  ├── Helmet 7.1.0 (Security)
  └── CORS 2.8.5
```

## State Management

### Client State (Zustand)
```typescript
{
  tableState: {
    id: number
    config: { bootAmount, minBet, maxBet, maxPlayers }
    players: Player[]
    pot: number
    currentTurn: string
    gameState: 'waiting' | 'betting' | 'showdown'
    lastBet: number
    lastBlind: boolean
  },
  myPlayerId: string,
  connected: boolean
}
```

### Server State (In-Memory)
```typescript
{
  tables: Map<tableId, Table>
  turnTimers: Map<playerId, Timeout>
  turnCountdowns: Map<playerId, Interval>
  playerCurrentBets: Map<playerId, amount>
}
```

## File Structure

```
teen-patti-react/
├── server/
│   ├── src/
│   │   ├── index.ts              ← Entry point
│   │   ├── models/
│   │   │   ├── Card.ts           ← Card model
│   │   │   ├── Deck.ts           ← Deck model
│   │   │   ├── Player.ts         ← Player model
│   │   │   └── Table.ts          ← Table model
│   │   ├── services/
│   │   │   ├── CardComparer.ts   ← Hand ranking
│   │   │   └── GameService.ts    ← Game logic
│   │   └── socket/
│   │       └── SocketHandler.ts  ← Socket events
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── client/
│   ├── src/
│   │   ├── components/           ← React components
│   │   ├── hooks/
│   │   │   └── useSocket.ts      ← Socket hook
│   │   ├── store/
│   │   │   └── gameStore.ts      ← Zustand store
│   │   ├── types/
│   │   │   └── game.types.ts     ← TypeScript types
│   │   ├── utils/
│   │   │   └── socket.ts         ← Socket client
│   │   ├── App.tsx               ← Main app
│   │   └── main.tsx              ← Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── shared/                       ← Shared types (future)
```

---

**This architecture ensures:**
- ✅ Real-time synchronization
- ✅ Type safety
- ✅ Scalability
- ✅ Maintainability
- ✅ Security
- ✅ Performance

# 📂 Project Structure Overview

## Client Components Organization

```
client/src/components/
├── 🔐 auth/
│   ├── Auth.tsx             # Login & Registration
│   ├── Auth.css
│   └── index.ts             # Barrel export
│
├── 📄 pages/
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Dashboard.css
│   ├── ProfilePage.tsx      # User profile
│   ├── ProfilePage.css
│   ├── GamePage.tsx         # Game page (coming soon)
│   ├── GamePage.css
│   ├── LeaderboardPage.tsx  # Leaderboard (coming soon)
│   ├── LeaderboardPage.css
│   └── index.ts             # Barrel export
│
├── 🎮 game/
│   ├── GameTable.tsx        # Main game table
│   ├── GameTable.css
│   ├── BettingPanel.tsx     # Betting controls
│   ├── BettingPanel.css
│   ├── PlayerCard.tsx       # Player info display
│   ├── PlayerCard.css
│   ├── PlayingCard.tsx      # Card component
│   ├── PlayingCard.css
│   ├── TableInfo.tsx        # Table information
│   ├── TableInfo.css
│   ├── Timer.tsx            # Game timer
│   ├── Timer.css
│   ├── GameMenu.tsx         # Game menu
│   ├── GameMenu.css
│   └── index.ts             # Barrel export
│
├── 🧭 layout/
│   ├── Navigation.tsx       # Top navigation bar
│   ├── Navigation.css
│   ├── Lobby.tsx            # Game lobby
│   └── index.ts             # Barrel export
│
├── 🔧 common/
│   ├── ProtectedRoute.tsx   # Route guard
│   └── index.ts             # Barrel export
│
└── README.md                # This documentation
```

## Import Path Changes

### Before (Flat Structure)
```typescript
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import GameTable from './components/GameTable';
import PlayerCard from './components/PlayerCard';
import ProtectedRoute from './components/ProtectedRoute';
```

### After (Organized Structure)
```typescript
import Auth from './components/auth/Auth';
import Dashboard from './components/pages/Dashboard';
import Navigation from './components/layout/Navigation';
import GameTable from './components/game/GameTable';
import PlayerCard from './components/game/PlayerCard';
import ProtectedRoute from './components/common/ProtectedRoute';
```

### Or Using Index Exports (Recommended)
```typescript
import { Auth } from './components/auth';
import { Dashboard, ProfilePage } from './components/pages';
import { Navigation, Lobby } from './components/layout';
import { GameTable, PlayerCard, BettingPanel } from './components/game';
import { ProtectedRoute } from './components/common';
```

## 🎯 Benefits

### 1. **Better Organization**
- Components grouped by purpose
- Easy to find related files
- Clear separation of concerns

### 2. **Scalability**
- Add new auth components → `/auth` folder
- Add new pages → `/pages` folder
- Add new game features → `/game` folder

### 3. **Team Collaboration**
- Clear ownership boundaries
- Less merge conflicts
- Easier code reviews

### 4. **Maintenance**
- Related files stay together
- CSS next to component
- Easy to refactor

### 5. **Performance**
- Better code splitting
- Lazy loading by folder
- Smaller bundle sizes

## 📝 Folder Descriptions

| Folder | Purpose | Contains |
|--------|---------|----------|
| `/auth` | Authentication | Login, Register, Password Reset |
| `/pages` | Top-level routes | Dashboard, Profile, Game, Leaderboard |
| `/game` | Game UI | Table, Cards, Betting, Timer |
| `/layout` | App structure | Navigation, Lobby, Sidebar |
| `/common` | Reusable utils | ProtectedRoute, HOCs, Wrappers |

## 🚀 Next Steps

Consider organizing other directories:
- `hooks/` - Custom React hooks
- `store/` - State management (Zustand)
- `types/` - TypeScript types
- `utils/` - Helper functions
- `assets/` - Images, fonts, icons

Each could have their own folder structure as the project grows!

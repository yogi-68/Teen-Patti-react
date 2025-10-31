# Components Folder Structure

The components are now organized into logical folders for better maintainability:

## 📁 Folder Organization

### `/auth`
Authentication-related components
- `Auth.tsx` - Login and registration forms
- `Auth.css` - Authentication styling

### `/pages`
Top-level page components
- `Dashboard.tsx` - Main dashboard page
- `ProfilePage.tsx` - User profile page
- `GamePage.tsx` - Game page (coming soon)
- `LeaderboardPage.tsx` - Leaderboard page (coming soon)

### `/game`
Game-specific UI components
- `GameTable.tsx` - Main game table component
- `BettingPanel.tsx` - Betting controls
- `PlayerCard.tsx` - Player information card
- `PlayingCard.tsx` - Card display component
- `TableInfo.tsx` - Table information display
- `Timer.tsx` - Game timer component
- `GameMenu.tsx` - Game menu controls

### `/layout`
Layout and navigation components
- `Navigation.tsx` - Top navigation bar
- `Lobby.tsx` - Game lobby component

### `/common`
Reusable utility components
- `ProtectedRoute.tsx` - Route protection wrapper

## 📦 Import Examples

```typescript
// Before (flat structure)
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import GameTable from './components/GameTable';

// After (organized structure)
import Auth from './components/auth/Auth';
import Dashboard from './components/pages/Dashboard';
import GameTable from './components/game/GameTable';

// Or using index exports (cleaner)
import { Auth } from './components/auth';
import { Dashboard } from './components/pages';
import { GameTable } from './components/game';
```

## 🎯 Benefits

1. **Better Organization** - Components grouped by functionality
2. **Easier Navigation** - Find components quickly
3. **Scalability** - Easy to add new components
4. **Clear Separation** - Auth, pages, game logic, layout are distinct
5. **Maintainability** - Related files stay together

## 🔄 Migration Notes

All import paths have been updated across the project:
- `App.tsx` - Updated main imports
- `Dashboard.tsx` - Updated game component imports
- Game components - Updated type imports
- Layout components - Updated store imports

All index.ts files are created for cleaner imports in the future.

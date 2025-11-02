# Dual Currency System - Coins vs Cash

## Overview
The Teen Patti game now features a **Dual Currency System** with two distinct types of play:

1. **🪙 Coins Mode** - Free Play (Practice)
2. **💰 Cash Mode** - Real Money Play

---

## Currency Types

### 🪙 Free Coins
- **Purpose**: Practice and casual play
- **Starting Amount**: 100 coins (for all users)
- **Refillable**: ❌ **NO** - Once depleted, cannot be added back
- **Use Case**: Perfect for beginners to learn the game without risk
- **Minimum to Play**: 10 coins
- **When Depleted**: Switch to Cash Mode to continue playing

### 💵 Cash Balance
- **Purpose**: Real money gameplay
- **Starting Amount**: ₹0
- **Refillable**: ✅ **YES** - Can be added anytime via wallet
- **Use Case**: Serious play with real money stakes
- **Minimum to Play**: ₹10
- **Minimum Deposit**: ₹10
- **Withdrawals**: Contact admin

---

## Game Modes

### Coins Mode (Free Play)
```
🪙 Coins Mode
├─ Start with: 100 coins
├─ Can't refill when empty
├─ Perfect for practice
└─ Zero financial risk
```

**Features:**
- ✅ Play without spending real money
- ✅ Learn game mechanics safely
- ✅ No payment required
- ❌ Can't be refilled once used up
- ❌ Limited to initial 100 coins

**When Coins Run Out:**
- Alert message: "Your free coins have run out! Switch to Cash Mode to continue playing."
- Must switch to Cash Mode to continue

### Cash Mode (Real Money)
```
💰 Cash Mode
├─ Start with: ₹0
├─ Add money anytime
├─ Win real money
└─ Serious gameplay
```

**Features:**
- ✅ Add money anytime via wallet
- ✅ Win real money
- ✅ Unlimited gameplay (with balance)
- ✅ Quick add amounts: ₹50, ₹100, ₹500, ₹1000
- ⚠️ Requires minimum ₹10 to play

**Low Balance Protection:**
- When cash < ₹10: Modal locks until money is added
- Alert message: "You need at least ₹10 to play! Please add money to your wallet."

---

## Wallet Interface

### Balance Display
```
┌─────────────────────────────┐
│  💰 My Wallet               │
├─────────────────────────────┤
│  🪙 Coins Mode | 💰 Cash Mode│ <- Mode Selector
├─────────────────────────────┤
│  Free Coins    Cash Balance │
│  🪙 100        💵 ₹0        │
│  Can't refill  Can be added │
└─────────────────────────────┘
```

### Mode Selector
- **Two Toggle Buttons**:
  - 🪙 Coins Mode (Free Play)
  - 💰 Cash Mode (Real Money)
- Active mode highlighted in gold
- Prevents switching if:
  - Coins Mode: 0 coins remaining
  - Cash Mode: Less than ₹10 cash

### Add Money Section
Only applies to **Cash Balance**:
```
💳 Add Money to Cash Balance
├─ Input: Enter amount (min ₹10)
├─ Quick Amounts:
│  ├─ ₹50
│  ├─ ₹100
│  ├─ ₹500
│  └─ ₹1000
└─ Button: Add Money
```

---

## User Flow

### First Time User
1. **Register/Login** → Get 100 free coins
2. **Choose Mode**: Coins Mode (default)
3. **Play Teen Patti** with free coins
4. **Coins Depleted?** → Switch to Cash Mode
5. **Add Money** via wallet (min ₹10)
6. **Continue Playing** with cash

### Experienced User
1. **Login** → Start with saved balances
2. **Choose Mode**: Cash Mode (direct)
3. **Add Money** if balance < ₹10
4. **Play Teen Patti** with real money

---

## Balance Checks & Alerts

### Before Joining Game
```typescript
// Check current mode balance
if (gameMode === 'coins' && currentCoins < 10) {
  → Alert: "Need 10 coins. Can't refill. Switch to Cash Mode."
}

if (gameMode === 'cash' && cashBalance < 10) {
  → Alert: "Need ₹10. Please add money to wallet."
  → Show locked wallet modal
}
```

### During Gameplay
- **Coins Mode**: Deducts from free coins (can go to 0)
- **Cash Mode**: Deducts from cash balance (blocks at < ₹10)

### After Game
- **Coins Mode**: Wins add to coin balance (but still can't refill if depleted)
- **Cash Mode**: Wins add to cash balance (real money)

---

## Technical Implementation

### State Management
```typescript
const [gameMode, setGameMode] = useState<GameMode>('coins');
const [currentCoins] = useState(100); // Can't be modified
const [cashBalance, setCashBalance] = useState(0); // Can be increased
```

### Key Functions

#### Switch Game Mode
```typescript
handleSwitchMode(mode: 'coins' | 'cash') {
  if (mode === 'coins' && currentCoins === 0) → Block
  if (mode === 'cash' && cashBalance < 10) → Request add money
  setGameMode(mode);
}
```

#### Add Money
```typescript
handleAddMoney() {
  // Only adds to cashBalance
  setCashBalance(cashBalance + amount);
  // Does NOT affect currentCoins
}
```

#### Join Game
```typescript
handleGameSelect() {
  const balance = gameMode === 'coins' ? currentCoins : cashBalance;
  if (balance < 10) → Block & show alert
  
  // Send to server with mode info
  socket.emit('joinTable', {
    chips: balance,
    gameMode: gameMode // Server knows which currency
  });
}
```

---

## CSS Styling

### Mode Selector Buttons
```css
.mode-btn.active {
  background: linear-gradient(135deg, gold, #997a00);
  color: dark;
  box-shadow: 0 4px 8px rgba(195, 171, 28, 0.4);
}
```

### Balance Cards
```css
.balance-card {
  background: rgba(195, 171, 28, 0.1);
  border: 1px solid rgba(195, 171, 28, 0.3);
}

.balance-note {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}
```

---

## Benefits of This System

### For Players
- 🎯 **Risk-Free Learning**: Try game with free coins
- 💪 **Flexible Options**: Choose play style
- 🔒 **Protected Funds**: Clear separation between free/real
- 📊 **Transparent**: Always see both balances

### For Business
- 💰 **Revenue Model**: Players must pay to continue after free coins
- 🎣 **User Acquisition**: Free coins attract new users
- 🔄 **Conversion Funnel**: Natural progression from free to paid
- 📈 **Engagement**: Practice mode increases retention

---

## Future Enhancements

### Planned Features
- [ ] Transaction history for cash
- [ ] Bonus coins on first deposit
- [ ] Referral rewards (both coins & cash)
- [ ] VIP tiers based on cash deposits
- [ ] Daily free coin bonus (small amount)
- [ ] Payment gateway integration
- [ ] Withdrawal system

### Backend Integration
```typescript
// API Endpoints Needed
POST /api/wallet/add-money     // Add cash to wallet
POST /api/wallet/withdraw      // Withdraw cash
GET  /api/wallet/balance       // Get current balances
GET  /api/wallet/transactions  // Transaction history
POST /api/game/join            // Join with mode info
```

---

## Testing Checklist

- [ ] Start with 100 coins in Coins Mode
- [ ] Play until coins < 10 (check alert)
- [ ] Try to join game with < 10 coins (blocked)
- [ ] Switch to Cash Mode with ₹0 (blocked)
- [ ] Add ₹50 to cash balance
- [ ] Switch to Cash Mode successfully
- [ ] Join game with cash balance
- [ ] Check balance deduction after game
- [ ] Try to add money with invalid amount (< ₹10)
- [ ] Test quick amount buttons (₹50-₹1000)
- [ ] Test responsive design on mobile

---

## Developer Notes

### Important Rules
1. **Coins NEVER increase after initial 100**
2. **Cash can ONLY increase via add money**
3. **Minimum balance check BEFORE joining game**
4. **Mode switch validates balance requirements**
5. **Server must track separate balances**

### State Persistence
```typescript
// Local Storage (Client-side)
localStorage.setItem('lastGameMode', gameMode);

// Database (Server-side)
User {
  freeCoins: number;      // Starts 100, decreases only
  cashBalance: number;    // Starts 0, can increase
  lastPlayedMode: string; // 'coins' or 'cash'
}
```

---

## Support & FAQs

**Q: Can I convert coins to cash?**
A: No, they are completely separate currencies.

**Q: What happens when my coins run out?**
A: You must switch to Cash Mode to continue playing.

**Q: Can I buy more coins?**
A: No, coins are free and can't be purchased. Use Cash Mode for continued play.

**Q: Is there a limit on cash deposits?**
A: Minimum ₹10, no maximum (subject to payment gateway limits).

**Q: How do I withdraw my cash winnings?**
A: Contact admin for withdrawal requests.

---

**Last Updated**: October 30, 2025
**Version**: 2.0 (Dual Currency System)

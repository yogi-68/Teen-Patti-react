# Dual Currency System - Trial vs Token

## Overview
The Teen Patti game now features a **Dual Currency System** with two distinct types of play:

1. **🪙 Trial Mode** - Free Play (Practice)
2. **💰 Token Mode** - Real Token Play

---

## Currency Types

### 🪙 Free Trial
- **Purpose**: Practice and casual play
- **Starting Amount**: 100 trial (for all users)
- **Refillable**: ❌ **NO** - Once depleted, cannot be added back
- **Use Case**: Perfect for beginners to learn the game without risk
- **Minimum to Play**: 10 trial
- **When Depleted**: Switch to Token Mode to continue playing

### 💵 Token Balance
- **Purpose**: Real money gameplay
- **Starting Amount**: ₹0
- **Refillable**: ✅ **YES** - Can be added anytime via wallet
- **Use Case**: Serious play with real token stakes
- **Minimum to Play**: ₹10
- **Minimum Deposit**: ₹10
- **Withdrawals**: Contact admin

---

## Game Modes

### Trial Mode (Free Play)
```
🪙 Trial Mode
├─ Start with: 100 trial
├─ Can't refill when empty
├─ Perfect for practice
└─ Zero financial risk
```

**Features:**
- ✅ Play without spending real token
- ✅ Learn game mechanics safely
- ✅ No payment required
- ❌ Can't be refilled once used up
- ❌ Limited to initial 100 trial

**When Trial Run Out:**
- Alert message: "Your free trial have run out! Switch to Token Mode to continue playing."
- Must switch to Token Mode to continue

### Token Mode (Real Token)
```
💰 Token Mode
├─ Start with: ₹0
├─ Add money anytime
├─ Win real token
└─ Serious gameplay
```

**Features:**
- ✅ Add money anytime via wallet
- ✅ Win real token
- ✅ Unlimited gameplay (with balance)
- ✅ Quick add amounts: ₹50, ₹100, ₹500, ₹1000
- ⚠️ Requires minimum ₹10 to play

**Low Balance Protection:**
- When token < ₹10: Modal locks until money is added
- Alert message: "You need at least ₹10 to play! Please add money to your wallet."

---

## Wallet Interface

### Balance Display
```
┌─────────────────────────────┐
│  💰 My Wallet               │
├─────────────────────────────┤
│  🪙 Trial Mode | 💰 Token Mode│ <- Mode Selector
├─────────────────────────────┤
│  Free Trial    Token Balance │
│  🪙 100        💵 ₹0        │
│  Can't refill  Can be added │
└─────────────────────────────┘
```

### Mode Selector
- **Two Toggle Buttons**:
  - 🪙 Trial Mode (Free Play)
  - 💰 Token Mode (Real Token)
- Active mode highlighted in gold
- Prevents switching if:
  - Trial Mode: 0 trial remaining
  - Token Mode: Less than ₹10 cash

### Add Money Section
Only applies to **Token Balance**:
```
💳 Add Money to Token Balance
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
1. **Register/Login** → Get 100 free trial
2. **Choose Mode**: Trial Mode (default)
3. **Play Teen Patti** with free trial
4. **Trial Depleted?** → Switch to Token Mode
5. **Add Money** via wallet (min ₹10)
6. **Continue Playing** with token

### Experienced User
1. **Login** → Start with saved balances
2. **Choose Mode**: Token Mode (direct)
3. **Add Money** if balance < ₹10
4. **Play Teen Patti** with real token

---

## Balance Checks & Alerts

### Before Joining Game
```typescript
// Check current mode balance
if (gameMode === 'trial' && currentTrial < 10) {
  → Alert: "Need 10 trial. Can't refill. Switch to Token Mode."
}

if (gameMode === 'token' && tokenBalance < 10) {
  → Alert: "Need ₹10. Please add money to wallet."
  → Show locked wallet modal
}
```

### During Gameplay
- **Trial Mode**: Deducts from free trial (can go to 0)
- **Token Mode**: Deducts from token balance (blocks at < ₹10)

### After Game
- **Trial Mode**: Wins add to trial balance (but still can't refill if depleted)
- **Token Mode**: Wins add to token balance (real token)

---

## Technical Implementation

### State Management
```typescript
const [gameMode, setGameMode] = useState<GameMode>('trial');
const [currentTrial] = useState(100); // Can't be modified
const [tokenBalance, setTokenBalance] = useState(0); // Can be increased
```

### Key Functions

#### Switch Game Mode
```typescript
handleSwitchMode(mode: 'trial' | 'token') {
  if (mode === 'trial' && currentTrial === 0) → Block
  if (mode === 'token' && tokenBalance < 10) → Request add money
  setGameMode(mode);
}
```

#### Add Money
```typescript
handleAddMoney() {
  // Only adds to tokenBalance
  setTokenBalance(tokenBalance + amount);
  // Does NOT affect currentTrial
}
```

#### Join Game
```typescript
handleGameSelect() {
  const balance = gameMode === 'trial' ? currentTrial : tokenBalance;
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
- 🎯 **Risk-Free Learning**: Try game with free trial
- 💪 **Flexible Options**: Choose play style
- 🔒 **Protected Funds**: Clear separation between free/real
- 📊 **Transparent**: Always see both balances

### For Business
- 💰 **Revenue Model**: Players must pay to continue after free trial
- 🎣 **User Acquisition**: Free trial attract new users
- 🔄 **Conversion Funnel**: Natural progression from free to paid
- 📈 **Engagement**: Practice mode increases retention

---

## Future Enhancements

### Planned Features
- [ ] Transaction history for cash
- [ ] Bonus trial on first deposit
- [ ] Referral rewards (both trial & cash)
- [ ] VIP tiers based on token deposits
- [ ] Daily free trial bonus (small amount)
- [ ] Payment gateway integration
- [ ] Withdrawal system

### Backend Integration
```typescript
// API Endpoints Needed
POST /api/wallet/add-money     // Add token to wallet
POST /api/wallet/withdraw      // Withdraw cash
GET  /api/wallet/balance       // Get current balances
GET  /api/wallet/transactions  // Transaction history
POST /api/game/join            // Join with mode info
```

---

## Testing Checklist

- [ ] Start with 100 trial in Trial Mode
- [ ] Play until trial < 10 (check alert)
- [ ] Try to join game with < 10 trial (blocked)
- [ ] Switch to Token Mode with ₹0 (blocked)
- [ ] Add ₹50 to token balance
- [ ] Switch to Token Mode successfully
- [ ] Join game with token balance
- [ ] Check balance deduction after game
- [ ] Try to add money with invalid amount (< ₹10)
- [ ] Test quick amount buttons (₹50-₹1000)
- [ ] Test responsive design on mobile

---

## Developer Notes

### Important Rules
1. **Trial NEVER increase after initial 100**
2. **Token can ONLY increase via add money**
3. **Minimum balance check BEFORE joining game**
4. **Mode switch validates balance requirements**
5. **Server must track separate balances**

### State Persistence
```typescript
// Local Storage (Client-side)
localStorage.setItem('lastGameMode', gameMode);

// Database (Server-side)
User {
  freeTrial: number;      // Starts 100, decreases only
  tokenBalance: number;    // Starts 0, can increase
  lastPlayedMode: string; // 'trial' or 'token'
}
```

---

## Support & FAQs

**Q: Can I convert trial to cash?**
A: No, they are completely separate currencies.

**Q: What happens when my trial run out?**
A: You must switch to Token Mode to continue playing.

**Q: Can I buy more coins?**
A: No, trial are free and can't be purchased. Use Token Mode for continued play.

**Q: Is there a limit on token deposits?**
A: Minimum ₹10, no maximum (subject to payment gateway limits).

**Q: How do I withdraw my token winnings?**
A: Contact admin for withdrawal requests.

---

**Last Updated**: October 30, 2025
**Version**: 2.0 (Dual Currency System)

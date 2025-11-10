# Dual Currency & Joker Button System

**Status:** 🚧 Implementation In Progress  
**Date:** November 11, 2025

---

## Overview

This document outlines the implementation of two major features:
1. **Dual Currency System** - Practice Coins vs Real Cash Coins
2. **Joker Button** - Premium feature with mini-competition and 30% fee

---

## 💰 Dual Currency System

### Practice Coins (Demo Mode)

**Purpose:** Risk-free learning and testing

**Characteristics:**
- ✅ **Free:** Every new user gets **100 practice coins** on signup
- ❌ **Non-transferable:** Cannot be sent to other players
- ❌ **Non-withdrawable:** Cannot be converted to real cash
- ✅ **Persistent:** Remains available even after making real deposits
- ✅ **Separate Balance:** Never mixed with real coins

**Use Cases:**
- New players learning the game
- Testing strategies without financial risk
- Demo/practice tables only

**Database Schema:**
```typescript
{
  practiceCoins: 100,        // Default for new users
  realCoins: 0,
  hasMadeFirstDeposit: false
}
```

**API Validation:**
```typescript
// Practice coins can ONLY be used in demo tables
if (tableType === 'demo' && coinType === 'practice') {
  // Allow
} else if (tableType === 'cash' && coinType === 'practice') {
  // Reject - practice coins not allowed in cash tables
}
```

---

### Real Cash Coins (Paid Mode)

**Purpose:** Real money gameplay with transfers and withdrawals

**Characteristics:**
- 💵 **Paid:** Comes from actual deposits
- ✅ **Transferable:** Can send to other players
- ✅ **Withdrawable:** Can withdraw to linked payment accounts
- 📊 **Tracked:** All transactions recorded in history
- 🎲 **Cash Tables:** Required for real-money tables

**Activation:**
- First deposit activates real coin features
- `hasMadeFirstDeposit` flag set to `true`
- Enables transfers and withdrawals

**Database Schema:**
```typescript
{
  practiceCoins: 100,        // Still available
  realCoins: 500,            // From deposit
  hasMadeFirstDeposit: true, // Unlocks transfers/withdrawals
  totalDeposited: 500        // Lifetime total (for Joker eligibility)
}
```

**Transaction Types:**
```typescript
// Real coin transactions (all logged)
- DEPOSIT: Add real coins from payment
- TRANSFER_SEND: Send coins to another player
- TRANSFER_RECEIVE: Receive coins from another player
- WITHDRAWAL: Cash out to payment account
- GAME_WIN: Winnings from cash table
- GAME_LOSS: Losses from cash table
- JOKER_FEE: 30% deduction from Joker win
```

---

### Comparison Table

| Feature | Practice Coins | Real Cash Coins |
|---------|---------------|-----------------|
| **Source** | Free (signup) | Paid (deposit) |
| **Initial Amount** | 100 coins | 0 coins (until deposit) |
| **Transfer to Others** | ❌ No | ✅ Yes (after first deposit) |
| **Withdraw** | ❌ No | ✅ Yes (after first deposit) |
| **Used In** | Demo Tables Only | Cash Tables |
| **Transaction Log** | No | Yes (all tracked) |
| **Joker Eligibility** | ❌ No | ✅ Yes (if balance ≥ 500) |

---

## 🃏 Joker Button Feature

### What is Joker?

The **Joker Button** (renamed from "Pro") is a premium feature that:
- Reveals cards to other Joker users
- Creates a mini-competition among Joker users
- Applies a 30% fee on winnings for the top Joker winner

### Visual / UI

**Button Display:**
- Button labeled: **"Joker"** (not "Pro")
- Location: Next to "Show" and "Fold" buttons
- States:
  - **Disabled (gray):** User doesn't qualify
  - **Enabled (gold):** User can activate
  - **Active (glowing):** User has activated Joker

**Card Background:**
- Normal cards: Standard background
- Joker-active cards: **Gold/yellow border** or **glowing effect**
- Visible indicator for all players to see who used Joker

**Tooltip/Help:**
```
🃏 Joker Button
- Reveals your cards to other Joker users
- See other Joker users' cards
- Winner among Joker users pays 30% fee
- Requires: ≥500 coins balance
- One use per game
```

---

### Eligibility Requirements

**Server-Side Validation (Strict):**

1. **Has Made Real Deposit:**
   ```typescript
   user.hasMadeFirstDeposit === true
   ```

2. **Minimum Balance:**
   ```typescript
   user.realCoins >= 500
   ```

3. **Not Demo User:**
   ```typescript
   tableType === 'cash' // No Joker in demo tables
   ```

4. **One Use Per Game:**
   ```typescript
   gameState.jokerUsers.includes(userId) === false
   ```

**Client-Side Display:**
```typescript
const canUseJoker = 
  user.hasMadeFirstDeposit && 
  user.realCoins >= 500 && 
  tableType === 'cash' &&
  !hasUsedJokerThisGame;

<button 
  disabled={!canUseJoker}
  className={canUseJoker ? 'joker-enabled' : 'joker-disabled'}
>
  🃏 Joker
</button>
```

---

### Usage Rules

**Activation:**
- Click "Joker" button during your turn
- Server validates eligibility
- Adds player to `jokerUsers` array in game state
- Changes card background to gold/glowing
- Cannot be undone

**Limitations:**
- ✅ **One use per game** per player
- ❌ Cannot activate multiple times in same hand
- ❌ Cannot cancel after activation
- ✅ Survives across rounds (stays active until game ends)

**Visibility:**
- 👁️ **Joker users see each other's cards**
- 🙈 **Non-Joker users see Joker users' cards as face-down**
- 📊 All players see who activated Joker (visual indicator)

---

### Mini-Competition Logic

**Among Joker Users:**

1. **Automatic Comparison:**
   - System compares all Joker users' hands
   - Uses standard hand ranking (Trail > Straight Flush > etc.)
   - Determines "Joker Group Winner"

2. **Joker Group Winner:**
   - Highest hand among all Joker users
   - Displayed in UI with special badge/icon
   - Only this player pays 30% fee (if they win the table)

3. **Example:**
   ```
   Table: 6 players
   - Player A (Joker): Pair of Kings
   - Player B (Joker): Straight Flush
   - Player C (No Joker): Trail (AAA)
   - Player D (Joker): Flush
   - Player E (No Joker): High Card
   - Player F (No Joker): Pair of 10s
   
   Joker Group Winner: Player B (Straight Flush)
   Table Winner: Player C (Trail)
   
   Result: No fee (Joker user didn't win table)
   ```

---

### Fee Structure (30% Deduction)

**When Fee Applies:**
- Joker user wins the table pot
- Among all Joker users, this winner had highest hand

**Calculation:**
```typescript
// Example: Winner gets 1000 coins
const potAmount = 1000;
const jokerFee = potAmount * 0.30; // 300 coins
const netWinnings = potAmount - jokerFee; // 700 coins

// Update balances
winner.realCoins += netWinnings; // +700
platformRevenue += jokerFee;      // +300 (platform keeps fee)
```

**When Fee Does NOT Apply:**
- Joker user loses
- Non-Joker user wins (no fee for them)
- Multiple Joker users, but lower-hand Joker user wins nothing extra

**Multiple Joker Users Example:**
```
Scenario: 3 Joker users (A, B, C), Winner is Player A

Joker Rankings:
- Player A (Joker): Trail (AAA) - Highest Joker, Wins Table
- Player B (Joker): Straight
- Player C (Joker): Pair

Fee: Player A pays 30% (they are top Joker AND table winner)
Players B & C: No fee (didn't win)
```

---

### Implementation Details

#### Database Schema Changes

**Game/Table State:**
```typescript
interface TableState {
  // ... existing fields
  jokerUsers: string[];           // User IDs who activated Joker
  jokerGroupWinner?: string;      // User ID of highest Joker hand
  jokerFeeApplied: boolean;       // Track if fee was deducted
}
```

**Transaction Log:**
```typescript
{
  type: 'JOKER_FEE',
  userId: 'user123',
  amount: -300,
  description: '30% Joker fee deduction from win',
  gameId: 'game456',
  timestamp: '2025-11-11T...'
}
```

#### Backend API Endpoints

**1. Activate Joker:**
```typescript
POST /api/game/:gameId/joker/activate
Headers: { x-user-id: userId }
Body: {}

Response:
{
  success: true,
  jokerUsers: ['user1', 'user2'],
  message: 'Joker activated'
}

Errors:
- 400: Insufficient balance
- 400: No deposit made
- 400: Already used Joker this game
- 403: Demo table (Joker not allowed)
```

**2. Get Joker Status:**
```typescript
GET /api/game/:gameId/joker/status
Headers: { x-user-id: userId }

Response:
{
  canUseJoker: true,
  hasUsedJoker: false,
  jokerUsers: ['user1', 'user2'],
  jokerGroupWinner: 'user1',
  visibleCards: {
    'user1': [Card, Card, Card],
    'user2': [Card, Card, Card]
  }
}
```

**3. Calculate Joker Winner:**
```typescript
// Internal function called at game end
async function calculateJokerWinner(gameId: string): Promise<void> {
  const jokerUsers = game.jokerUsers;
  
  if (jokerUsers.length === 0) return;
  
  // Compare all Joker users' hands
  const rankings = jokerUsers.map(userId => ({
    userId,
    hand: getPlayerHand(userId),
    rank: evaluateHand(hand)
  }));
  
  // Sort by hand strength
  rankings.sort((a, b) => b.rank - a.rank);
  
  // Top Joker user
  game.jokerGroupWinner = rankings[0].userId;
  
  // If this user wins the table, apply 30% fee
  if (game.winner === game.jokerGroupWinner) {
    applyJokerFee(game.winner, game.pot);
  }
}
```

#### Socket Events

**Joker Activated:**
```typescript
socket.emit('joker:activated', {
  userId: 'user123',
  username: 'Player1',
  tableId: 'table1',
  timestamp: Date.now()
});

// All clients receive
socket.on('joker:activated', (data) => {
  // Update UI to show gold border on user's cards
  updateCardBackground(data.userId, 'gold');
});
```

**Joker Cards Revealed:**
```typescript
// Only sent to Joker users
socket.emit('joker:cards-revealed', {
  jokerUsers: ['user1', 'user2', 'user3'],
  cards: {
    'user1': [Card, Card, Card],
    'user2': [Card, Card, Card],
    'user3': [Card, Card, Card]
  }
});
```

**Joker Winner Declared:**
```typescript
socket.emit('joker:winner', {
  jokerGroupWinner: 'user2',
  winningHand: [Card, Card, Card],
  feeApplied: true,
  feeAmount: 300
});
```

---

### Frontend Implementation

#### Button Component

```typescript
interface JokerButtonProps {
  canUse: boolean;
  hasUsed: boolean;
  onActivate: () => void;
}

const JokerButton: React.FC<JokerButtonProps> = ({ 
  canUse, 
  hasUsed, 
  onActivate 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="joker-button-container">
      <button
        disabled={!canUse || hasUsed}
        onClick={onActivate}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          joker-button 
          ${hasUsed ? 'joker-active' : ''}
          ${canUse && !hasUsed ? 'joker-enabled' : 'joker-disabled'}
        `}
      >
        🃏 Joker
      </button>
      
      {showTooltip && (
        <div className="joker-tooltip">
          {!canUse && (
            <>
              <p>❌ Requirements not met:</p>
              {!user.hasMadeFirstDeposit && <p>• Make a deposit</p>}
              {user.realCoins < 500 && <p>• Need ≥500 coins</p>}
            </>
          )}
          {canUse && !hasUsed && (
            <>
              <p>✅ Joker Ready</p>
              <p>• See other Joker users' cards</p>
              <p>• 30% fee if you win</p>
            </>
          )}
          {hasUsed && <p>🃏 Joker Active</p>}
        </div>
      )}
    </div>
  );
};
```

#### Card Background Styling

```css
/* Normal cards */
.player-card {
  background: white;
  border: 2px solid #ccc;
  transition: all 0.3s ease;
}

/* Joker-active cards */
.player-card.joker-active {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: 3px solid #ff8c00;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  animation: joker-glow 2s ease-in-out infinite;
}

@keyframes joker-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.9); }
}

/* Joker group winner badge */
.joker-winner-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: gold;
  color: #000;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 12px;
  animation: badge-pulse 1s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

### Testing Checklist

#### Practice Coins Testing

- [ ] New user registers → receives 100 practice coins
- [ ] Practice coins work in demo tables
- [ ] Practice coins rejected in cash tables
- [ ] Cannot transfer practice coins to other users
- [ ] Cannot withdraw practice coins
- [ ] Practice coins persist after making deposit

#### Real Coins Testing

- [ ] New user has 0 real coins
- [ ] First deposit sets `hasMadeFirstDeposit = true`
- [ ] Real coins work in cash tables
- [ ] Can transfer real coins (after first deposit)
- [ ] Can withdraw real coins (after first deposit)
- [ ] All real coin transactions logged

#### Joker Button Testing

- [ ] Button disabled for users without deposit
- [ ] Button disabled if balance < 500
- [ ] Button disabled in demo tables
- [ ] Button activates successfully when eligible
- [ ] Card background changes to gold after activation
- [ ] Cannot activate Joker twice in same game
- [ ] Joker users see each other's cards
- [ ] Non-Joker users don't see Joker cards
- [ ] Joker group winner identified correctly
- [ ] 30% fee applied only to top Joker winner
- [ ] Fee transaction logged correctly
- [ ] Multiple Joker users handled properly

---

## Migration Strategy

### Phase 1: Database Update (No Downtime)

1. **Add New Fields:**
   ```typescript
   // Run migration script
   db.users.updateMany(
     {},
     {
       $set: {
         hasMadeFirstDeposit: false,
         totalDeposited: 0,
         canUseJoker: false,
         practiceCoins: 100  // Update existing users
       }
     }
   );
   ```

2. **Update Existing Users:**
   - Users with `realCoins > 0` → set `hasMadeFirstDeposit = true`
   - Recalculate `canUseJoker` based on balance

### Phase 2: Backend Deployment

1. Deploy User model changes
2. Deploy Joker validation endpoints
3. Deploy game logic updates
4. Deploy transaction logging

### Phase 3: Frontend Deployment

1. Deploy dual currency UI
2. Deploy Joker button component
3. Deploy card background styling
4. Deploy transaction history updates

### Phase 4: Testing & Monitoring

1. Test demo vs cash table separation
2. Test Joker activation flow
3. Monitor fee calculations
4. Verify transaction logs
5. Check for edge cases

---

## Security Considerations

### Server-Side Validation (Critical)

**Never trust client:**
```typescript
// ❌ WRONG - Client can fake this
if (clientData.canUseJoker) { ... }

// ✅ CORRECT - Server validates
const user = await User.findById(userId);
if (user.hasMadeFirstDeposit && user.realCoins >= 500) {
  // Allow Joker
}
```

### Transaction Integrity

**Atomic operations:**
```typescript
// Use MongoDB transactions for coin transfers
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from sender
  await User.findByIdAndUpdate(senderId, {
    $inc: { realCoins: -amount }
  }, { session });
  
  // Add to receiver
  await User.findByIdAndUpdate(receiverId, {
    $inc: { realCoins: amount }
  }, { session });
  
  // Log transaction
  await Transaction.create([{
    type: 'TRANSFER',
    from: senderId,
    to: receiverId,
    amount
  }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Rate Limiting

- Limit transfer requests: 10 per minute per user
- Limit withdrawal requests: 5 per hour per user
- Limit Joker activations: 1 per game per user

---

## Files to Create/Modify

### New Files:
1. `server/src/services/JokerService.ts` - Joker logic
2. `server/src/routes/jokerRoutes.ts` - Joker API endpoints
3. `server/src/middleware/validateJoker.ts` - Joker eligibility validation
4. `client/src/components/game/JokerButton.tsx` - UI component
5. `client/src/styles/Joker.css` - Styling

### Modified Files:
1. `server/src/models/User.model.ts` - ✅ Added new fields
2. `server/src/services/GameService.ts` - Add Joker logic
3. `server/src/services/TransactionService.ts` - Add fee tracking
4. `client/src/components/game/GameTable.tsx` - Add Joker button
5. `client/src/components/game/PlayerCard.tsx` - Add gold border

---

## Status: Implementation Progress

- [x] User model updated with new fields
- [x] Documentation completed
- [ ] Joker Service implementation
- [ ] Joker API routes
- [ ] Frontend Joker button component
- [ ] Card styling for Joker users
- [ ] Transaction logging for fees
- [ ] Testing all scenarios
- [ ] Deployment to production

**Next Steps:**
1. Implement JokerService.ts
2. Create Joker API endpoints
3. Build frontend Joker button
4. Add card background animations
5. Test full flow end-to-end

---

**Last Updated:** November 11, 2025  
**Author:** GitHub Copilot  
**Status:** 🚧 In Progress

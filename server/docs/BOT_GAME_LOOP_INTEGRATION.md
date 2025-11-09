# Bot Game Loop Integration

## Overview

The Bot Game Integration system seamlessly integrates bot players into the existing Teen Patti game loop, enabling bots to automatically take their turns without human intervention.

## Architecture

```
Game Loop
    ↓
nextTurn() called
    ↓
Check if current player is bot
    ↓
    ├─ Human Player → Start turn timer (existing behavior)
    │
    └─ Bot Player → Execute bot turn automatically
        ↓
        BotGameIntegration.executeBotTurn()
            ↓
            Get bot instance & behavior profile
            ↓
            BotActionExecutor.decideBotAction()
                ↓
                BotDecisionEngine.makeDecision()
                    ↓
                    Returns: fold, bet_blind, bet_chaal, see_cards, show
            ↓
            Execute decision through GameService
                ↓
                ├─ Fold → handleFold()
                ├─ Bet → handleBet()
                ├─ See Cards → handleSeeCards() → make another decision
                └─ Show → handleShow()
            ↓
            Emit socket events (tableUpdate, bot:action, notification)
            ↓
            Check game status
                ↓
                ├─ Game Over → handleBotGameCompletion()
                └─ Game Continues → handleNextPlayerTurn() → Loop back
```

## Core Components

### 1. BotGameIntegration Service

**File:** `server/src/services/BotGameIntegration.ts`

**Purpose:** Manages bot participation in active games and coordinates bot actions within the game loop.

**Key Methods:**

#### `shouldBotActNow(tableId, player)`
Checks if a given player is a bot that should act automatically.

```typescript
const isBot = await BotGameIntegration.shouldBotActNow(tableId, player);
if (isBot) {
  await BotGameIntegration.executeBotTurn(tableId, player, gameService, socketHandler);
}
```

#### `executeBotTurn(tableId, player, gameService, socketHandler)`
Main entry point for bot actions. Orchestrates the entire bot turn:
1. Fetches bot instance and behavior profile
2. Calls decision engine
3. Executes decision through GameService
4. Emits socket events
5. Handles next player turn

#### `handleNextPlayerTurn(tableId, gameService, socketHandler)`
Determines if next player is bot or human and acts accordingly:
- **Bot:** Executes turn automatically after 1.5s delay
- **Human:** Lets existing turn timer handle it

**Private Helper Methods:**
- `executeDecisionThroughGameService()` - Routes decisions to appropriate GameService methods
- `executeBotFold()` - Handles bot folding
- `executeBotBet()` - Handles bot betting (blind or chaal)
- `executeBotSeeCards()` - Handles bot seeing cards
- `executeBotShow()` - Handles bot showing cards
- `handleBotGameCompletion()` - Updates bot stats when game ends
- `getBotInstanceForPlayer()` - Retrieves bot instance for a player ID
- `getBotDataForPlayer()` - Gets bot instance + behavior profile (cached)

### 2. Bot Detection

Bots are identified by matching player IDs with bot instance IDs:

```typescript
const instances = await botInstanceRepo.findByTableId(tableId);
const botInstance = instances.find(b => b.bot_instance_id === playerId);
```

**Important:** When a bot joins a table, `player.id` must be set to `bot_instance_id`.

### 3. Caching Strategy

To avoid repeated database queries during gameplay:

```typescript
private static botCache = new Map<string, {
  botInstance: BotInstance;
  behaviorProfile: BehaviorProfile;
}>();
```

**Cache Key:** `${tableId}:${playerId}`

**Cache Invalidation:** Call `BotGameIntegration.clearTableCache(tableId)` when game ends.

## Integration Points

### Where to Integrate in SocketHandler

#### 1. After `handleBet()` - When player bets

```typescript
// In handleBet() after successful bet
if (!result.potLimitExceeded) {
  const nextPlayer = table.getPlayers().find(p => p.turn);
  if (nextPlayer) {
    // Check if next player is bot
    const isBot = await BotGameIntegration.shouldBotActNow(data.tableId, nextPlayer);
    if (isBot) {
      // Bot turn - execute automatically
      setTimeout(() => {
        BotGameIntegration.executeBotTurn(
          data.tableId,
          nextPlayer,
          this.gameService,
          this
        );
      }, 1500);
    } else {
      // Human turn - start timer
      this.startTurnTimer(data.tableId, nextPlayer.id, socket);
    }
  }
}
```

#### 2. After `handleFold()` - When player folds

```typescript
// In handleFold() after successful fold
if (result.gameOver && result.winner) {
  await this.handleGameCompletion(/*...*/);
} else {
  const nextPlayer = table.getPlayers().find(p => p.turn);
  if (nextPlayer) {
    const isBot = await BotGameIntegration.shouldBotActNow(data.tableId, nextPlayer);
    if (isBot) {
      setTimeout(() => {
        BotGameIntegration.executeBotTurn(
          data.tableId,
          nextPlayer,
          this.gameService,
          this
        );
      }, 1500);
    } else {
      this.startTurnTimer(data.tableId, nextPlayer.id, socket);
    }
  }
}
```

#### 3. After `handleSideShow()` - When side show occurs

Same pattern as above.

#### 4. After `handleGameCompletion()` - When game ends

```typescript
// Clear bot cache for this table
BotGameIntegration.clearTableCache(tableId);
```

#### 5. On `startGame()` - When game starts

If first player is a bot, trigger their turn:

```typescript
private handleStartGame(socket: Socket, data: { tableId: number }): void {
  // ... existing code ...
  
  if (result.success && result.firstPlayer) {
    const isBot = await BotGameIntegration.shouldBotActNow(
      data.tableId,
      result.firstPlayer
    );
    
    if (isBot) {
      setTimeout(() => {
        BotGameIntegration.executeBotTurn(
          data.tableId,
          result.firstPlayer,
          this.gameService,
          this
        );
      }, 2000); // Give time for UI to update
    } else {
      this.startTurnTimer(data.tableId, result.firstPlayer.id, socket);
    }
  }
}
```

## Socket Events Emitted by Bots

### 1. `bot:action`
Emitted whenever a bot takes an action.

```typescript
{
  tableId: number,
  action: 'fold' | 'bet_blind' | 'bet_chaal' | 'see_cards' | 'show',
  bot: {
    bot_instance_id: string,
    display_name: string,
    bot_id: string
  },
  details: {
    amount?: number  // For bet actions
  },
  timestamp: string
}
```

### 2. `bot:thinking`
Emitted before bot makes decision (during reaction delay).

```typescript
{
  botId: string,
  botName: string,
  action: BotDecision,
  timestamp: Date
}
```

### 3. Standard Game Events

Bots also emit the same events as human players:
- `playerBet` - When bot bets
- `playerFolded` - When bot folds
- `playerSawCards` - When bot sees cards
- `showdown` - When bot shows cards
- `tableUpdate` - After every bot action
- `notification` - Chat-style notifications for bot actions

## Example Flow

### Bot Turn Execution (Bet Example)

1. **Game Loop**: Player A (human) bets 10 chips
2. **nextTurn()**: Moves turn to Player B
3. **Turn Detection**: Player B is detected as a bot
4. **Decision Making**:
   ```
   BotGameIntegration.executeBotTurn()
     → getBotDataForPlayer() → Fetch bot instance & behavior
     → BotActionExecutor.decideBotAction()
       → BotDecisionEngine.makeDecision()
         → Evaluates hand strength: 0.65 (pair)
         → Checks pot odds, balance, round number
         → Applies behavior profile (aggressive: 0.7)
         → Returns: { decision: 'bet_chaal', betAmount: 15 }
   ```
5. **Action Execution**:
   ```
   executeBotBet(15, isBlind=false)
     → gameService.handleBet(tableId, playerId, 15, false)
     → table.pot += 15
     → player.chips -= 15
     → table.nextTurn() → Moves to Player C
   ```
6. **Event Broadcasting**:
   ```
   emit('tableUpdate', table.getTableState())
   emit('playerBet', { playerId, amount: 15, isBlind: false })
   emit('bot:action', { action: 'bet_chaal', amount: 15 })
   emit('notification', '🤖 Bot RS-8732 bet 15 (chaal)')
   ```
7. **Next Player Check**:
   - Player C is human → Start turn timer
   - OR Player C is bot → Execute bot turn after 1.5s delay

## Bot Behavior Timing

### Reaction Delays
- **Blind bet**: 500-1500ms
- **Chaal bet**: 1000-3000ms
- **See cards**: 800-2400ms
- **Fold**: 500-2000ms
- **Show**: 1500-3500ms

Delays are based on `behavior_profile.reaction_delay_ms` with ±30% randomness.

### Between Actions
- After bot action completes: 1.5s delay before next bot acts
- After seeing cards: 1s delay before making bet decision
- After pot limit exceeded: 2s delay before auto-show

## Error Handling

### Bot Insufficient Balance
If a bot doesn't have enough chips for the calculated bet:
```typescript
if (player.chips < betAmount) {
  // Bot folds instead of betting
  await executeBotFold(/*...*/);
}
```

### Bot Not Found
If bot instance lookup fails:
```typescript
const botData = await getBotDataForPlayer(tableId, playerId);
if (!botData) {
  console.log(`⚠️ No bot data found - treating as human player`);
  return false; // Fall back to human player logic
}
```

### Decision Engine Errors
If decision engine throws error:
```typescript
try {
  const decision = await BotDecisionEngine.makeDecision(/*...*/);
} catch (error) {
  console.error('Bot decision error:', error);
  // Default to fold on error
  return { decision: BotDecision.FOLD, reasoning: 'Error occurred' };
}
```

## Testing

### Manual Testing Checklist

1. **Bot vs Human**
   - [ ] Bot can play against human players
   - [ ] Bot actions emit correct events
   - [ ] Turn timer works for humans, not bots
   - [ ] Chat notifications show bot actions

2. **Bot vs Bot**
   - [ ] Multiple bots can play against each other
   - [ ] Game progresses without human intervention
   - [ ] Delays feel natural (not too fast/slow)

3. **Game Completion**
   - [ ] Bot wins trigger proper events
   - [ ] Human wins against bots work correctly
   - [ ] Balances update correctly
   - [ ] Cache is cleared after game

4. **Edge Cases**
   - [ ] Bot folding when insufficient chips
   - [ ] Bot seeing cards mid-game
   - [ ] Pot limit exceeded with bot
   - [ ] All bots fold except one

### Test Endpoint

Create a test endpoint to simulate bot gameplay:

```typescript
// Test bot vs bot game
POST /api/test/bot-game
{
  "tableId": 10001,
  "numBots": 4,
  "bootAmount": 5,
  "blueprint_ids": ["blueprint1", "blueprint2", "blueprint3", "blueprint4"]
}
```

## Future Enhancements (Task 6+)

### Bot Analytics
- Track wins/losses per bot
- Calculate win rate by behavior profile
- Average bet sizes
- Most/least aggressive bots
- ROI (return on investment)

### Advanced Strategies
- Bluffing with weak hands
- Reading opponent patterns
- Adjusting strategy based on pot size
- Remembering previous rounds

### Bot Personalities
- Add chat messages (pre-defined phrases)
- Emote reactions (👍 👎 😮 🤔)
- Taunting winners/losers
- Celebrating wins

## Troubleshooting

### Bots Not Acting
**Issue:** Bots join table but don't take actions.

**Solutions:**
1. Check `player.id` matches `bot_instance_id`
2. Verify `assigned_table_id` is set correctly
3. Check bot instance `is_active` is true
4. Look for errors in `getBotDataForPlayer()`

### Turn Stuck on Bot
**Issue:** Game hangs on bot's turn.

**Solutions:**
1. Check for uncaught errors in `executeBotTurn()`
2. Verify `nextTurn()` is being called
3. Add timeout fallback for bot actions
4. Check bot decision engine doesn't throw

### Bots Acting Too Fast
**Issue:** Bot actions happen instantly, feels unrealistic.

**Solutions:**
1. Increase `reaction_delay_ms` in behavior profile
2. Add more delay between actions (currently 1.5s)
3. Add random variation to delays

### Events Not Emitting
**Issue:** Frontend doesn't receive bot actions.

**Solutions:**
1. Verify socket room names match (`table_${tableId}`)
2. Check socketHandler is passed correctly
3. Ensure `getIO()` method exists on socketHandler
4. Test with Socket.IO client debugger

## Summary

The Bot Game Integration system provides:
- ✅ Automatic bot action execution in game loop
- ✅ Seamless integration with existing GameService
- ✅ Realistic timing with reaction delays
- ✅ Proper event emission for real-time updates
- ✅ Graceful error handling
- ✅ Efficient caching to reduce DB queries
- ✅ Support for bot vs bot and bot vs human games

Next: Implement bot analytics tracking (Task 6).

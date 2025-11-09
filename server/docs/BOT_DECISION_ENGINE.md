# Bot Decision Engine - Task 4 Documentation

## Overview
The Bot Decision Engine provides intelligent AI-driven decision-making for Teen Patti bots. It analyzes game state, evaluates hand strength, and makes realistic decisions based on customizable behavior profiles.

## Components

### 1. BotDecisionEngine.ts
Core AI logic that makes gameplay decisions.

**Key Methods:**
- `makeDecision(behaviorProfile, context)` - Main decision-making entry point
- `evaluateHandStrength(cards)` - Returns 0-1 score for hand quality
- `decideBlindStrategy()` - Strategy when playing blind
- `makeInformedDecision()` - Strategy after seeing cards
- `addReactionDelay()` - Simulates human thinking time

**Decision Types:**
- `FOLD` - Give up hand
- `BET_BLIND` - Bet without seeing cards
- `BET_CHAAL` - Bet after seeing cards
- `SEE_CARDS` - Look at cards
- `SIDE_SHOW` - Compare with previous player
- `SHOW` - Reveal all cards

### 2. BotActionExecutor.ts
Executes bot decisions on the game table.

**Key Methods:**
- `decideBotAction()` - Analyze state and get decision
- `executeBotDecision()` - Apply decision to table
- `shouldBotAct()` - Check if bot should play now

### 3. Behavior Profiles
Customize bot personality and skill level:

```typescript
{
  aggressiveness: 0-1,        // How often to bet/raise (0=passive, 1=aggressive)
  risk_tolerance: 0-100,      // Willingness to bet high (affects bet amounts)
  skill_level: 0-100,         // Hand evaluation accuracy
  reaction_delay_ms: 500-3000,// Thinking time
  error_rate: 0-1             // Chance of mistakes (0=perfect, 1=always wrong)
}
```

**Preset Profiles:**

1. **AGGRESSIVE** (aggressiveness: 0.8, risk_tolerance: 80)
   - Bets frequently and high amounts
   - Folds less often
   - Sees cards early

2. **CONSERVATIVE** (aggressiveness: 0.2, risk_tolerance: 30)
   - Bets cautiously
   - Folds with weak hands
   - Plays safe

3. **BALANCED** (aggressiveness: 0.5, risk_tolerance: 50)
   - Medium strategy
   - Balanced play style

4. **UNPREDICTABLE** (varies)
   - Random behavior
   - Hard to read

## Decision Logic

### Hand Strength Evaluation
Uses CardComparer to evaluate hands on 0-1 scale:
- **Trail (AAA)**: ~1.0 (strongest)
- **Straight Flush**: ~0.9
- **Straight**: ~0.7
- **Flush**: ~0.6
- **Pair**: ~0.4
- **High Card**: ~0.2 (weakest)

### Blind Play Strategy
When bot hasn't seen cards:
- Aggressive bots: See cards after 2 rounds
- Conservative bots: See cards after 1 round
- Balanced bots: See cards after 3 rounds
- Otherwise: Continue betting blind

### Informed Decision Strategy
After seeing cards, bot considers:

1. **Hand Strength vs Threshold**
   - Fold if hand < foldThreshold and bet is high
   - Continue if hand >= foldThreshold

2. **Pot Odds**
   - Higher pot = more willing to stay in
   - Calculate: pot / currentBet

3. **Bet Amount Calculation**
   ```
   betAmount = minBet * handStrength * aggressiveness * riskTolerance
   ```

4. **Show Decision**
   - Very strong hand (>0.7)
   - High pot (>20x boot)
   - Approaching pot limit
   - Many rounds passed

### Error Injection
Bots make realistic mistakes based on `error_rate`:
- Random fold (even with good hand)
- Random bet (too high or too low)
- Makes gameplay unpredictable and human-like

## API Endpoints

### Test Decision Endpoint
```
POST /api/test/bot-decision
Content-Type: application/json

{
  "behaviorProfile": {
    "aggressiveness": 0.7,
    "risk_tolerance": 60,
    "skill_level": 50,
    "reaction_delay_ms": 2000,
    "error_rate": 0.1
  },
  "context": {
    "currentBet": 10,
    "pot": 50,
    "boot": 5,
    "lastBlind": true,
    "botBalance": 1000,
    "botCards": [], // Card objects
    "hasSeenCards": true,
    "totalBetSoFar": 10,
    "activePlayers": 3,
    "foldedPlayers": 1,
    "totalPlayers": 4,
    "roundNumber": 5,
    "potLimit": 2048,
    "isPotLimitClose": false
  }
}
```

### Test Scenarios Endpoint
```
GET /api/test/bot-scenarios
```

Returns 4 pre-configured test scenarios demonstrating different bot behaviors.

## Example Output

### Aggressive Bot with Trail (AAA)
```json
{
  "decision": "bet_chaal",
  "betAmount": 50,
  "reasoning": "Betting with hand strength 0.95"
}
```

### Conservative Bot with Weak Hand
```json
{
  "decision": "fold",
  "reasoning": "Weak hand (0.21) and high bet"
}
```

### Balanced Bot Playing Blind
```json
{
  "decision": "see_cards",
  "reasoning": "Balanced bot sees cards after 3 rounds"
}
```

## Integration with Game Loop

The Bot Decision Engine is designed to be called from the game loop:

```typescript
// Pseudo-code for game loop integration
if (BotActionExecutor.shouldBotAct(player, isBotPlayer)) {
  // Get bot's behavior profile from blueprint
  const behaviorProfile = botBlueprint.behavior_profile;
  
  // Make decision
  const decision = await BotActionExecutor.decideBotAction(
    botInstance,
    behaviorProfile,
    table,
    botPlayer
  );
  
  // Execute decision
  BotActionExecutor.executeBotDecision(
    table,
    botPlayer,
    botInstance,
    decision
  );
  
  // Continue game flow...
}
```

## Socket Events

Bots emit two types of events:

1. **bot:thinking** - When bot is deciding
   ```json
   {
     "botId": "bot_instance_id",
     "botName": "display_name",
     "action": "bet_chaal",
     "timestamp": "2024-..."
   }
   ```

2. **bot:action** - When bot acts
   ```json
   {
     "botId": "bot_instance_id",
     "botName": "display_name",
     "action": "bet_chaal",
     "betAmount": 20,
     "timestamp": "2024-..."
   }
   ```

## Next Steps (Task 5)

1. Integrate into existing game loop in SocketHandler
2. Detect bot turns automatically
3. Execute bot actions through GameService
4. Handle bot wins/losses and balance updates
5. Implement bot timeout handling
6. Add bot disconnect/reconnect logic

## Testing

Run scenarios endpoint to verify AI logic:
```bash
curl https://teen-patti-server.onrender.com/api/test/bot-scenarios
```

Expected: Different behavior profiles produce different decisions for same game state.

## Files Created
- `server/src/services/BotDecisionEngine.ts` - AI decision logic
- `server/src/services/BotActionExecutor.ts` - Decision execution
- `server/src/routes/testBotDecisionRoutes.ts` - Test endpoints
- `server/docs/BOT_DECISION_ENGINE.md` - This documentation

## Status
✅ **COMPLETED** - Bot Decision Engine is operational and deployed to production.

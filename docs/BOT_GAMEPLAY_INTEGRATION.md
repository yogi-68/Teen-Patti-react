# Bot Gameplay Integration Guide

## Overview
This document describes how to integrate bot players into the Teen Patti game loop so they can make decisions and take actions during gameplay.

## Integration Architecture

### Components
1. **BotGameplayService** - Main service for bot gameplay logic
2. **BotDecisionEngine** - Makes strategic decisions based on game state
3. **BotChatService** - Generates contextual chat messages
4. **TableSeatRepository** - Manages bot seat assignments
5. **BotInstanceRepository** - Tracks bot statistics and state

### Integration Points

#### 1. Turn Timer Modification (Socket Handler)
**File**: `server/src/socket/SocketHandler.ts`
**Method**: `startTurnTimer()`

**Current Behavior**: When a player's turn expires, auto-bet is executed.

**Required Changes**:
```typescript
import BotGameplayService from '../services/BotGameplayService.js';

private async startTurnTimer(tableId: number, playerId: string, socket: Socket): Promise<void> {
  this.clearTurnTimer(playerId);
  
  // Check if player is a bot
  const isBot = await BotGameplayService.isBot(playerId);
  
  // Bots take actions with slight delay (1-3 seconds) for realism
  const turnDelay = isBot ? (1000 + Math.random() * 2000) : 20000;
  
  let timeLeft = isBot ? Math.floor(turnDelay / 1000) : 20;
  
  console.log(`⏰ Starting ${timeLeft}s timer for ${isBot ? 'BOT' : 'player'}: ${playerId}`);
  
  // Emit initial timer
  this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
  
  // Countdown interval (only for humans, bots don't need UI countdown)
  let countdown: NodeJS.Timeout | null = null;
  if (!isBot) {
    countdown = setInterval(() => {
      timeLeft--;
      if (timeLeft >= 0) {
        this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
        
        if (timeLeft === 2) {
          socket.emit('requestCurrentBet', { playerId });
        }
      }
    }, 1000);
    
    this.turnCountdowns.set(playerId, countdown);
  }
  
  // Timeout action (bot decision or human auto-bet)
  const timer = setTimeout(async () => {
    console.log(`⏰ Turn timeout for ${isBot ? 'BOT' : 'player'}: ${playerId}`);
    
    if (countdown) {
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
    }
    
    const table = this.gameService.getTable(tableId);
    if (!table) return;
    
    const player = table.getPlayer(playerId);
    if (!player || !player.turn) return;
    
    if (!this.turnTimers.has(playerId)) return;
    
    if (isBot) {
      // Bot decision logic
      try {
        const currentBet = this.playerCurrentBets.get(playerId) || 0;
        const minBet = this.gameService.getMinimumBet(tableId, playerId);
        const playerBalance = player.balance; // Adjust based on your Player model
        const pot = table.pot; // Adjust based on your Table model
        
        const botAction = await BotGameplayService.getBotDecision(
          playerId,
          tableId,
          currentBet,
          minBet,
          playerBalance,
          pot,
          player.hand // Adjust based on your Player model
        );
        
        console.log(`🤖 Bot ${playerId} action: ${botAction.action} ${botAction.amount || ''}`);
        
        // Execute bot action
        if (botAction.action === 'fold') {
          this.handleFold(socket, { tableId, playerId });
        } else if (botAction.action === 'call' || botAction.action === 'raise') {
          this.handleBet(socket, { 
            tableId, 
            playerId, 
            amount: botAction.amount || minBet 
          });
        }
        
        // Send chat message if generated
        if (botAction.chatMessage) {
          this.io.to(`table_${tableId}`).emit('chatMessage', {
            playerId,
            username: player.name, // Adjust based on your Player model
            message: botAction.chatMessage,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error(`❌ Error in bot decision for ${playerId}:`, error);
        // Fallback to min bet
        const minBet = this.gameService.getMinimumBet(tableId, playerId);
        this.handleBet(socket, { tableId, playerId, amount: minBet });
      }
    } else {
      // Human player auto-bet (existing logic)
      const currentBet = this.playerCurrentBets.get(playerId) || 0;
      const minBet = this.gameService.getMinimumBet(tableId, playerId);
      const betAmount = Math.max(currentBet, minBet);
      
      console.log(`🤖 Auto-betting ${betAmount} for player ${playerId}`);
      this.handleBet(socket, { tableId, playerId, amount: betAmount });
    }
  }, turnDelay);
  
  this.turnTimers.set(playerId, timer);
}
```

#### 2. Game End Handler
**File**: `server/src/socket/SocketHandler.ts`
**Method**: `handleGameEnd()` or wherever winners are determined

**Required Addition**:
```typescript
import BotGameplayService from '../services/BotGameplayService.js';

// After determining winner(s)
private async handleGameEnd(tableId: number, winners: string[], pot: number): Promise<void> {
  const table = this.gameService.getTable(tableId);
  if (!table) return;
  
  for (const playerId of table.players) {
    const isBot = await BotGameplayService.isBot(playerId);
    if (isBot) {
      const won = winners.includes(playerId);
      const winnings = won ? pot / winners.length : 0;
      
      await BotGameplayService.handleGameEnd(playerId, won, winnings);
      
      // Optional: Generate victory/defeat chat
      const chatMessage = await BotGameplayService.generateBotChat(
        playerId,
        won ? 'win' : 'loss'
      );
      
      if (chatMessage) {
        this.io.to(`table_${tableId}`).emit('chatMessage', {
          playerId,
          username: table.getPlayer(playerId)?.name,
          message: chatMessage,
          timestamp: new Date()
        });
      }
    }
  }
  
  // Rest of game end logic...
}
```

#### 3. Bot Player Initialization
**File**: `server/src/socket/SocketHandler.ts`
**Method**: `handleJoinTable()` or game initialization

**Required Check**:
```typescript
import BotGameplayService from '../services/BotGameplayService.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';

private async handleJoinTable(socket: Socket, data: { tableId: number }): Promise<void> {
  // Existing join table logic...
  
  // Add bots to game state from seat assignments
  const botIds = await BotGameplayService.getTableBots(data.tableId);
  
  for (const botId of botIds) {
    const botInstance = await BotInstanceRepository.findById(botId);
    if (botInstance && botInstance.is_active) {
      // Add bot as a player in the game state
      // This depends on your game state management
      // Example:
      const table = this.gameService.getTable(data.tableId);
      if (table && !table.hasPlayer(botId)) {
        table.addPlayer({
          id: botId,
          name: botInstance.display_name,
          balance: botInstance.balance_coins,
          // Other player properties...
        });
      }
    }
  }
}
```

## Testing

### Manual Testing Steps
1. Create a bot blueprint with specific behavior profile
2. Assign bot to a table seat
3. Start a game with human player(s) and bot(s)
4. Verify bot takes actions during its turn
5. Check bot chat messages appear appropriately
6. Verify bot stats update after game ends

### Automated Testing
```typescript
// Add to integration tests
describe('Bot Gameplay Integration', () => {
  it('should make bot decision on turn', async () => {
    const botId = 'bot-001';
    const decision = await BotGameplayService.getBotDecision(
      botId,
      1, // tableId
      100, // currentBet
      50, // minBet
      10000, // balance
      500, // pot
      ['AS', 'KS'] // hand
    );
    
    expect(decision.action).toBeDefined();
    expect(['fold', 'call', 'raise', 'check']).toContain(decision.action);
  });
  
  it('should update bot stats after game', async () => {
    const botId = 'bot-001';
    const before = await BotInstanceRepository.findById(botId);
    
    await BotGameplayService.handleGameEnd(botId, true, 1000);
    
    const after = await BotInstanceRepository.findById(botId);
    expect(after.games_played).toBe(before.games_played + 1);
    expect(after.games_won).toBe(before.games_won + 1);
  });
});
```

## Configuration

### Bot Behavior Tuning
Edit `behavior_profile` in bot blueprints:
- `aggressiveness`: 0-100 (higher = more raises)
- `risk_tolerance`: 0-100 (higher = plays weaker hands)
- `reaction_delay_ms`: 500-5000 (action delay for realism)
- `error_rate`: 0-20 (chance of suboptimal play)
- `skill_level`: 0-100 (hand evaluation depth)

### Chat Frequency
Adjust in `BotGameplayService.shouldSendChat()`:
- Regular actions: 20% chance
- Win/loss: 50% chance

## Security Considerations

1. **No Privileged Access**: Bots use same APIs as human players
2. **Rate Limiting**: Bot actions respect turn timers
3. **Audit Logging**: All bot actions logged in audit trail
4. **Balance Validation**: Bot bet amounts validated by game service
5. **Hand Privacy**: Bots don't have access to opponent hands

## Performance Impact

- **Decision Time**: ~10-50ms per decision
- **Memory**: ~1KB per active bot
- **Database**: 2-3 queries per bot action
- **Network**: Same as human player (WebSocket events)

## Monitoring

Track these metrics:
- Bot win rate per table
- Average decision time
- Chat message frequency
- Action distribution (fold/call/raise ratio)
- Balance changes over time

Alert on:
- Win rate > 70% (potential exploit)
- Decision time > 1000ms (performance issue)
- Crash rate > 1% (code bug)

## Rollout Plan

1. **Phase 1**: Deploy code, disable bot integration (feature flag)
2. **Phase 2**: Enable for 1-2 test tables only
3. **Phase 3**: Monitor for 24 hours, check metrics
4. **Phase 4**: Gradually increase to 25%, 50%, 100% of tables
5. **Phase 5**: Full production with monitoring enabled

## Rollback Procedure

If issues detected:
1. Set feature flag `ENABLE_BOT_GAMEPLAY=false`
2. Clear all bot seat assignments: `DELETE FROM table_seats WHERE occupant_type='bot'`
3. Mark all bots inactive: `UPDATE bot_instances SET is_active=false`
4. Investigate logs and metrics
5. Fix issues and redeploy

## Additional Resources

- API Documentation: `/docs/features/SERVER_ENHANCEMENTS.md`
- Admin Dashboard: `http://yourapp.com/admin/bots`
- Monitoring: Check CloudWatch/Datadog for bot metrics

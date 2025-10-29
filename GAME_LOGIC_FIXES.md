# 🎮 Game Logic Fixes - Matching Original Teen Patti

## Critical Differences Found

### 1. Hand Ranking Order ✅ CORRECT
**Original (cardComparer.js):**
```javascript
setType: {
    "highcard": { priority: 1 },      // Lowest
    "pair": { priority: 2 },
    "color": { priority: 3 },         // Flush (same suit)
    "sequence": { priority: 4 },      // Regular straight
    "puresequence": { priority: 5 },  // Straight flush
    "trail": { priority: 6 }          // Highest (three of a kind)
}
```

**Our Implementation:**
```typescript
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  FLUSH = 3,        // ✅ Same as "color"
  STRAIGHT = 4,     // ✅ Same as "sequence"
  TRAIL = 5,        // ❌ WRONG - Should be 6
  STRAIGHT_FLUSH = 6 // ❌ WRONG - Should be 5
}
```

**FIX NEEDED:** Swap Trail and Straight Flush priorities

---

### 2. Side Show Logic ❌ NEEDS FIX

**Original Logic (tabledecks.js):**
```javascript
this.setPlayerForSideShow = function(id) {
    var prevPlayer = this.getPrevActivePlayer(id);  // ← PREVIOUS player
    prevPlayer.sideShowTurn = true;
    return [players[id].playerInfo.userName, ' asking for side show'].join('');
}
```

**Current Player Asks → PREVIOUS Player Accepts/Denies**

**Our Implementation:**
Currently asks the NEXT player, should ask PREVIOUS player.

**FIX NEEDED:** Change sideShow to request PREVIOUS active player

---

### 3. Pot Limit Check ❌ MISSING

**Original Logic (tabledecks.js):**
```javascript
this.resetTable = function() {
    tableInfo = {
        boot: iBoot,
        lastBet: iBoot,
        lastBlind: true,
        maxBet: iBoot * Math.pow(2, 7),      // boot * 128
        potLimit: iBoot * Math.pow(2, 11),   // boot * 2048
        showAmount: true
    };
}

this.isPotLimitExceeded = function() {
    if (tableInfo.amount) {
        return tableInfo.amount > tableInfo.potLimit;
    }
    return false;
}
```

**After each bet:**
```javascript
if (args.bet.show || table.isPotLimitExceeded()) {
    // Automatic show - reveal all cards
    table.decideWinner();
}
```

**FIX NEEDED:** Add potLimit check after every bet

---

### 4. Boot Collection ❌ NEEDS VERIFICATION

**Original Logic:**
```javascript
this.collectBootAmount = function() {
    var bootAmount = 0;
    for (var player in players) {
        if (players[player].active) {
            // Check if player has enough chips for boot
            if (players[player].playerInfo.chips < tableInfo.boot) {
                console.log('Auto-packing player - insufficient chips');
                players[player].packed = true;
                continue;
            }
            
            players[player].lastBet = tableInfo.boot;
            bootAmount = bootAmount + tableInfo.boot;
            players[player].playerInfo.chips -= tableInfo.boot;
        }
    }
    tableInfo.amount = bootAmount;
}
```

Boot is collected from ALL active players at game start.

**FIX NEEDED:** Verify boot collection happens for all players

---

### 5. Show Action Rules ❌ NEEDS FIX

**Original Logic:**
- Show only available when:
  1. Exactly 2 active players remain, OR
  2. Pot limit exceeded

**Current Logic:**
- Show available when 2 players (correct)
- Missing pot limit check

**FIX NEEDED:** Add pot limit auto-show

---

### 6. Turn Timer Auto-Bet ✅ CORRECT

**Original:** Uses EXACT UI bet amount (stored via updateCurrentBet event)
**Our Implementation:** Uses minimum bet calculation

Both approaches work, but original is more accurate.

---

### 7. Minimum Bet Calculation ✅ CORRECT

**Original Logic (io.js):**
```javascript
function getMinimumBetForPlayer(player, tableInfo) {
    var isBlind = player.cardSet && player.cardSet.closed;
    var minBet;
    
    if (isBlind) {
        // Blind player
        if (tableInfo.lastBlind === true) {
            minBet = tableInfo.lastBet;      // If last was blind: same
        } else {
            minBet = tableInfo.lastBet / 2;  // If last was chaal: half
        }
    } else {
        // Chaal player (seen cards)
        if (tableInfo.lastBlind === true) {
            minBet = tableInfo.lastBet * 2;  // If last was blind: double
        } else {
            minBet = tableInfo.lastBet;      // If last was chaal: same
        }
    }
    
    return Math.ceil(minBet);
}
```

**Our Implementation:** ✅ Matches exactly

---

### 8. Game Start Countdown ✅ CORRECT

**Original:** 7-9 second countdown before dealing cards
**Our Implementation:** Instant start

This is a UX difference, not a logic error.

---

## Summary of Required Fixes

### HIGH PRIORITY
1. ❌ **Fix Hand Ranking**: Swap Trail (should be 6) and Straight Flush (should be 5)
2. ❌ **Fix Side Show**: Request PREVIOUS player, not next player
3. ❌ **Add Pot Limit**: Check after each bet, auto-show if exceeded

### MEDIUM PRIORITY
4. ⚠️ **Verify Boot Collection**: Ensure all players pay boot at game start
5. ⚠️ **Show Rules**: Only allow when 2 players OR pot limit exceeded

### LOW PRIORITY (Optional Enhancements)
6. ✅ **Turn Timer**: Already working correctly
7. ✅ **Min Bet Calc**: Already correct
8. 💡 **Game Countdown**: Add 7-9 second countdown (UX enhancement)

---

## Implementation Plan

### Step 1: Fix CardComparer.ts
```typescript
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  FLUSH = 3,
  STRAIGHT = 4,
  STRAIGHT_FLUSH = 5,  // ← Fixed: was 6
  TRAIL = 6,           // ← Fixed: was 5
}
```

### Step 2: Fix Side Show Logic
In GameService.ts:
```typescript
// Change from:
const targetPlayer = table.getNextActivePlayer(playerId);

// To:
const targetPlayer = table.getPreviousActivePlayer(playerId);
```

### Step 3: Add Pot Limit
In Table.ts:
```typescript
interface TableConfig {
  bootAmount: number;
  minBet: number;
  maxBet: number;  // boot * 2^7 = boot * 128
  potLimit: number; // boot * 2^11 = boot * 2048
  maxPlayers: number;
}
```

In GameService.handleBet():
```typescript
// After bet is placed:
const potLimit = table.config.bootAmount * Math.pow(2, 11);
if (table.pot >= potLimit) {
  // Trigger automatic show
  return this.handleShow(tableId, playerId);
}
```

### Step 4: Add getPreviousActivePlayer
In Table.ts:
```typescript
getPreviousActivePlayer(playerId: string): Player | null {
  const currentIndex = this.players.findIndex(p => p.id === playerId);
  if (currentIndex === -1) return null;
  
  // Search backwards for active, non-folded player
  for (let i = 1; i <= this.players.length; i++) {
    const prevIndex = (currentIndex - i + this.players.length) % this.players.length;
    const player = this.players[prevIndex];
    if (!player.folded && player.cardSet) {
      return player;
    }
  }
  return null;
}
```

---

## Testing Checklist

After fixes:
- [ ] Trail beats Straight Flush
- [ ] Straight Flush beats Flush
- [ ] Side show requests previous player
- [ ] Pot limit triggers auto-show
- [ ] Boot collected from all players at start
- [ ] Show only available with 2 players or pot limit
- [ ] Turn timer auto-bets correctly
- [ ] Minimum bet calculations work

---

## Files to Modify

1. `server/src/services/CardComparer.ts` - Fix hand rankings
2. `server/src/models/Table.ts` - Add getPreviousActivePlayer, pot limit
3. `server/src/services/GameService.ts` - Fix side show, add pot limit check
4. `server/src/socket/SocketHandler.ts` - Add pot limit event handling
5. `client/src/types/game.types.ts` - Add potLimit to TableConfig

---

**Status:** Ready to implement fixes
**Priority:** HIGH - These are core game logic issues
**Impact:** Affects game fairness and rule accuracy

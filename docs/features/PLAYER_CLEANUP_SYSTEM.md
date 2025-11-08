# Player Cleanup System

## 🎯 Overview

Comprehensive player removal and cleanup system that ensures:
1. **Proper fold handling** when players leave during active games
2. **Complete data cleanup** so players can rejoin as fresh
3. **Real-time updates** reflected to all players
4. **Network disconnect handling** with automatic removal

---

## 🔧 Backend Implementation (Server)

### **1. New Event Handlers**

#### `removePlayer`
Complete player removal with fold handling if game is in progress.

**Event Data:**
```typescript
{
  tableId: number;
  playerId: string;
  reason: 'disconnect' | 'leave' | 'cleanup';
}
```

**What it does:**
- ✅ Folds player if game is in betting phase
- ✅ Removes player from table completely
- ✅ Cleans up all session data (socket mappings, username mappings, timers)
- ✅ Checks if game is over (only one player left)
- ✅ Notifies all players in real-time
- ✅ Sends updated table state to everyone
- ✅ Allows player to rejoin as fresh

#### `leaveTable`
Player voluntarily leaves the table.

**Event Data:**
```typescript
{
  tableId: number;
  playerId: string;
}
```

**What it does:**
- Internally calls `removePlayer` with reason='leave'

#### `forceDisconnect`
Force disconnect user sessions (for session conflicts).

**Event Data:**
```typescript
{
  userId: string;
}
```

**What it does:**
- ✅ Finds all sockets associated with user
- ✅ Removes player from tables
- ✅ Disconnects all sockets
- ✅ Cleans up all mappings

---

### **2. Enhanced `handleDisconnect`**

Previously had duplicate code. Now simplified:

```typescript
private handleDisconnect(socket: Socket): void {
  // Get player info
  const playerInfo = this.socketToPlayer.get(socket.id);
  
  // Call comprehensive removePlayer handler
  this.handleRemovePlayer(socket, {
    tableId: playerInfo.tableId,
    playerId: playerInfo.playerId,
    reason: 'disconnect'
  });
}
```

**Benefits:**
- Single source of truth for cleanup logic
- Consistent behavior across all disconnect scenarios
- Automatic fold + removal + notification

---

### **3. GameService: `removePlayer` Method**

New method in `GameService` to handle removal with proper game logic:

```typescript
removePlayer(
  tableId: number,
  playerId: string
): { 
  success: boolean; 
  message?: string; 
  gameOver?: boolean; 
  winner?: Player;
  playerName?: string;
}
```

**What it does:**
1. Gets table and player
2. If game is in betting phase and player hasn't folded:
   - Folds the player
   - Checks if only one player left (game over)
   - Moves to next turn if game continues
3. Removes player from table
4. Resets table if no players remain
5. Returns result with game state info

**Benefits:**
- ✅ Centralized removal logic
- ✅ Proper game state management
- ✅ Consistent with other game operations

---

### **4. Data Cleanup**

The `cleanupPlayerData` method removes:
- ⏱️ Turn timers
- ⏱️ Turn countdown intervals
- 💰 Current bet tracking
- 🔌 Socket-to-player mappings
- 👤 Username-to-player mappings

---

## 📱 Frontend Implementation (Client)

### **1. On Disconnect**

```typescript
socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
  
  if (currentPlayerId && currentTableId) {
    socket.emit('removePlayer', {
      tableId: currentTableId,
      playerId: currentPlayerId,
      reason: 'disconnect'
    });
  }
});
```

### **2. On Leave Table**

```typescript
const handleLeaveTable = () => {
  // If in betting phase, fold first
  if (gameState === 'betting' && playerId) {
    socket.emit('fold', { tableId, playerId });
  }
  
  // Remove player completely
  socket.emit('removePlayer', {
    tableId,
    playerId,
    reason: 'leave'
  });
  
  // Also emit leaveTable for backwards compatibility
  socket.emit('leaveTable', { tableId, playerId });
  
  // Show message
  showNotification('You have left the table. You can rejoin as a new player.', 'info');
};
```

### **3. On Component Unmount**

```typescript
useEffect(() => {
  return () => {
    if (playerId && tableId) {
      // Fold if in betting
      if (gameState === 'betting') {
        socket.emit('fold', { tableId, playerId });
      }
      
      // Remove player
      socket.emit('removePlayer', {
        tableId,
        playerId,
        reason: 'cleanup'
      });
      
      // Backwards compatibility
      socket.emit('leaveTable', { tableId, playerId });
      
      // Disconnect after delay
      setTimeout(() => socket.disconnect(), 300);
    }
  };
}, [playerId, tableId, gameState]);
```

### **4. Session Conflict Handling**

```typescript
// Changed button text to "Clear & Rejoin"
<button onClick={handleClearAndRejoin}>
  Clear & Rejoin
</button>

const handleClearAndRejoin = () => {
  // Remove old player data
  socket.emit('removePlayer', {
    tableId: conflictTableId,
    playerId: conflictPlayerId,
    reason: 'cleanup'
  });
  
  // Force disconnect old session
  socket.emit('forceDisconnect', { userId: userName });
  
  // Longer timeout for complete cleanup
  setTimeout(() => {
    window.location.reload();
  }, 800);
};
```

### **5. New Event Listeners**

#### `playerRemoved`
```typescript
socket.on('playerRemoved', ({ playerId, playerName, reason }) => {
  console.log(`🗑️ Player ${playerName} removed (${reason})`);
  
  // Show notification to all players
  showNotification(
    `${playerName} ${reason === 'disconnect' ? 'disconnected' : 'left'} the game`,
    'info'
  );
  
  // Remove from local state
  setPlayers(prev => prev.filter(p => p.id !== playerId));
});
```

#### `removedFromTable`
```typescript
socket.on('removedFromTable', ({ success, message }) => {
  if (success) {
    showNotification(message, 'success');
    // Reset local state
    setPlayerId(null);
    setTableId(null);
    // Navigate to lobby
    navigate('/lobby');
  }
});
```

---

## 🎯 Flow Diagrams

### **Disconnect Flow**
```
Player disconnects
    ↓
Client: socket.on('disconnect')
    ↓
Emit: removePlayer (reason: 'disconnect')
    ↓
Server: handleRemovePlayer()
    ↓
GameService.removePlayer()
    ↓
If betting phase → Fold player
    ↓
If only 1 left → Game over
    ↓
Remove from table
    ↓
Clean up all data
    ↓
Emit: playerRemoved (to all)
    ↓
Emit: tableUpdate (to all)
    ↓
All players see update in real-time
```

### **Leave Flow**
```
Player clicks "Leave"
    ↓
If betting → Fold first
    ↓
Emit: removePlayer (reason: 'leave')
    ↓
Emit: leaveTable (backwards compat)
    ↓
Server: handleRemovePlayer()
    ↓
[Same as disconnect flow]
    ↓
Player sees: "You can rejoin as new player"
    ↓
Navigate to lobby
```

### **Session Conflict Flow**
```
Player joins from new tab
    ↓
Server detects existing session
    ↓
Emit: joinedTable (success: false)
    ↓
Client shows: "Session Conflict" dialog
    ↓
Player clicks: "Clear & Rejoin"
    ↓
Emit: removePlayer (reason: 'cleanup')
    ↓
Emit: forceDisconnect
    ↓
Server disconnects old sockets
    ↓
Server removes player from table
    ↓
Wait 800ms
    ↓
Page reloads
    ↓
Player can join fresh
```

---

## ✅ Benefits

### **1. No More Ghost Players**
- Players are completely removed when they leave/disconnect
- No lingering session data
- Fresh join every time

### **2. Proper Game State**
- Players are folded if game is in progress
- Game ends properly if only one player remains
- Turn system continues correctly

### **3. Real-Time Updates**
- All players see removals immediately
- Notifications keep everyone informed
- Table state always in sync

### **4. Session Management**
- No "already connected" errors after cleanup
- Session conflicts handled gracefully
- Can rejoin immediately as new player

### **5. Clean Architecture**
- Single source of truth for cleanup logic
- Reusable removePlayer handler
- Consistent behavior across all scenarios

---

## 🧪 Testing Scenarios

### **Test 1: Disconnect During Game**
1. Start game with 3 players
2. Disconnect one player (close browser/tab)
3. ✅ Player is auto-folded
4. ✅ Other players see "Player disconnected"
5. ✅ Game continues with remaining players
6. ✅ Disconnected player can rejoin as new

### **Test 2: Leave During Game**
1. Start game with 3 players
2. Player clicks "Leave Table"
3. ✅ Player is folded
4. ✅ Other players see "Player left the game"
5. ✅ Player sees success message
6. ✅ Can rejoin immediately

### **Test 3: Last Player Disconnects**
1. Start game with 2 players
2. One player disconnects
3. ✅ Disconnected player is folded
4. ✅ Game ends immediately
5. ✅ Remaining player wins the pot
6. ✅ Winner's balance updated

### **Test 4: Session Conflict**
1. Player joins table
2. Open same account in new tab
3. ✅ See "Session Conflict" dialog
4. ✅ Click "Clear & Rejoin"
5. ✅ Old session disconnected
6. ✅ New session connects successfully

### **Test 5: Multiple Rapid Disconnects**
1. Start game with 5 players
2. 3 players disconnect quickly
3. ✅ All are folded in order
4. ✅ All players see updates
5. ✅ Game continues or ends properly
6. ✅ No race conditions or errors

---

## 📝 Event Reference

### **Emitted by Client**
- `removePlayer` - Complete player removal
- `leaveTable` - Leave table (backwards compat)
- `forceDisconnect` - Force disconnect user sessions
- `disconnect` - Socket disconnection

### **Emitted by Server**
- `playerRemoved` - Player completely removed
- `playerFolded` - Player folded (during removal)
- `gameOver` - Game ended (after removal)
- `tableUpdate` - Updated table state
- `removedFromTable` - Confirm removal to player
- `playerLeft` - Player left (backwards compat)
- `playerDisconnected` - Player disconnected (backwards compat)

### **Listened by Client**
- `playerRemoved` - Handle player removal
- `removedFromTable` - Handle own removal
- `playerLeft` - Show notification
- `playerDisconnected` - Show notification
- `disconnect` - Clean up on disconnect

---

## 🚀 Next Steps

1. ✅ Backend implementation complete
2. ✅ Frontend implementation complete
3. ✅ Event handlers added
4. ✅ Session conflict handling
5. 🔄 Test all scenarios
6. 🔄 Monitor logs for issues
7. 🔄 Optimize if needed

---

## 📌 Notes

- All cleanup is automatic - no manual intervention needed
- Player can always rejoin as fresh after removal
- Session conflicts are handled gracefully
- Real-time updates keep all players in sync
- Backwards compatible with old events

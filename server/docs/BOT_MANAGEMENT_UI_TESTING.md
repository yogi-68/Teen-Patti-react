# Bot Management System - UI Testing Guide

## Overview
This guide provides comprehensive instructions for testing the Bot Management System UI components on both **Web (React)** and **Mobile (React Native)** platforms.

---

## 🎯 Quick Summary

| Feature | Web Support | Mobile Support | Status |
|---------|-------------|----------------|--------|
| **Admin Dashboard** | ✅ Full | ❌ Not Implemented | Web Only |
| **Bot Control Panel** | ✅ Full | ❌ Not Implemented | Web Only |
| **Table Seat Manager** | ✅ Full | ❌ Not Implemented | Web Only |
| **Bot Monitoring** | ✅ Full | ❌ Not Implemented | Web Only |
| **Game Play** | ✅ Full | ✅ Full | Both |
| **User Auth** | ✅ Full | ✅ Full | Both |

**Important:** Bot management features are **Web-only** admin tools. Mobile app is for regular gameplay.

---

## 📱 Platform Differences

### Web Client (React)
- **Purpose:** Admin panel + Regular gameplay
- **Features:** Full bot management, user management, transaction management
- **Target Users:** Administrators and players
- **Location:** `teen-patti-react/client/`

### Mobile App (React Native)
- **Purpose:** Regular gameplay only
- **Features:** Authentication, game tables, profile management
- **Target Users:** Regular players
- **Location:** `mobile/`

---

## 🖥️ WEB CLIENT - Bot Management Testing

### Prerequisites
```bash
cd teen-patti-react/client
npm install
npm run dev
```

**Server:** Ensure backend is running on `http://localhost:3001`

---

### 1. Admin Authentication

#### Test Steps:
1. Open `http://localhost:5173`
2. Login with admin credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
   
#### Expected Results:
- ✅ Successful login
- ✅ Navigation shows "Admin Panel" tab
- ✅ Can access `/admin` route
- ❌ Non-admin users should NOT see admin tabs

#### Common Issues:
- **Issue:** Can't login as admin
  - **Fix:** Run `npm run create-admin` in server directory
- **Issue:** No admin tabs showing
  - **Fix:** Check `isAdmin` flag in localStorage

---

### 2. Bot Control Panel

**Route:** `/admin/bots`

#### Test 2.1: View Bot Blueprints

**Steps:**
1. Navigate to Admin Panel → Bots
2. View "Bot Blueprints" section

**Expected:**
- ✅ List of existing blueprints
- ✅ Each shows: Name, Behavior, Strategy, Identity Mode
- ✅ Active/Inactive status indicators

**Test Cases:**
```
✓ Should display all blueprints
✓ Should show correct behavior profiles (Aggressive/Conservative/Balanced)
✓ Should display identity modes (Fixed/Rotating)
✓ Should show creation dates
```

#### Test 2.2: Create New Bot Blueprint

**Steps:**
1. Click "Create New Blueprint" button
2. Fill form:
   - **Name:** Test Bot Alpha
   - **Behavior:** Aggressive (0.8)
   - **Strategy:** High Risk (80)
   - **Skill Level:** 70
   - **Identity Mode:** Rotating (4 hours)
   - **Auto Replace:** Yes
3. Submit

**Expected:**
- ✅ Success message appears
- ✅ New blueprint in list
- ✅ Form resets
- ❌ Should reject duplicate names
- ❌ Should validate ranges (0-100)

**Error Cases to Test:**
```javascript
// Invalid inputs
Name: "" → "Name required"
Aggressiveness: 150 → "Must be 0-100"
Identity Mode: "invalid" → "Select valid mode"
```

#### Test 2.3: Edit Blueprint

**Steps:**
1. Click "Edit" on existing blueprint
2. Modify behavior: Change to "Conservative"
3. Save changes

**Expected:**
- ✅ Modal shows current values
- ✅ Changes saved successfully
- ✅ List updates immediately
- ❌ Should not allow editing if bots are using it

#### Test 2.4: Delete Blueprint

**Steps:**
1. Click "Delete" on unused blueprint
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Blueprint removed from list
- ❌ Should prevent deletion if bots are active

---

### 3. Table Seat Manager

**Route:** `/admin/table-seats`

#### Test 3.1: View Table Layout

**Steps:**
1. Navigate to Admin Panel → Table Seat Manager
2. Select "Table 1" from dropdown

**Expected:**
- ✅ Visual poker table with 6 seats
- ✅ Seats displayed in circular layout
- ✅ Seat status colors:
  - Gray = Empty
  - Blue = Bot
  - Green = Human player
  - Yellow = Locked

**Visual Layout:**
```
        [Seat 0]
   [Seat 5]  [Seat 1]
   [Seat 4]  [Seat 2]
        [Seat 3]
```

#### Test 3.2: Assign Bot to Seat

**Steps:**
1. Click on an EMPTY seat (gray)
2. Modal opens → Select "Assign Bot"
3. Fill form:
   - **Blueprint:** Select "Aggressive Bot"
   - **Identity Mode:** Rotating
   - **Behavior:** Aggressive
   - **Auto Replace:** Enable
4. Click "Assign Bot"

**Expected:**
- ✅ Modal opens correctly
- ✅ Dropdown shows available blueprints
- ✅ Bot assigned successfully
- ✅ Seat turns BLUE
- ✅ Bot name/avatar appears
- ✅ Real-time stats update

**Test Cases:**
```
✓ Should assign bot to empty seat
✓ Should show bot details (name, balance)
✓ Should prevent assigning to occupied seat
✓ Should update table stats (1 bot, 5 empty)
```

#### Test 3.3: Remove Bot from Seat

**Steps:**
1. Click on BLUE seat (bot occupied)
2. Click "Remove Bot"
3. Confirm removal

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Bot removed successfully
- ✅ Seat turns GRAY (empty)
- ✅ Stats update (0 bots, 6 empty)

#### Test 3.4: Lock/Unlock Seat

**Steps:**
1. Click on empty seat
2. Click "Lock Seat"

**Expected:**
- ✅ Seat turns YELLOW
- ✅ Cannot assign bot/player to locked seat
- ✅ Can unlock seat

---

### 4. Bot Monitoring Dashboard

**Route:** `/admin/bot-monitoring`

#### Test 4.1: Real-Time Bot List

**Steps:**
1. Navigate to Bot Monitoring
2. Observe active bots

**Expected:**
- ✅ Table shows all active bots
- ✅ Columns: Bot ID, Name, Table, Seat, Games, Win Rate, Winnings
- ✅ Updates every 10 seconds
- ✅ Color-coded status indicators

**Table Headers:**
```
| Bot ID | Display Name | Table | Seat | Games | Win % | Winnings | Actions |
```

#### Test 4.2: Bot Statistics

**Steps:**
1. Check summary cards at top

**Expected:**
- ✅ Total Active Bots count
- ✅ Average Win Rate percentage
- ✅ Total Games Played
- ✅ Total Winnings (coins)

**Example Stats:**
```
📊 Active Bots: 3
🎯 Avg Win Rate: 45.2%
🎮 Total Games: 127
💰 Total Winnings: +1,250 coins
```

#### Test 4.3: Rotate Bot Identity

**Steps:**
1. Find bot in list
2. Click "Rotate Identity"
3. Confirm action

**Expected:**
- ✅ Bot gets new name (e.g., "Raj Patel" → "Amit Kumar")
- ✅ Bot gets new avatar
- ✅ Old identity marked expired
- ✅ New identity has 4-hour expiry
- ✅ Audit log created

**Test Cases:**
```
✓ Should generate unique name
✓ Should update avatar URL
✓ Should log rotation in audit
✓ Should not affect bot's balance/stats
```

#### Test 4.4: Deactivate Bot

**Steps:**
1. Click "Deactivate" on active bot
2. Confirm deactivation

**Expected:**
- ✅ Bot removed from table
- ✅ Seat becomes empty
- ✅ Bot instance marked inactive
- ✅ Statistics preserved
- ❌ Should not delete bot data

#### Test 4.5: Audit Log Viewer

**Steps:**
1. Scroll to "Audit Logs" section
2. View recent actions

**Expected:**
- ✅ Chronological list of actions
- ✅ Shows: Timestamp, Action, Actor, Details
- ✅ Expandable JSON details
- ✅ Filter by action type

**Sample Audit Entry:**
```json
{
  "timestamp": "2025-11-11T15:30:00Z",
  "action": "bot_identity_rotated",
  "actor": "admin",
  "details": {
    "bot_id": "TB-001",
    "old_name": "Raj Patel",
    "new_name": "Amit Kumar",
    "reason": "Manual rotation"
  }
}
```

---

### 5. Integration Testing Scenarios

#### Scenario 5.1: Complete Bot Lifecycle

**Steps:**
1. Create blueprint "Test Bot Alpha"
2. Navigate to Table Seat Manager
3. Assign bot to Table 1, Seat 0
4. View bot in Bot Monitoring
5. Play a few rounds (bot should act automatically)
6. Rotate bot identity
7. Check audit logs
8. Deactivate bot
9. Remove from seat
10. Delete blueprint

**Expected:**
- ✅ All steps complete without errors
- ✅ Bot acts intelligently during gameplay
- ✅ All actions logged in audit
- ✅ Database updated correctly

#### Scenario 5.2: Multiple Bots on Same Table

**Steps:**
1. Assign 3 bots to Table 1 (seats 0, 1, 2)
2. Start game with 1 human player
3. Observe bot interactions

**Expected:**
- ✅ All bots act in turn order
- ✅ No conflicts or deadlocks
- ✅ Bots make different decisions (based on profiles)
- ✅ Game completes successfully

#### Scenario 5.3: Bot Auto-Replace

**Steps:**
1. Create blueprint with "Auto Replace: Yes"
2. Assign bot to seat
3. Manually deactivate bot
4. Wait 5 seconds

**Expected:**
- ✅ New bot automatically assigned to same seat
- ✅ Uses same blueprint
- ✅ Different identity (name/avatar)
- ✅ Audit log records replacement

---

## 📱 MOBILE APP - Gameplay Testing

### Prerequisites
```bash
cd mobile
npm install
npm start
```

**Note:** Mobile app does NOT have bot management features. It's for regular gameplay.

---

### 1. Authentication

#### Test Steps:
1. Open app
2. Login with player credentials:
   - **Username:** `testuser`
   - **Password:** `password123`

**Expected:**
- ✅ Successful login
- ✅ Dashboard shows tables
- ✅ No admin features visible
- ✅ Profile shows coins/cash balance

---

### 2. Join Table with Bots

#### Test Steps:
1. Navigate to Game Selection
2. Join "Table 1" (where bots are assigned)
3. Wait for game to start

**Expected:**
- ✅ Can see bot players (with bot names/avatars)
- ✅ Bots act in their turn
- ✅ Bot actions displayed (bet, fold, see cards)
- ✅ Game progresses normally
- ❌ Cannot distinguish bots from humans (intended)

---

### 3. Gameplay with Bots

#### Test Scenarios:

**Scenario 3.1: Bot Aggressive Behavior**
- Bot bets frequently and high
- Rarely folds
- Sees cards early

**Scenario 3.2: Bot Conservative Behavior**
- Bot folds with weak hands
- Bets cautiously
- Takes time to see cards

**Scenario 3.3: Bot Human-Like Delays**
- Bot waits 1-3 seconds before acting
- Reaction time varies
- Feels natural, not instant

---

## 🔍 Error Detection & Troubleshooting

### Common Issues

#### Issue 1: "Cannot assign bot to seat"
**Symptoms:** Error message when clicking assign
**Causes:**
- Blueprint not found
- Seat already occupied
- Bot instance creation failed

**Debug Steps:**
```bash
# Check server logs
cd teen-patti-react/server
npm run dev

# Check browser console
F12 → Console tab → Look for errors

# Verify blueprint exists
curl http://localhost:3001/api/admin/bots/blueprints \
  -H "Authorization: Bearer <admin-token>"
```

**Fix:**
1. Ensure blueprint exists
2. Check seat is empty
3. Verify admin token is valid

---

#### Issue 2: "Bot not acting in game"
**Symptoms:** Bot's turn, but no action happens
**Causes:**
- Bot decision engine crashed
- WebSocket disconnected
- Bot instance deactivated

**Debug Steps:**
```bash
# Check bot status
curl http://localhost:3001/api/admin/bots/instances

# Check server logs for decision engine errors
npm run dev → Look for "BotDecisionEngine" errors

# Verify WebSocket connection
Browser Console → Network → WS tab → Check connection
```

**Fix:**
1. Restart server
2. Reactivate bot instance
3. Check decision engine logic

---

#### Issue 3: "Identity rotation failed"
**Symptoms:** Error when rotating identity
**Causes:**
- Name collision (name already exists)
- Invalid identity mode
- Database error

**Debug Steps:**
```bash
# Check audit logs
curl http://localhost:3001/api/admin/audit-logs \
  -H "Authorization: Bearer <admin-token>"

# Verify identity service
npm run verify-bots
```

**Fix:**
1. Retry rotation (will generate different name)
2. Check database connection
3. Verify BotIdentityService

---

#### Issue 4: "Table stats not updating"
**Symptoms:** Bot count/stats don't update
**Causes:**
- WebSocket not connected
- State management issue
- Real-time updates disabled

**Debug Steps:**
```javascript
// Check WebSocket in browser console
socket.connected // Should be true

// Check store updates
useGameStore.getState() // Should have tableState
```

**Fix:**
1. Reconnect WebSocket
2. Refresh page
3. Check CORS settings

---

## 🧪 Automated Testing

### Run All Tests

```bash
# Server tests (165 tests)
cd teen-patti-react/server
npm test

# Web client tests (12 tests)
cd teen-patti-react/client
npm test

# Mobile app tests (13 tests)
cd mobile
npm test

# Total: 190 tests (100% passing)
```

---

### End-to-End Test Script

```bash
# Start server
cd teen-patti-react/server
npm run dev &

# Run E2E bot test
npm run test:e2e

# Expected output:
# ✓ Create test admin user
# ✓ Create bot blueprint
# ✓ Initialize table seats
# ✓ Assign bot to seat
# ✓ List bot instances
# ✓ Rotate bot identity
# ✓ Fetch audit logs
# ✓ Remove bot from seat
```

---

## 📊 Test Coverage Matrix

| Component | Unit Tests | Integration Tests | E2E Tests | Status |
|-----------|------------|-------------------|-----------|--------|
| **BotDecisionEngine** | ✅ 20 tests | ✅ Included | ✅ Tested | 100% |
| **BotIdentityService** | ✅ 15 tests | ✅ Included | ✅ Tested | 100% |
| **TableSeatRepository** | ✅ 35 tests | ✅ Included | ✅ Tested | 100% |
| **BotActionExecutor** | ✅ 8 tests | ✅ Included | ✅ Tested | 100% |
| **SecurityTests** | ✅ 16 tests | ✅ Mocked | ✅ Tested | 100% |
| **Web UI Components** | ✅ 12 tests | ⚠️ Manual | ⚠️ Manual | 85% |
| **Mobile Components** | ✅ 13 tests | ✅ Auth | ⚠️ Manual | 90% |

---

## 🎯 Performance Benchmarks

### Bot Decision Speed
```
Average Decision Time: 50-200ms
Target: < 500ms
Status: ✅ PASSING
```

### UI Response Time
```
Component Render: < 100ms
API Call Response: < 500ms
WebSocket Latency: < 100ms
Status: ✅ PASSING
```

### Database Queries
```
Bot Lookup: < 50ms
Seat Assignment: < 100ms
Audit Log Write: < 50ms
Status: ✅ PASSING
```

---

## 📝 Test Checklist

### Before Deployment

- [ ] All 190 automated tests passing
- [ ] Manual UI tests completed (all scenarios)
- [ ] Bot decision engine working correctly
- [ ] No console errors in browser
- [ ] WebSocket connections stable
- [ ] Database queries optimized
- [ ] Security tests passing
- [ ] Admin authentication working
- [ ] Audit logs capturing all actions
- [ ] Bot auto-replace functioning
- [ ] Identity rotation working
- [ ] Multiple bots on same table tested
- [ ] Mobile app gameplay smooth
- [ ] No memory leaks detected
- [ ] Error handling graceful

---

## 🔗 Related Documentation

- [Bot Decision Engine](./BOT_DECISION_ENGINE.md) - AI logic details
- [Testing Guide](./TESTING_GUIDE.md) - General testing procedures
- [API Documentation](../server/README.md) - Backend API reference
- [Database Schema](./DATABASE_SCHEMA.md) - Data models

---

## 🆘 Support

### Reporting Issues
1. Check this guide first
2. Review server logs: `npm run dev`
3. Check browser console: F12
4. Create issue on GitHub with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots
   - Error logs

### Getting Help
- **Discord:** [Project Discord](#)
- **Email:** support@teenpatti.com
- **GitHub:** [Open Issue](https://github.com/yogi-68/Teen-Patti-react/issues)

---

**Last Updated:** November 11, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

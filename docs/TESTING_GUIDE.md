# Bot Management System - Testing Guide

## Overview
This guide covers manual testing procedures and automated test scenarios for the Bot Management System.

## Manual Testing Checklist

### Backend API Testing

#### 1. Bot Blueprint Operations
- [ ] Create blueprint with all fields
- [ ] Create blueprint with minimal fields
- [ ] Retrieve all blueprints
- [ ] Retrieve single blueprint by ID
- [ ] Update blueprint
- [ ] Invalid blueprint creation (missing fields)

#### 2. Bot Instance Operations
- [ ] Assign bot to empty seat
- [ ] Assign bot to occupied seat (should fail)
- [ ] Assign with randomize identity mode
- [ ] Assign with blueprint name mode
- [ ] Assign with custom identity
- [ ] List all bot instances
- [ ] Filter bots by active status
- [ ] Filter bots by assignment status
- [ ] Deactivate active bot
- [ ] Deactivate inactive bot (should fail)
- [ ] Rotate bot identity
- [ ] Remove bot from table

#### 3. Avatar Management
- [ ] Upload JPG avatar (valid)
- [ ] Upload PNG avatar (valid)
- [ ] Upload oversized file (should fail)
- [ ] Upload non-image file (should fail)
- [ ] Generate random avatar with seed
- [ ] Generate random avatar without seed
- [ ] Generate avatar with each style
- [ ] Update bot instance avatar
- [ ] Update blueprint avatar
- [ ] Delete avatar from Cloudinary

#### 4. Analytics & Metrics
- [ ] Get analytics for bot with games
- [ ] Get analytics for new bot (0 games)
- [ ] Get leaderboard by winnings
- [ ] Get leaderboard by win rate
- [ ] Get leaderboard by games played
- [ ] Verify win rate calculations
- [ ] Verify ROI calculations

#### 5. Scheduler Tasks
- [ ] Trigger expireBots manually
- [ ] Trigger rotateIdentities manually
- [ ] Trigger deactivateIdleBots manually
- [ ] Trigger healthCheck manually
- [ ] Trigger cleanupInactiveBots manually
- [ ] Get scheduler status
- [ ] Verify cron schedules active

### Frontend Web Testing

#### 6. Bot Management Dashboard
- [ ] Access /admin/bots route
- [ ] Verify 4 tabs render
- [ ] Switch between tabs
- [ ] Refresh button works
- [ ] Socket connection established

#### 7. Control Panel
- [ ] View all bots
- [ ] Filter by active status
- [ ] Filter by assigned status
- [ ] Filter by unassigned status
- [ ] Bot card displays correctly
- [ ] Avatar displays (or placeholder)
- [ ] Stats display accurately
- [ ] Behavior badge shows correct color
- [ ] Rotate Identity button works
- [ ] Deactivate button works
- [ ] Disabled state when inactive
- [ ] Empty state when no bots

#### 8. Assignment Panel
- [ ] Blueprint dropdown populates
- [ ] Table ID input validation
- [ ] Seat index selection
- [ ] Identity mode selection
- [ ] Assign new bot successfully
- [ ] Error handling for occupied seat
- [ ] Available bots list displays
- [ ] Assign existing bot
- [ ] Success/error messages

#### 9. Stats Dashboard
- [ ] System overview cards display
- [ ] Performance table loads
- [ ] Sort by each column
- [ ] Insights cards show correct data
- [ ] Best performer calculation
- [ ] Most active bot correct
- [ ] Top earner correct

#### 10. Scheduler Panel
- [ ] Task status cards display
- [ ] Last run timestamps
- [ ] Manual trigger buttons work
- [ ] Stop all button works
- [ ] Reinitialize button works
- [ ] Cron schedule guide visible

#### 11. Avatar Upload Modal
- [ ] Modal opens on Avatar button
- [ ] Current avatar displays
- [ ] Upload button triggers file picker
- [ ] File upload shows progress
- [ ] Success message displays
- [ ] Generate random works
- [ ] Preview updates
- [ ] Modal closes properly
- [ ] Bot list refreshes after update

### Mobile App Testing

#### 12. Bot Management Screen (Mobile)
- [ ] Access from admin bottom tabs
- [ ] 4 tabs render horizontally
- [ ] Swipe between tabs
- [ ] Refresh button works

#### 13. Control Panel (Mobile)
- [ ] Fetch bots on load
- [ ] Filter buttons display with counts
- [ ] Horizontal scroll filters
- [ ] Bot cards render correctly
- [ ] Avatar or placeholder shows
- [ ] Stats formatted properly
- [ ] Rotate Identity alert shows
- [ ] Deactivate alert shows
- [ ] Success/error feedback
- [ ] Loading state displays
- [ ] Empty state shows

#### 14. Placeholder Panels (Mobile)
- [ ] Assignment panel shows message
- [ ] Stats panel shows message
- [ ] Scheduler panel shows message

### Integration Testing

#### 15. Socket.IO Events
- [ ] bot:assigned event received
- [ ] bot:removed event received
- [ ] bot:identityRotated event received
- [ ] bot:avatarUpdated event received
- [ ] UI updates in real-time
- [ ] Multiple clients sync

#### 16. Game Loop Integration
- [ ] Bot makes decision on turn
- [ ] Decision based on hand strength
- [ ] Pot odds calculation correct
- [ ] Behavior profile influences decision
- [ ] Bot folds weak hands
- [ ] Bot raises strong hands
- [ ] Bot side show works
- [ ] Bot show works
- [ ] Game completion updates stats

#### 17. End-to-End Scenarios
- [ ] Create blueprint → Assign → Play game → View stats
- [ ] Upload avatar → Verify in game table
- [ ] Rotate identity → Verify new name in game
- [ ] Deactivate bot → Bot leaves table
- [ ] Scheduler runs → Bots updated
- [ ] Multiple bots at same table

### Performance Testing

#### 18. Load Testing
- [ ] 10 concurrent bot assignments
- [ ] 50 bot instances active
- [ ] 100+ bot database records
- [ ] Avatar uploads under load
- [ ] Socket events with many clients
- [ ] Analytics queries with large dataset

#### 19. Error Recovery
- [ ] Database connection loss
- [ ] Cloudinary service unavailable
- [ ] Socket disconnection
- [ ] Invalid data handling
- [ ] Network timeout handling

---

## Automated Testing Scripts

### Test Bot Creation
```bash
# Test script: test-bot-creation.sh
curl -X POST http://localhost:3001/api/admin/bots/blueprint \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "behavior_profile_name": "balanced",
    "default_balance_coins": 10000
  }'
```

### Test Bot Assignment
```bash
# Test script: test-bot-assignment.sh
curl -X POST http://localhost:3001/api/admin/tables/1/seats/0/assign-bot \
  -H "Content-Type: application/json" \
  -d '{
    "bot_blueprint_id": "YOUR_BLUEPRINT_ID",
    "identity_mode": "randomize"
  }'
```

### Test Avatar Upload
```bash
# Test script: test-avatar-upload.sh
curl -X POST http://localhost:3001/api/admin/bots/avatars/upload \
  -F "avatar=@test-avatar.jpg"
```

### Test Scheduler
```bash
# Test script: test-scheduler.sh
curl -X POST http://localhost:3001/api/test/bots/scheduler/trigger/healthCheck
```

### Load Test Bots
```bash
# Test script: load-test.sh
for i in {1..10}
do
  curl -X POST http://localhost:3001/api/admin/tables/1/seats/$i/assign-bot \
    -H "Content-Type: application/json" \
    -d "{\"bot_blueprint_id\": \"BLUEPRINT_ID\", \"identity_mode\": \"randomize\"}" &
done
wait
echo "Load test complete"
```

---

## Test Data

### Sample Blueprint JSON
```json
{
  "name": "Aggressive Test Bot",
  "behavior_profile_name": "aggressive",
  "default_balance_coins": 15000,
  "default_balance_cash": 0,
  "description": "High-aggression bot for testing",
  "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=test"
}
```

### Sample Assignment JSON
```json
{
  "bot_blueprint_id": "12345-67890-abcde",
  "identity_mode": "custom",
  "display_name_override": "Test Bot Alpha",
  "bot_id_override": "TBA-0001",
  "behavior_profile_name": "bluffing"
}
```

### Sample Hand for Decision Testing
```json
{
  "cards": [
    {"rank": "A", "suit": "hearts"},
    {"rank": "A", "suit": "diamonds"},
    {"rank": "A", "suit": "clubs"}
  ],
  "pot": 5000,
  "current_bet": 500,
  "bot_balance": 10000,
  "behavior_profile_name": "balanced"
}
```

---

## Expected Results

### Bot Decision Engine

**Trail (AAA) - Strong Hand:**
- Should always see cards if blind
- Should raise aggressively
- Should accept side shows
- Should show at the end

**High Card - Weak Hand:**
- Conservative bots: Fold early
- Aggressive bots: May bluff
- Should rarely raise
- Should decline side shows

**Pure Sequence - Medium-Strong:**
- Most bots: See cards
- Balanced strategy
- Conditional raises
- Accept side shows if pot is good

### Analytics Calculations

**Win Rate Formula:**
```
win_rate = games_won / games_played
```

**ROI Formula:**
```
roi = total_winnings / total_bet_amount
```

**Expected Values:**
- Win rate: 0.0 - 1.0 (0% - 100%)
- ROI: Can be negative (losses) or positive (profits)
- Average winnings: total_winnings / games_played

---

## Bug Reporting Template

```markdown
**Title:** [Short description]

**Environment:**
- Server: Development/Production
- Client: Web/Mobile
- Browser/Device: 
- Version: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Screenshots/Logs:**

**Severity:** Critical / High / Medium / Low
```

---

## Test Coverage Goals

### Backend
- [ ] 80%+ code coverage
- [ ] All API endpoints tested
- [ ] Error scenarios covered
- [ ] Edge cases handled

### Frontend
- [ ] Component rendering tests
- [ ] User interaction tests
- [ ] State management tests
- [ ] Socket event tests

### Integration
- [ ] Full user flows tested
- [ ] Cross-component interactions
- [ ] Real-time sync verified
- [ ] Performance benchmarks met

---

## Continuous Testing

### CI/CD Pipeline (Future)
```yaml
# .github/workflows/test.yml
name: Test Bot System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
npm run test:quick
```

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0

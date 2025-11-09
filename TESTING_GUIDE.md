# Bot Management System - Testing Guide

## 📋 Table of Contents
1. [Setup & Prerequisites](#setup--prerequisites)
2. [Unit Testing](#unit-testing)
3. [API Testing](#api-testing)
4. [Integration Testing](#integration-testing)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Performance Testing](#performance-testing)

---

## 🔧 Setup & Prerequisites

### 1. Install Dependencies
```bash
cd teen-patti-react/server
npm install
```

### 2. Set Up MongoDB
Make sure MongoDB is running and create a test database:
```bash
# If using MongoDB locally
mongod --dbpath ./data/db

# Or use MongoDB Atlas (cloud)
# Update connection string in server/src/config/database.ts
```

### 3. Environment Variables
Create `.env` file in `server/` directory:
```env
MONGODB_URI=mongodb://localhost:27017/teenpatti_bots_test
PORT=5000
NODE_ENV=development
```

### 4. Initialize Database
The MongoDB models will auto-create collections on first use. No migration needed.

---

## 🧪 Unit Testing

### Test 1: Bot Identity Generation

**File:** Create `server/src/tests/BotIdentityService.test.ts`

```typescript
import {
  generateBotDisplayName,
  generateBotId,
  generateUniqueBotName,
  clearRecentNamesCache
} from '../services/BotIdentityService';

describe('BotIdentityService', () => {
  beforeEach(() => {
    clearRecentNamesCache();
  });

  test('should generate display name with first and last name', () => {
    const name = generateBotDisplayName('{{first}} {{last}}');
    expect(name).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    expect(name.split(' ')).toHaveLength(2);
  });

  test('should generate unique bot IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      const id = generateBotId(`TestName${i}`);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });

  test('should generate bot ID with correct format', () => {
    const id = generateBotId('Rohan Sharma');
    expect(id).toMatch(/^[A-Z]{2}-\d{4}$/); // e.g., RS-1234
  });

  test('should not repeat names in LRU cache', async () => {
    const names = [];
    for (let i = 0; i < 10; i++) {
      const name = await generateUniqueBotName('{{first}} {{last}}');
      expect(names).not.toContain(name);
      names.push(name);
    }
  });
});
```

**Run Test:**
```bash
cd server
npm test -- BotIdentityService.test.ts
```

**Expected Output:**
```
✓ should generate display name with first and last name (5ms)
✓ should generate unique bot IDs (12ms)
✓ should generate bot ID with correct format (3ms)
✓ should not repeat names in LRU cache (15ms)

Tests: 4 passed, 4 total
```

---

### Test 2: Bot Avatar Service

**File:** Create `server/src/tests/BotAvatarService.test.ts`

```typescript
import {
  getRandomAvatar,
  getAvatarById,
  getAllAvatars,
  clearAvatarCache
} from '../services/BotAvatarService';

describe('BotAvatarService', () => {
  beforeEach(() => {
    clearAvatarCache();
  });

  test('should return valid avatar URL', () => {
    const avatar = getRandomAvatar();
    expect(avatar).toBeTruthy();
    expect(typeof avatar).toBe('string');
  });

  test('should filter avatars by gender', () => {
    const maleAvatar = getRandomAvatar('male');
    const femaleAvatar = getRandomAvatar('female');
    expect(maleAvatar).toBeTruthy();
    expect(femaleAvatar).toBeTruthy();
  });

  test('should not repeat recently used avatars', () => {
    const used = new Set();
    for (let i = 0; i < 10; i++) {
      const avatar = getRandomAvatar();
      expect(used.has(avatar)).toBe(false);
      used.add(avatar);
    }
  });

  test('should get avatar by ID', () => {
    const avatar = getAvatarById('avatar_01');
    expect(avatar).toBeTruthy();
  });

  test('should return all avatars', () => {
    const avatars = getAllAvatars();
    expect(Array.isArray(avatars)).toBe(true);
    expect(avatars.length).toBeGreaterThan(0);
  });
});
```

**Run Test:**
```bash
npm test -- BotAvatarService.test.ts
```

---

### Test 3: Bot Repositories

**File:** Create `server/src/tests/BotRepositories.test.ts`

```typescript
import mongoose from 'mongoose';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository';
import BotInstanceRepository from '../repositories/BotInstanceRepository';
import { BehaviorProfiles } from '../models/BotBlueprint';

describe('Bot Repositories', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/teenpatti_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('BotBlueprintRepository', () => {
    test('should create bot blueprint', async () => {
      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50
      });

      expect(blueprint).toBeTruthy();
      expect(blueprint.bot_blueprint_id).toBeTruthy();
      expect(blueprint.behavior_profile.aggressiveness).toBe(50);
    });

    test('should find blueprint by ID', async () => {
      const created = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.AGGRESSIVE
      });

      const found = await BotBlueprintRepository.findById(created.bot_blueprint_id);
      expect(found).toBeTruthy();
      expect(found?.bot_blueprint_id).toBe(created.bot_blueprint_id);
    });

    test('should update blueprint', async () => {
      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BEGINNER
      });

      const updated = await BotBlueprintRepository.update(blueprint.bot_blueprint_id, {
        default_level: 75
      });

      expect(updated?.default_level).toBe(75);
    });
  });

  describe('BotInstanceRepository', () => {
    test('should create bot instance', async () => {
      const instance = await BotInstanceRepository.create({
        bot_blueprint_id: 'test-blueprint-id',
        display_name: 'Test Bot',
        bot_id: 'TB-1234',
        assigned_table_id: 1,
        assigned_seat_index: 0
      });

      expect(instance).toBeTruthy();
      expect(instance.bot_instance_id).toBeTruthy();
      expect(instance.display_name).toBe('Test Bot');
    });

    test('should find instance by table and seat', async () => {
      await BotInstanceRepository.create({
        bot_blueprint_id: 'test-blueprint-id',
        display_name: 'Seat Bot',
        bot_id: 'SB-5678',
        assigned_table_id: 2,
        assigned_seat_index: 3
      });

      const found = await BotInstanceRepository.findByTableAndSeat(2, 3);
      expect(found).toBeTruthy();
      expect(found?.display_name).toBe('Seat Bot');
    });

    test('should check name collision', async () => {
      await BotInstanceRepository.create({
        bot_blueprint_id: 'test-blueprint-id',
        display_name: 'Collision Test',
        bot_id: 'CT-9999'
      });

      const exists = await BotInstanceRepository.displayNameExists('Collision Test');
      expect(exists).toBe(true);

      const notExists = await BotInstanceRepository.displayNameExists('Non Existent');
      expect(notExists).toBe(false);
    });
  });
});
```

---

## 🌐 API Testing

### Using Postman or Thunder Client

#### Test 1: Assign Bot to Seat

**Request:**
```http
POST http://localhost:5000/admin/tables/1/seats/0/assign-bot
Content-Type: application/json

{
  "identity_mode": "randomize",
  "behavior_profile_name": "balanced"
}
```

**Expected Response (201):**
```json
{
  "status": "ok",
  "message": "Bot assigned successfully",
  "bot_instance": {
    "bot_instance_id": "6543a1b2c3d4e5f6g7h8i9j0",
    "display_name": "Rohan Sharma",
    "bot_id": "RS-8732",
    "avatar_url": "/avatars/bot_avatar_03.png",
    "assigned_table_id": 1,
    "assigned_seat_index": 0,
    "expires_at": "2025-11-10T03:45:00.000Z"
  }
}
```

**Validation Checks:**
- ✅ Status code is 201
- ✅ `bot_instance_id` is a valid UUID/ObjectId
- ✅ `display_name` matches pattern: "FirstName LastName"
- ✅ `bot_id` matches pattern: "XX-NNNN"
- ✅ `assigned_table_id` and `assigned_seat_index` match request
- ✅ `expires_at` is set (for randomize mode)

---

#### Test 2: Assign Bot with Custom Name

**Request:**
```http
POST http://localhost:5000/admin/tables/1/seats/1/assign-bot
Content-Type: application/json

{
  "identity_mode": "persistent",
  "display_name_override": "Lucky Player",
  "bot_id_override": "LP-1111",
  "behavior_profile_name": "aggressive"
}
```

**Expected Response (201):**
```json
{
  "status": "ok",
  "message": "Bot assigned successfully",
  "bot_instance": {
    "bot_instance_id": "...",
    "display_name": "Lucky Player",
    "bot_id": "LP-1111",
    "assigned_table_id": 1,
    "assigned_seat_index": 1,
    "expires_at": null
  }
}
```

---

#### Test 3: Try Assigning Bot to Occupied Seat

**Request:**
```http
POST http://localhost:5000/admin/tables/1/seats/0/assign-bot
Content-Type: application/json

{
  "identity_mode": "randomize"
}
```

**Expected Response (409):**
```json
{
  "error": "Seat already occupied by a bot"
}
```

---

#### Test 4: Remove Bot from Seat

**Request:**
```http
POST http://localhost:5000/admin/tables/1/seats/0/remove-bot
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "message": "Bot removed successfully",
  "bot_instance_id": "6543a1b2c3d4e5f6g7h8i9j0"
}
```

---

#### Test 5: Get All Bot Blueprints

**Request:**
```http
GET http://localhost:5000/admin/bots
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "blueprints": [
    {
      "bot_blueprint_id": "...",
      "display_name_template": "{{first}} {{last}}",
      "behavior_profile": {
        "aggressiveness": 50,
        "risk_tolerance": 50,
        "reaction_delay_ms": 2000,
        "error_rate": 7,
        "skill_level": 50
      },
      "default_level": 50,
      "persistent": false,
      "is_active": true
    }
  ]
}
```

---

#### Test 6: Rotate Bot Identity

**Request:**
```http
POST http://localhost:5000/admin/bot_instances/{instance_id}/rotate-identity
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "message": "Bot identity rotated successfully",
  "new_identity": {
    "display_name": "Priya Kumar",
    "bot_id": "PK-4567"
  }
}
```

---

#### Test 7: Get Bot Instances for Table

**Request:**
```http
GET http://localhost:5000/admin/bot_instances?table_id=1
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "bot_instances": [
    {
      "bot_instance_id": "...",
      "display_name": "Rohan Sharma",
      "bot_id": "RS-8732",
      "assigned_table_id": 1,
      "assigned_seat_index": 0,
      "balance_coins": 10000,
      "is_active": true
    }
  ]
}
```

---

## 🔗 Integration Testing

### Test Scenario: Full Bot Lifecycle

**Steps:**

1. **Create Blueprint**
   ```bash
   # POST /admin/bots (not implemented yet, use default)
   ```

2. **Assign Bot to Table**
   ```bash
   curl -X POST http://localhost:5000/admin/tables/1/seats/0/assign-bot \
     -H "Content-Type: application/json" \
     -d '{"identity_mode": "randomize", "behavior_profile_name": "balanced"}'
   ```

3. **Verify Bot Created**
   ```bash
   curl http://localhost:5000/admin/bot_instances?table_id=1
   ```

4. **Check MongoDB**
   ```bash
   mongo teenpatti_bots_test
   db.botinstances.find().pretty()
   ```

5. **Rotate Identity**
   ```bash
   curl -X POST http://localhost:5000/admin/bot_instances/{instance_id}/rotate-identity
   ```

6. **Remove Bot**
   ```bash
   curl -X POST http://localhost:5000/admin/tables/1/seats/0/remove-bot
   ```

7. **Verify Bot Deactivated**
   ```bash
   curl http://localhost:5000/admin/bot_instances?table_id=1
   # Should return empty array
   ```

---

## ✅ Manual Testing Checklist

### Identity Generation
- [ ] Generate 100 bot names - no duplicates
- [ ] Names follow pattern: "FirstName LastName"
- [ ] Bot IDs are unique (XX-NNNN format)
- [ ] LRU cache prevents recent name reuse
- [ ] Different identity modes work (persistent/ephemeral/randomize)

### Avatar System
- [ ] Random avatars returned
- [ ] No avatar repetition in 10 consecutive calls
- [ ] Gender filtering works
- [ ] Avatar URLs are valid

### Bot Assignment
- [ ] Can assign bot to empty seat
- [ ] Cannot assign bot to occupied seat (409 error)
- [ ] Bot appears in database
- [ ] Expiry dates set correctly based on mode
- [ ] Balance initialized correctly

### Bot Removal
- [ ] Can remove bot from seat
- [ ] Bot marked inactive (not deleted)
- [ ] Cannot remove from empty seat (404 error)

### Identity Rotation
- [ ] New name generated
- [ ] New bot ID generated
- [ ] No collision with existing names/IDs
- [ ] Database updated correctly

### Repository Operations
- [ ] Create blueprint
- [ ] Find blueprint by ID
- [ ] Update blueprint
- [ ] List all blueprints
- [ ] Create instance
- [ ] Find instance by table/seat
- [ ] Check name collisions
- [ ] Cleanup expired bots

---

## ⚡ Performance Testing

### Load Test: 100 Concurrent Bot Assignments

**Using Apache Bench:**
```bash
ab -n 100 -c 10 -p bot_assign.json -T application/json \
   http://localhost:5000/admin/tables/1/seats/0/assign-bot
```

**bot_assign.json:**
```json
{
  "identity_mode": "randomize",
  "behavior_profile_name": "balanced"
}
```

**Expected Results:**
- Average response time: < 200ms
- No failures
- All bot names unique
- No database errors

---

### Stress Test: Name Generation Speed

**Script:** `test_name_generation_speed.ts`
```typescript
import { generateUniqueBotName } from '../services/BotIdentityService';

async function testSpeed() {
  const start = Date.now();
  const promises = [];
  
  for (let i = 0; i < 1000; i++) {
    promises.push(generateUniqueBotName('{{first}} {{last}}'));
  }
  
  const names = await Promise.all(promises);
  const duration = Date.now() - start;
  
  console.log(`Generated ${names.length} unique names in ${duration}ms`);
  console.log(`Average: ${duration / names.length}ms per name`);
  
  // Check uniqueness
  const unique = new Set(names);
  console.log(`Unique names: ${unique.size} / ${names.length}`);
}

testSpeed();
```

**Expected:**
- 1000 names in < 2 seconds
- 100% uniqueness

---

## 🐛 Debugging Tips

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# View collections
mongosh teenpatti_bots_test --eval "db.getCollectionNames()"
```

### View Bot Data
```bash
# All bot instances
mongosh teenpatti_bots_test --eval "db.botinstances.find().pretty()"

# Active bots only
mongosh teenpatti_bots_test --eval "db.botinstances.find({is_active: true}).pretty()"

# Bots by table
mongosh teenpatti_bots_test --eval "db.botinstances.find({assigned_table_id: 1}).pretty()"
```

### Check Logs
```bash
# Server logs
tail -f server/logs/app.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

---

## 📊 Success Criteria

### Unit Tests
- ✅ All tests passing
- ✅ Code coverage > 80%

### API Tests
- ✅ All endpoints return correct status codes
- ✅ Response schemas match documentation
- ✅ Error handling works correctly

### Integration Tests
- ✅ Full lifecycle works end-to-end
- ✅ Database state consistent
- ✅ No race conditions

### Performance
- ✅ Name generation < 10ms per name
- ✅ API responses < 200ms
- ✅ 100 concurrent requests handled
- ✅ No memory leaks

---

## 🎯 Next Steps After Testing

1. **Add Authentication Middleware** - Protect admin routes
2. **Implement Audit Logging** - Track all bot actions
3. **Add Socket Events** - Real-time table updates
4. **Build Admin UI** - Visual bot management
5. **Implement Bot Engine** - Actual gameplay logic

**Testing Progress Tracking:** Use the todo list to mark completed tests!

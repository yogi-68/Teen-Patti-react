# Task 7: Bot Cleanup & Identity Rotation Scheduler

## Overview
Automated maintenance system for bot instances using node-cron scheduled tasks. Handles bot expiration, identity rotation, idle cleanup, and system health monitoring.

## Architecture

### BotScheduler Service
**Location**: `server/src/services/BotScheduler.ts`

The scheduler manages 5 automated tasks:

| Task Name | Schedule | Description |
|-----------|----------|-------------|
| `cleanup-expired` | Every hour (`0 * * * *`) | Deactivates bots past their expiration date |
| `rotate-identities` | Every 6 hours (`0 */6 * * *`) | Changes identities for 20% of randomized bots |
| `deactivate-idle` | Daily at 2 AM (`0 2 * * *`) | Deactivates bots inactive for 7+ days |
| `reset-test-bots` | Weekly Sunday at 3 AM (`0 3 * * 0`) | Clears stats for test bots |
| `health-check` | Every 30 minutes (`*/30 * * * *`) | Logs system health metrics |

## Features

### 1. Automatic Bot Expiration
- Checks `expires_at` field against current time
- Deactivates expired bots (`is_active = false`)
- Emits `bot:removed` socket event if bot was assigned to table
- Logs each expiration action

### 2. Identity Rotation
- Targets only `randomized: true` bots
- Rotates 20% of eligible bots (min 1, max 10)
- Generates new `display_name` and `bot_id` using `BotIdentityService`
- Emits `bot:identityRotated` socket event with old/new identity
- Prevents identity stagnation for ephemeral bots

### 3. Idle Bot Cleanup
- Detects bots with `last_game_at` older than 7 days
- Automatically deactivates idle bots
- Prevents database bloat from abandoned bots
- Logs deactivation with last game timestamp

### 4. Test Bot Reset
- Identifies bots with "Test" prefix or `TEST-` bot_id
- Prepares for stat reset (requires repository method)
- Prevents test data pollution

### 5. Health Monitoring
- Queries bot system statistics every 30 minutes
- Logs: total bots, active bots, bots per table
- Early warning system for anomalies

## API Endpoints

### GET /api/admin/scheduler/status
Get status of all scheduled tasks.

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "name": "cleanup-expired",
      "running": true,
      "description": "Clean up expired bots (hourly)"
    }
  ],
  "total": 5
}
```

### POST /api/admin/scheduler/trigger/:taskName
Manually trigger a scheduled task immediately.

**Example:**
```bash
POST /api/admin/scheduler/trigger/cleanup-expired
```

**Response:**
```json
{
  "success": true,
  "message": "Task \"cleanup-expired\" executed successfully",
  "taskName": "cleanup-expired"
}
```

### POST /api/admin/scheduler/stop/:taskName
Stop a specific scheduled task.

**Example:**
```bash
POST /api/admin/scheduler/stop/rotate-identities
```

### POST /api/admin/scheduler/stop-all
Stop all scheduled tasks.

### POST /api/admin/scheduler/reinitialize
Reinitialize all scheduled tasks (useful after configuration changes).

### GET /api/admin/scheduler/tasks
Get list of all available tasks with schedules and descriptions.

## Integration

### Server Startup
```typescript
// server/src/index.ts
import { BotScheduler } from './services/BotScheduler.js';

async function startServer() {
  // ... database, socket initialization
  
  // Initialize Bot Scheduler
  BotScheduler.initialize();
  console.log('✅ Bot Scheduler initialized');
  
  // Start server
  server.listen(PORT);
}
```

### Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  BotScheduler.stopAll();
  await database.disconnect();
  server.close();
});

process.on('SIGINT', async () => {
  BotScheduler.stopAll();
  await database.disconnect();
  server.close();
  process.exit(0);
});
```

## Socket Events

### bot:removed
Emitted when expired bot is cleaned up.

**Payload:**
```typescript
{
  tableId: number,
  seatIndex: number,
  botInstanceId: string
}
```

### bot:identityRotated
Emitted when bot identity is rotated.

**Payload:**
```typescript
{
  tableId: number,
  seatIndex: number,
  botInstanceId: string,
  identityChange: {
    old_identity: {
      display_name: string,
      bot_id: string
    },
    new_identity: {
      display_name: string,
      bot_id: string
    }
  }
}
```

## Cron Expressions

| Expression | Meaning |
|------------|---------|
| `0 * * * *` | Every hour at minute 0 |
| `0 */6 * * *` | Every 6 hours |
| `0 2 * * *` | Every day at 2:00 AM |
| `0 3 * * 0` | Every Sunday at 3:00 AM |
| `*/30 * * * *` | Every 30 minutes |

All times are in **UTC timezone**.

## Testing

### Manual Task Trigger
```bash
# Trigger cleanup task
curl -X POST https://teen-patti-server.onrender.com/api/admin/scheduler/trigger/cleanup-expired

# Trigger identity rotation
curl -X POST https://teen-patti-server.onrender.com/api/admin/scheduler/trigger/rotate-identities

# Check health
curl -X POST https://teen-patti-server.onrender.com/api/admin/scheduler/trigger/health-check
```

### Check Task Status
```bash
curl https://teen-patti-server.onrender.com/api/admin/scheduler/status
```

### View Available Tasks
```bash
curl https://teen-patti-server.onrender.com/api/admin/scheduler/tasks
```

## Configuration

### Adjusting Schedules
Edit `BotScheduler.initialize()` method:

```typescript
// Change cleanup to run every 30 minutes
this.scheduleTask('cleanup-expired', '*/30 * * * *', () => {
  this.cleanupExpiredBots();
});

// Change rotation to every 12 hours
this.scheduleTask('rotate-identities', '0 */12 * * *', () => {
  this.rotateRandomBotIdentities();
});
```

### Rotation Percentage
Edit `rotateRandomBotIdentities()` method:

```typescript
// Change to 50% rotation (currently 20%)
const rotateCount = Math.max(1, Math.min(10, Math.ceil(rotatableBots.length * 0.5)));
```

### Idle Threshold
Edit `deactivateIdleBots()` method:

```typescript
// Change to 14 days (currently 7)
const fourteenDaysAgo = new Date();
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
```

## Dependencies
- `node-cron`: ^3.0.3 - Cron job scheduler
- `@types/node-cron`: ^3.0.11 - TypeScript types

## Logs

### Startup
```
⏰ Initializing Bot Scheduler...
📅 Scheduled task: cleanup-expired (0 * * * *)
📅 Scheduled task: rotate-identities (0 */6 * * *)
📅 Scheduled task: deactivate-idle (0 2 * * *)
📅 Scheduled task: reset-test-bots (0 3 * * 0)
📅 Scheduled task: health-check (*/30 * * * *)
✅ Bot Scheduler initialized with 5 tasks
```

### Task Execution
```
⏰ Running scheduled task: cleanup-expired
🗑️ Expiring bot: Player_123 (bot-abc-123)
✅ Cleaned up 3 expired bot(s)

⏰ Running scheduled task: rotate-identities
🔄 Rotated identity: Player_456 → Player_789
✅ Rotated identities for 2 bot(s)

⏰ Running scheduled task: health-check
📊 Bot System Health Check:
   Total Bots: 15
   Active Bots: 12
   Tables with Bots: 3
   - Table 1: 4 bot(s)
   - Table 2: 5 bot(s)
   - Table 3: 3 bot(s)
```

## Troubleshooting

### Tasks Not Running
1. Check if scheduler is initialized: `GET /api/admin/scheduler/status`
2. Verify cron expressions are valid
3. Check server logs for error messages
4. Manually trigger task to test: `POST /api/admin/scheduler/trigger/:taskName`

### Identity Rotation Not Working
- Ensure bots have `randomized: true` flag
- Check `BotIdentityService.generateBotIdentity()` is working
- Verify socket events are being emitted

### Expired Bots Not Cleaning
- Verify `expires_at` field is set correctly
- Check bot `is_active` status
- Ensure `BotInstanceRepository.update()` is functional

## Future Enhancements
1. Add `resetStats()` method to BotInstanceRepository
2. Configurable task schedules via environment variables
3. Slack/email notifications for critical tasks
4. Task execution history and audit log
5. Dynamic task scheduling via admin UI
6. Retry mechanism for failed tasks

## Related Files
- `server/src/services/BotScheduler.ts` - Main scheduler service
- `server/src/routes/botSchedulerRoutes.ts` - Admin API endpoints
- `server/src/index.ts` - Server initialization with scheduler
- `server/src/services/BotIdentityService.ts` - Identity generation
- `server/src/repositories/BotInstanceRepository.ts` - Database operations

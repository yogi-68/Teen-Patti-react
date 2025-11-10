# Bot Management System API Documentation

**Version:** 1.0.0  
**Base URL:** `https://your-api-domain.com/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Bot Blueprints](#bot-blueprints)
3. [Bot Instances](#bot-instances)
4. [Table Seats](#table-seats)
5. [Bot Scheduler](#bot-scheduler)
6. [Bot Analytics](#bot-analytics)
7. [Audit Logs](#audit-logs)
8. [Error Codes](#error-codes)

---

## Authentication

All admin endpoints require authentication with an admin role.

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Permissions
- **Admin Role Required:** All bot management endpoints
- **User Verification:** JWT token must be valid and not expired

---

## Bot Blueprints

Bot blueprints define reusable bot configurations.

### GET /admin/bots/blueprints
Get all bot blueprints.

**Response:**
```json
{
  "blueprints": [
    {
      "bot_blueprint_id": "blueprint_123",
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
      "created_at": "2025-11-10T10:00:00Z"
    }
  ]
}
```

### POST /admin/bots/blueprints
Create a new bot blueprint.

**Request:**
```json
{
  "display_name_template": "{{first}} {{last}}",
  "behavior_profile": {
    "aggressiveness": 70,
    "risk_tolerance": 65,
    "reaction_delay_ms": 1500,
    "error_rate": 5,
    "skill_level": 60
  },
  "default_level": 60,
  "persistent": false
}
```

**Response:**
```json
{
  "bot_blueprint_id": "blueprint_456",
  "display_name_template": "{{first}} {{last}}",
  "behavior_profile": { "..." },
  "created_at": "2025-11-10T10:05:00Z"
}
```

### PATCH /admin/bots/:blueprintId
Update an existing bot blueprint.

**Request:**
```json
{
  "display_name_template": "{{first}} P{{digit}}",
  "behavior_profile": {
    "aggressiveness": 80,
    "risk_tolerance": 70,
    "reaction_delay_ms": 1200,
    "error_rate": 3,
    "skill_level": 70
  }
}
```

---

## Bot Instances

Bot instances are active bots created from blueprints.

### POST /admin/bots/assign
Assign a bot to a table seat.

**Request:**
```json
{
  "table_id": 1,
  "seat_index": 2,
  "bot_blueprint_id": "blueprint_123",
  "balance_coins": 10000,
  "balance_cash": 0,
  "ttl_minutes": 60
}
```

**Response:**
```json
{
  "botInstance": {
    "bot_instance_id": "instance_789",
    "bot_blueprint_id": "blueprint_123",
    "display_name": "John Smith",
    "bot_id": "RS-8732",
    "avatar_url": "https://cdn.example.com/avatars/avatar_42.png",
    "assigned_table_id": 1,
    "assigned_seat_index": 2,
    "balance_coins": 10000,
    "is_active": true,
    "expires_at": "2025-11-10T11:00:00Z"
  },
  "seat": {
    "seat_id": "seat_001",
    "table_id": 1,
    "seat_index": 2,
    "occupant_type": "bot",
    "occupant_id": "instance_789",
    "occupant_name": "John Smith",
    "occupant_avatar": "https://cdn.example.com/avatars/avatar_42.png",
    "version": 1
  }
}
```

**Error Responses:**
- `400` - Seat already occupied
- `400` - Per-table bot limit reached (max 4 bots)
- `400` - Bot assignment disabled (feature flag)
- `404` - Blueprint not found
- `409` - Optimistic locking conflict (version mismatch)

### POST /admin/bots/remove
Remove a bot from a seat.

**Request:**
```json
{
  "table_id": 1,
  "seat_index": 2,
  "reason": "Performance testing complete"
}
```

**Response:**
```json
{
  "message": "Bot removed successfully",
  "seat": {
    "seat_id": "seat_001",
    "table_id": 1,
    "seat_index": 2,
    "occupant_type": "empty",
    "occupant_id": null,
    "version": 2
  }
}
```

### GET /admin/bot_instances
List all active bot instances.

**Query Parameters:**
- `table_id` (optional): Filter by table
- `active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "instances": [
    {
      "bot_instance_id": "instance_789",
      "display_name": "John Smith",
      "assigned_table_id": 1,
      "assigned_seat_index": 2,
      "is_active": true,
      "games_played": 15,
      "total_winnings_coins": 5000
    }
  ]
}
```

### POST /admin/bot_instances/:id/rotate-identity
Rotate a bot's identity (name, ID, avatar).

**Response:**
```json
{
  "bot_instance_id": "instance_789",
  "display_name": "Sarah Johnson",
  "bot_id": "PT-4392",
  "avatar_url": "https://cdn.example.com/avatars/avatar_18.png",
  "updated_at": "2025-11-10T10:30:00Z"
}
```

### POST /admin/bot_instances/:id/deactivate
Deactivate a bot instance.

**Response:**
```json
{
  "message": "Bot deactivated successfully",
  "bot_instance_id": "instance_789",
  "is_active": false
}
```

---

## Table Seats

Manage table seat assignments.

### GET /admin/tables
Get all tables with seat information.

**Response:**
```json
{
  "tables": [
    {
      "table_id": 1,
      "seats": [
        {
          "seat_index": 0,
          "occupant_type": "human",
          "occupant_id": "user_123",
          "occupant_name": "Player1",
          "occupant_avatar": "https://cdn.example.com/avatars/user_123.png"
        },
        {
          "seat_index": 1,
          "occupant_type": "bot",
          "occupant_id": "instance_789",
          "occupant_name": "John Smith",
          "occupant_avatar": "https://cdn.example.com/avatars/avatar_42.png"
        },
        {
          "seat_index": 2,
          "occupant_type": "empty",
          "occupant_id": null,
          "occupant_name": null,
          "occupant_avatar": null
        }
      ],
      "stats": {
        "empty": 4,
        "human": 1,
        "bot": 1,
        "total": 6
      }
    }
  ]
}
```

### GET /admin/tables/:tableId/seats
Get seats for a specific table.

**Response:**
```json
{
  "table_id": 1,
  "seats": [ "..." ],
  "stats": { "..." }
}
```

### POST /admin/tables/:tableId/seats/:seatIndex/lock
Acquire a lock on a seat for safe assignment.

**Request:**
```json
{
  "duration_ms": 30000
}
```

**Response:**
```json
{
  "seat": { "..." },
  "lockToken": "lock_1762798318096_mk9vqy26o",
  "locked_until": "2025-11-10T10:00:30Z"
}
```

### DELETE /admin/tables/:tableId/seats/:seatIndex/lock
Release a seat lock.

**Request:**
```json
{
  "lockToken": "lock_1762798318096_mk9vqy26o"
}
```

---

## Bot Scheduler

Manage automated bot tasks.

### GET /admin/scheduler/status
Get scheduler status and active tasks.

**Response:**
```json
{
  "enabled": true,
  "tasks": [
    {
      "name": "cleanup-expired-bots",
      "schedule": "*/15 * * * *",
      "lastRun": "2025-11-10T10:15:00Z",
      "nextRun": "2025-11-10T10:30:00Z",
      "status": "running"
    }
  ]
}
```

### POST /admin/scheduler/tasks
Create or update a scheduled task.

**Request:**
```json
{
  "name": "cleanup-expired-bots",
  "schedule": "*/15 * * * *",
  "enabled": true
}
```

### POST /admin/scheduler/trigger/:taskName
Manually trigger a scheduled task.

**Response:**
```json
{
  "message": "Task triggered successfully",
  "taskName": "cleanup-expired-bots",
  "triggeredAt": "2025-11-10T10:35:00Z"
}
```

### POST /admin/scheduler/stop/:taskName
Stop a running scheduled task.

**Response:**
```json
{
  "message": "Task stopped successfully",
  "taskName": "cleanup-expired-bots"
}
```

---

## Bot Analytics

Analytics and statistics for bot performance.

### GET /admin/bot-analytics
Get bot analytics data.

**Query Parameters:**
- `sortBy` (optional): `winRate`, `gamesPlayed`, `totalWinnings`
- `limit` (optional): Number of results (default: 50)
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response:**
```json
{
  "analytics": [
    {
      "bot_instance_id": "instance_789",
      "display_name": "John Smith",
      "table_id": 1,
      "games_played": 50,
      "games_won": 18,
      "games_lost": 32,
      "win_rate": 0.36,
      "total_winnings_coins": -2500,
      "avg_bet_size": 500,
      "created_at": "2025-11-10T08:00:00Z"
    }
  ],
  "summary": {
    "total_bots": 15,
    "total_games": 750,
    "avg_win_rate": 0.42,
    "flagged_anomalies": 2
  }
}
```

### GET /admin/bot-analytics/system/overview
Get system-wide bot statistics.

**Response:**
```json
{
  "active_bots": 12,
  "total_bots_created": 156,
  "tables_with_bots": 8,
  "avg_bots_per_table": 1.5,
  "hourly_stats": {
    "last_hour": {
      "bots_assigned": 8,
      "bots_removed": 5,
      "total_games": 120
    }
  }
}
```

### GET /admin/bot-analytics/anomalies
Get flagged bot anomalies.

**Response:**
```json
{
  "anomalies": [
    {
      "bot_instance_id": "instance_456",
      "display_name": "Sarah Johnson",
      "table_id": 3,
      "win_rate": 0.82,
      "games_played": 100,
      "flagged_reason": "Win rate above 70% threshold",
      "flagged_at": "2025-11-10T10:00:00Z"
    }
  ]
}
```

---

## Audit Logs

Track all bot management actions.

### GET /admin/audit-logs
Get audit log entries.

**Query Parameters:**
- `table_id` (optional): Filter by table
- `action` (optional): Filter by action type
- `admin_id` (optional): Filter by admin
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `limit` (optional): Number of results (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "log_id": "log_123",
      "action": "bot_assigned",
      "admin_id": "admin_456",
      "admin_name": "AdminUser",
      "table_id": 1,
      "seat_index": 2,
      "bot_instance_id": "instance_789",
      "details": {
        "bot_name": "John Smith",
        "bot_id": "RS-8732",
        "blueprint_id": "blueprint_123"
      },
      "note": "Performance testing",
      "timestamp": "2025-11-10T10:00:00Z"
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, business rule violation)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (admin permissions required)
- `404` - Not Found
- `409` - Conflict (optimistic locking version mismatch)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional context"
  }
}
```

### Common Error Codes
- `SEAT_OCCUPIED` - Seat already occupied
- `BOT_LIMIT_REACHED` - Per-table bot limit (4) reached
- `BOTS_DISABLED` - Bot assignment disabled by feature flag
- `BLUEPRINT_NOT_FOUND` - Bot blueprint not found
- `VERSION_MISMATCH` - Optimistic locking conflict
- `INVALID_SEAT_INDEX` - Seat index must be 0-5
- `TABLE_NOT_FOUND` - Table does not exist
- `LOCK_CONFLICT` - Seat is locked by another admin
- `INVALID_CREDENTIALS` - Authentication failed
- `PERMISSION_DENIED` - Admin role required
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limiting

- **Global Limit:** 100 requests/minute per IP
- **Admin Endpoints:** 50 requests/minute per admin

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1762798400
```

---

## Websocket Events

Bot assignments emit real-time events to all players at the table.

### Event: `botAssigned`
```json
{
  "event": "botAssigned",
  "table_id": 1,
  "seat_index": 2,
  "bot": {
    "display_name": "John Smith",
    "avatar_url": "https://cdn.example.com/avatars/avatar_42.png"
  }
}
```

### Event: `botRemoved`
```json
{
  "event": "botRemoved",
  "table_id": 1,
  "seat_index": 2
}
```

### Event: `seatUpdated`
```json
{
  "event": "seatUpdated",
  "table_id": 1,
  "seat_index": 2,
  "occupant_type": "bot",
  "occupant_name": "John Smith"
}
```

---

## Feature Flags

Bot system behavior is controlled by feature flags in `BotConfigService`.

**Available Flags:**
- `enableBotAssignment` - Enable/disable all bot assignments
- `maxBotsPerTable` - Maximum bots per table (default: 4)
- `requireHumanConfirmation` - Require confirmation to remove humans
- `enableIdentityRotation` - Allow identity changes
- `enableAutomaticCleanup` - Run scheduled cleanup jobs
- `botDisclosureRequired` - Show bot labels to players

**Get Feature Flags:**
```
GET /admin/config/flags
```

**Update Feature Flag:**
```
PATCH /admin/config/flags
```

**Request:**
```json
{
  "enableBotAssignment": false,
  "maxBotsPerTable": 2
}
```

---

## Examples

### Complete Bot Assignment Workflow

1. **Check table seats**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/admin/tables/1/seats
```

2. **Acquire seat lock**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_ms": 30000}' \
  https://api.example.com/api/admin/tables/1/seats/2/lock
```

3. **Assign bot**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "seat_index": 2,
    "bot_blueprint_id": "blueprint_123",
    "balance_coins": 10000
  }' \
  https://api.example.com/api/admin/bots/assign
```

4. **Monitor bot performance**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/admin/bot-analytics?sortBy=winRate&limit=10
```

5. **Remove bot when done**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "seat_index": 2,
    "reason": "Testing complete"
  }' \
  https://api.example.com/api/admin/bots/remove
```

---

## Best Practices

1. **Always use seat locks** when making seat changes to prevent race conditions
2. **Monitor win rates** - Flag bots with win rates > 70% for review
3. **Respect bot limits** - Maximum 4 bots per table to maintain game quality
4. **Rotate identities** periodically to prevent pattern recognition
5. **Use TTL for ephemeral bots** - Auto-cleanup after testing
6. **Audit all actions** - Include reason notes for transparency
7. **Check feature flags** before operations to respect system maintenance
8. **Handle optimistic locking** - Retry on version conflicts
9. **Clean up inactive bots** - Run scheduled cleanup tasks regularly
10. **Monitor analytics** - Review bot performance and flagged anomalies

---

## Support

For API support and bug reports:
- Email: support@example.com
- Documentation: https://docs.example.com/bot-management
- Status Page: https://status.example.com

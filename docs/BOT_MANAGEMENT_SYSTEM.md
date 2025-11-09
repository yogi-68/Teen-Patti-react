# Bot Management System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [API Reference](#api-reference)
5. [Web Client Guide](#web-client-guide)
6. [Mobile App Guide](#mobile-app-guide)
7. [Bot Configuration](#bot-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Bot Management System is a comprehensive AI-powered bot infrastructure for the Teen Patti multiplayer card game. It provides:

- **AI Decision Engine** - Intelligent gameplay based on hand strength, pot odds, and behavioral profiles
- **Dynamic Bot Management** - Create, assign, monitor, and control bots across multiple game tables
- **Analytics & Metrics** - Track performance, win rates, earnings, and gameplay patterns
- **Automated Maintenance** - Scheduled tasks for bot rotation, health checks, and cleanup
- **Avatar System** - Upload custom avatars or generate random ones
- **Real-time Updates** - Socket.IO integration for live bot events

### Key Features
✅ 5 Behavior Profiles (Aggressive, Conservative, Balanced, Bluffing, Tight)
✅ Advanced hand evaluation with Teen Patti rankings
✅ Pot odds calculation for optimal betting
✅ Identity randomization for variety
✅ Scheduled maintenance tasks
✅ Cloud-based avatar management
✅ Admin dashboard (Web + Mobile)
✅ Real-time socket events

---

## Architecture

### Backend Components

```
server/
├── models/
│   ├── BotBlueprint.ts       # Bot template definitions
│   └── BotInstance.ts         # Active bot instances
├── repositories/
│   ├── BotBlueprintRepository.ts
│   └── BotInstanceRepository.ts
├── services/
│   ├── BotManagementService.ts      # Core bot CRUD operations
│   ├── BotDecisionEngine.ts         # AI decision-making logic
│   ├── BotGameIntegration.ts        # Game loop integration
│   ├── BotIdentityResolver.ts       # Identity management
│   ├── BotAvatarService.ts          # Avatar utilities
│   └── BotScheduler.ts              # Automated maintenance
├── routes/
│   └── adminBotRoutes.ts            # REST API endpoints
├── config/
│   └── cloudinary.ts                # Avatar cloud storage
└── middleware/
    └── upload.ts                     # File upload handling
```

### Frontend Components

**Web Client (React + TypeScript)**
```
client/src/components/admin/
├── BotManagement.tsx          # Main dashboard with tabs
├── BotControlPanel.tsx        # Monitor & control bots
├── BotAssignmentPanel.tsx     # Assign bots to tables
├── BotStatsDashboard.tsx      # Analytics & performance
├── BotSchedulerPanel.tsx      # Maintenance scheduler
├── AvatarUpload.tsx           # Avatar management
└── BotAvatarModal.tsx         # Avatar modal dialog
```

**Mobile App (React Native)**
```
mobile/src/screens/Admin/
├── BotManagementScreen.tsx    # Main bot management
├── BotControlPanel.tsx        # Full-featured control panel
└── [Placeholder panels]       # Assignment/Stats/Scheduler (TODO)
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Cloudinary account (for avatar uploads)
- Git

### Backend Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/yogi-68/Teen-Patti-react.git
   cd Teen-Patti-react/server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables:
   ```env
   # Server
   NODE_ENV=production
   PORT=3001

   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster
   DB_NAME=your_database_name

   # Frontend URLs
   CLIENT_URL=https://your-client-url.com
   ALLOWED_ORIGINS=https://your-client-url.com
   SOCKET_CORS_ORIGIN=https://your-client-url.com

   # Security
   SESSION_SECRET=your-random-secret-minimum-32-chars
   JWT_SECRET=another-random-secret-minimum-32-chars

   # Cloudinary (Avatar Uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start Server**
   ```bash
   npm run dev    # Development
   npm start      # Production
   ```

### Web Client Setup

1. **Navigate to Client**
   ```bash
   cd ../client
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Configuration**
   
   Create `.env` file:
   ```env
   VITE_API_URL=https://your-server-url.com/api
   VITE_SOCKET_URL=https://your-server-url.com
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

### Mobile App Setup

1. **Navigate to Mobile**
   ```bash
   cd ../mobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Endpoints**
   
   Edit `mobile/src/constants/config.ts`:
   ```typescript
   export const API_BASE_URL = 'https://your-server-url.com/api';
   export const SOCKET_URL = 'https://your-server-url.com';
   ```

4. **Start Metro Bundler**
   ```bash
   npm start
   ```

5. **Run on Device/Emulator**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

---

## API Reference

### Bot Management Endpoints

#### Create Bot Blueprint
```http
POST /api/admin/bots/blueprint
Content-Type: application/json

{
  "name": "Aggressive Player",
  "behavior_profile_name": "aggressive",
  "default_balance_coins": 10000,
  "description": "High-risk bot that bets aggressively"
}
```

**Response:**
```json
{
  "success": true,
  "blueprint": {
    "bot_blueprint_id": "uuid",
    "name": "Aggressive Player",
    "behavior_profile_name": "aggressive",
    ...
  }
}
```

#### Assign Bot to Table
```http
POST /api/admin/tables/:tableId/seats/:seatIndex/assign-bot
Content-Type: application/json

{
  "bot_blueprint_id": "uuid",
  "identity_mode": "randomize",
  "behavior_profile_name": "balanced"
}
```

**Parameters:**
- `tableId` - Table ID (1-999)
- `seatIndex` - Seat position (0-5)
- `identity_mode` - `randomize` | `use_blueprint_name` | `custom`
- `display_name_override` - Custom name (optional)
- `bot_id_override` - Custom ID (optional)

**Response:**
```json
{
  "success": true,
  "bot": {
    "bot_instance_id": "uuid",
    "display_name": "Rajesh Kumar",
    "bot_id": "RK-4732",
    "assigned_table_id": 1,
    "assigned_seat_index": 2,
    ...
  }
}
```

#### Get All Bot Instances
```http
GET /api/test/bots
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "instances": [
    {
      "bot_instance_id": "uuid",
      "display_name": "Priya Singh",
      "is_active": true,
      "games_played": 45,
      "games_won": 23,
      "total_winnings": 15000,
      ...
    }
  ]
}
```

#### Deactivate Bot
```http
POST /api/test/bots/instance/:botId/deactivate
```

**Response:**
```json
{
  "success": true,
  "message": "Bot deactivated successfully"
}
```

#### Rotate Bot Identity
```http
POST /api/test/bots/instance/:botId/rotate-identity
```

**Response:**
```json
{
  "success": true,
  "bot": {
    "display_name": "Amit Sharma",
    "bot_id": "AS-9183",
    "avatar_url": "https://...",
    ...
  }
}
```

### Avatar Management Endpoints

#### Upload Avatar
```http
POST /api/admin/bots/avatars/upload
Content-Type: multipart/form-data

avatar: [image file]
```

**Response:**
```json
{
  "success": true,
  "avatar_url": "https://res.cloudinary.com/...",
  "public_id": "bot-avatars/xyz123"
}
```

#### Generate Random Avatar
```http
GET /api/admin/bots/avatars/generate?seed=custom-seed&style=avataaars
```

**Response:**
```json
{
  "success": true,
  "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=...",
  "style": "avataaars",
  "seed": "custom-seed"
}
```

**Available Styles:**
- `avataaars` - Cartoon avatars
- `bottts` - Robot avatars
- `lorelei` - Pixel art faces
- `notionists` - Notion-style avatars
- `personas` - Simple geometric faces
- `pixel-art` - Retro pixel art

#### Update Bot Avatar
```http
PUT /api/admin/bots/instance/:botId/avatar
Content-Type: application/json

{
  "avatar_url": "https://res.cloudinary.com/..."
}
```

### Analytics Endpoints

#### Get Bot Analytics
```http
GET /api/test/bots/analytics/instance/:botId
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "bot_instance_id": "uuid",
    "games_played": 100,
    "games_won": 45,
    "win_rate": 0.45,
    "total_winnings": 50000,
    "roi": 1.25,
    "avg_winnings_per_game": 500,
    "fold_rate": 0.35
  }
}
```

#### Get Performance Leaderboard
```http
GET /api/test/bots/analytics/leaderboard?metric=total_winnings&limit=10
```

**Metrics:**
- `total_winnings` - Highest earnings
- `win_rate` - Best win percentage
- `roi` - Return on investment
- `games_played` - Most active

### Scheduler Endpoints

#### Trigger Maintenance Task
```http
POST /api/test/bots/scheduler/trigger/:taskName
```

**Task Names:**
- `expireBots` - Remove expired ephemeral bots
- `rotateIdentities` - Rotate long-running bot identities
- `deactivateIdleBots` - Deactivate inactive bots
- `healthCheck` - Check bot system health
- `cleanupInactiveBots` - Remove old inactive bots

#### Get Scheduler Status
```http
GET /api/test/bots/scheduler/status
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "name": "expireBots",
      "schedule": "*/30 * * * *",
      "running": true
    }
  ],
  "uptime": "2h 15m 30s"
}
```

### Socket.IO Events

#### Bot Assigned
```javascript
socket.on('bot:assigned', (data) => {
  console.log(data);
  // {
  //   botId: "uuid",
  //   tableId: 1,
  //   seatIndex: 2,
  //   displayName: "Rajesh Kumar"
  // }
});
```

#### Bot Removed
```javascript
socket.on('bot:removed', (data) => {
  // { botId, tableId, seatIndex }
});
```

#### Identity Rotated
```javascript
socket.on('bot:identityRotated', (data) => {
  // { botId, newDisplayName, newBotId, avatarUrl }
});
```

#### Avatar Updated
```javascript
socket.on('bot:avatarUpdated', (data) => {
  // { botId, avatar_url, tableId, seatIndex }
});
```

---

## Web Client Guide

### Accessing Bot Management

1. **Login as Admin**
   - Navigate to login page
   - Use admin credentials
   - Access `/admin` route

2. **Navigate to Bot Management**
   - Click "🤖 Bot Management" in navigation
   - Or visit `/admin/bots` directly

### Control Panel

**Monitor Active Bots:**
- View all bot instances
- Filter by status (All/Active/Assigned/Unassigned)
- See real-time stats (games, wins, winnings)
- Check table assignments

**Bot Actions:**
- **🖼️ Avatar** - Update bot avatar
- **🔄 Rotate ID** - Change bot identity
- **⛔ Deactivate** - Disable bot

### Assignment Panel

**Assign New Bot:**
1. Select blueprint from dropdown
2. Choose table ID (1-999)
3. Select seat index (0-5)
4. Pick identity mode
5. Click "Assign Bot"

**Assign Existing Bot:**
1. Select bot from available list
2. Choose destination table/seat
3. Click "Assign"

### Analytics Dashboard

**System Overview:**
- Total Bots
- Active Bots
- Assigned Bots
- Total Winnings
- Average Win Rate

**Performance Table:**
- Sort by any metric
- View detailed stats
- Identify top performers

**Insights:**
- Best Performer (highest win rate)
- Most Active (most games)
- Top Earner (highest winnings)

### Scheduler Panel

**Task Status:**
- 5 scheduled tasks with status indicators
- Last run timestamps
- Success/failure counts

**Manual Controls:**
- Trigger individual tasks
- Stop all tasks
- Reinitialize scheduler

### Avatar Management

**Upload Custom Avatar:**
1. Click "🖼️ Avatar" on bot card
2. Click "📤 Upload Image"
3. Select image file (max 5MB)
4. Avatar automatically uploaded to Cloudinary
5. Bot updated with new avatar

**Generate Random Avatar:**
1. Click "🖼️ Avatar" on bot card
2. Click "🎲 Generate Random"
3. Random DiceBear avatar created
4. Bot updated instantly

**Supported Formats:**
- JPEG, JPG, PNG, GIF, WebP
- Max size: 5MB
- Auto-optimized to 200x200px

---

## Mobile App Guide

### Accessing Bot Management (Admin Only)

1. **Login as Admin**
   - Open mobile app
   - Navigate to Auth screen
   - Login with admin credentials

2. **Navigate to Bots Tab**
   - Bottom tab navigation
   - Tap "🤖 Bots" icon
   - Opens Bot Management screen

### Bot Management Screen

**Horizontal Tabs:**
- **🎮 Control** - Monitor and control bots (FULL FEATURED)
- **➕ Assign** - Assign bots to tables (Coming soon)
- **📊 Analytics** - Performance metrics (Coming soon)
- **⏰ Scheduler** - Maintenance tasks (Coming soon)

### Control Panel (Mobile)

**Features:**
- View all bot instances
- Filter system with counts:
  * All (12)
  * Active (8)
  * Assigned (5)
  * Unassigned (3)
- Horizontal scrollable filters
- Bot cards with:
  * Avatar display
  * Username and ID
  * Behavior profile badge
  * Stats (games, wins, winnings, win rate)
  * Status indicator
  * Table/seat assignment

**Actions:**
- **Rotate Identity** - Change bot name/ID/avatar
- **Deactivate** - Disable bot instance

**Confirmations:**
- Native alerts for all destructive actions
- Clear success/error feedback

### Limitations (Mobile)

Current mobile implementation has full Control Panel functionality. The following are planned:
- **Assignment Panel** - Use web dashboard
- **Analytics Dashboard** - Use web dashboard
- **Scheduler Panel** - Use web dashboard

---

## Bot Configuration

### Behavior Profiles

#### 1. Aggressive
**Characteristics:**
- High aggression (1.8)
- High bluff frequency (0.4)
- Frequent raises
- Risky plays

**Use Case:** Create action-packed games, challenge experienced players

#### 2. Conservative
**Characteristics:**
- Low aggression (0.4)
- Minimal bluffing (0.05)
- Cautious betting
- Folds weak hands

**Use Case:** Beginner-friendly opponents, stable games

#### 3. Balanced
**Characteristics:**
- Moderate aggression (1.0)
- Balanced bluffing (0.15)
- Mixed strategy
- Unpredictable

**Use Case:** Realistic opponents, varied gameplay

#### 4. Bluffing
**Characteristics:**
- Medium aggression (1.2)
- Very high bluff frequency (0.6)
- Deceptive plays
- Mind games

**Use Case:** Exciting games, test player reads

#### 5. Tight
**Characteristics:**
- Low aggression (0.6)
- No bluffing (0.0)
- Only strong hands
- Patient gameplay

**Use Case:** Predictable opponents, learning scenarios

### Identity Modes

#### Randomize (Recommended)
- Random Indian name
- Unique alphanumeric ID
- Random DiceBear avatar
- Best for variety

#### Use Blueprint Name
- Uses blueprint's default name
- Auto-generated ID
- Blueprint's avatar
- Good for consistency

#### Custom
- Admin-specified name
- Custom bot ID
- Custom avatar URL
- Full control

### Scheduled Maintenance

#### Expire Bots (Every 30 minutes)
- Removes bots past `expires_at` timestamp
- Cleans up ephemeral bots
- Frees table seats

#### Rotate Identities (Every 6 hours)
- Updates bots active >24 hours
- New name, ID, avatar
- Maintains freshness

#### Deactivate Idle Bots (Every hour)
- Flags bots inactive >48 hours
- Sets `is_active = false`
- Preserves data for analytics

#### Health Check (Every 5 minutes)
- Verifies bot system status
- Checks database connection
- Logs warnings

#### Cleanup Inactive Bots (Daily at 3 AM)
- Removes inactive bots >7 days old
- Permanent deletion
- Keeps database clean

---

## Troubleshooting

### Common Issues

#### 1. Bot Not Appearing in Game

**Problem:** Bot assigned but not visible at table

**Solutions:**
- Verify bot is active: `GET /api/test/bots`
- Check table ID matches game table
- Confirm seat index is valid (0-5)
- Refresh game client
- Check socket connection

#### 2. Avatar Upload Failing

**Problem:** Image upload returns error

**Solutions:**
- Check file size (max 5MB)
- Verify format (JPEG, PNG, GIF, WebP)
- Confirm Cloudinary credentials in `.env`
- Test Cloudinary connection
- Check network connectivity

#### 3. Bot Not Making Decisions

**Problem:** Bot stuck on turn

**Solutions:**
- Check `BotGameIntegration.executeBotTurn()` logs
- Verify bot has sufficient balance
- Confirm hand evaluation working
- Check pot odds calculation
- Review behavior profile settings

#### 4. Scheduler Tasks Not Running

**Problem:** Maintenance tasks not executing

**Solutions:**
- Check server logs for cron errors
- Verify `BotScheduler.initialize()` called
- Test manual trigger: `POST /api/test/bots/scheduler/trigger/:taskName`
- Confirm node-cron installed
- Check timezone settings

#### 5. Socket Events Not Received

**Problem:** Real-time updates not working

**Solutions:**
- Verify socket connection: `socket.connected`
- Check CORS configuration in `.env`
- Confirm `SOCKET_CORS_ORIGIN` matches client URL
- Test with Socket.IO debug mode
- Review firewall settings

#### 6. Mobile App Can't Connect

**Problem:** Mobile app shows connection errors

**Solutions:**
- Verify `API_BASE_URL` in `mobile/src/constants/config.ts`
- Check server is accessible from mobile network
- Test API with Postman/curl
- Confirm HTTPS for production
- Review mobile network permissions

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body/params |
| 401 | Unauthorized | Login as admin |
| 404 | Not Found | Verify bot/blueprint ID exists |
| 409 | Conflict | Seat already occupied |
| 500 | Server Error | Check server logs |

### Debugging Tips

**Enable Verbose Logging:**
```typescript
// server/src/services/BotDecisionEngine.ts
const DEBUG = true;
```

**Test Bot Decision:**
```bash
curl -X POST http://localhost:3001/api/test/bots/decision \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [{"rank": "A", "suit": "hearts"}, ...],
    "pot": 500,
    "current_bet": 100,
    "bot_balance": 10000,
    "behavior_profile_name": "balanced"
  }'
```

**Monitor Socket Events:**
```javascript
const socket = getSocket();
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

**Check Bot Health:**
```bash
curl http://localhost:3001/api/test/bots/scheduler/trigger/healthCheck
```

### Performance Optimization

**Database Indexes:**
```javascript
// Already created in repositories
db.bot_instances.createIndex({ assigned_table_id: 1 });
db.bot_instances.createIndex({ is_active: 1 });
db.bot_instances.createIndex({ expires_at: 1 });
```

**Caching (Future Enhancement):**
- Cache bot blueprints (rarely change)
- Cache avatar URLs
- Use Redis for hot data

**Load Balancing:**
- Deploy multiple server instances
- Use sticky sessions for socket connections
- CDN for avatar images (Cloudinary already does this)

---

## Support & Contributing

### Resources
- **GitHub:** https://github.com/yogi-68/Teen-Patti-react
- **Live Demo:** https://teen-patti-client.vercel.app
- **Server:** https://teen-patti-server.onrender.com

### Known Limitations
1. **Audit Logging:** Disabled due to initialization issues
2. **Mobile Panels:** Assignment/Stats/Scheduler panels are placeholders
3. **Testing:** Unit tests not yet implemented

### Future Roadmap
- [ ] Complete unit/integration tests
- [ ] Re-enable audit logging
- [ ] Complete mobile panel implementations
- [ ] Add bot training/machine learning
- [ ] Multiplayer bot tournaments
- [ ] Advanced analytics (heatmaps, patterns)
- [ ] Bot personality customization
- [ ] Voice chat for bots (TTS)

---

**Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Author:** yogi-68  
**License:** MIT

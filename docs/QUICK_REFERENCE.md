# Bot Management System - Quick Reference

## 🚀 Quick Start

### Create Your First Bot (3 Steps)

1. **Create Blueprint:**
   ```bash
   POST /api/admin/bots/blueprint
   { "name": "My Bot", "behavior_profile_name": "balanced", "default_balance_coins": 10000 }
   ```

2. **Assign to Table:**
   ```bash
   POST /api/admin/tables/1/seats/0/assign-bot
   { "bot_blueprint_id": "YOUR_ID", "identity_mode": "randomize" }
   ```

3. **Done!** Bot is now active at Table 1, Seat 0

---

## 📋 Essential Commands

### Backend

```bash
# Start server
npm run dev                    # Development with hot reload
npm start                      # Production

# Create admin user
npm run create-admin

# Verify bot system
npm run verify-bots
```

### Frontend (Web)

```bash
# Development
npm run dev                    # http://localhost:5173

# Production build
npm run build                  # Builds to dist/
npm run preview                # Preview build locally
```

### Mobile

```bash
# Start metro
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## 🎮 Behavior Profiles Cheat Sheet

| Profile | Aggression | Bluff % | When to Use |
|---------|-----------|---------|-------------|
| **Aggressive** | 1.8 | 40% | Action games, challenges |
| **Conservative** | 0.4 | 5% | Beginners, stable games |
| **Balanced** | 1.0 | 15% | Realistic opponents |
| **Bluffing** | 1.2 | 60% | Exciting, deceptive games |
| **Tight** | 0.6 | 0% | Predictable, learning |

---

## 🔗 API Endpoints Quick Reference

### Bots
```
POST   /api/admin/bots/blueprint                         # Create blueprint
GET    /api/admin/bots/blueprints                        # List blueprints
POST   /api/admin/tables/:id/seats/:seat/assign-bot      # Assign bot
GET    /api/test/bots                                    # List instances
POST   /api/test/bots/instance/:id/deactivate            # Deactivate
POST   /api/test/bots/instance/:id/rotate-identity       # Rotate identity
DELETE /api/admin/tables/:id/seats/:seat/remove-bot      # Remove bot
```

### Avatars
```
POST   /api/admin/bots/avatars/upload                    # Upload image
GET    /api/admin/bots/avatars/generate                  # Generate random
PUT    /api/admin/bots/instance/:id/avatar               # Update bot avatar
PUT    /api/admin/bots/blueprint/:id/avatar              # Update blueprint avatar
DELETE /api/admin/bots/avatars/:publicId                 # Delete avatar
```

### Analytics
```
GET    /api/test/bots/analytics/instance/:id             # Bot analytics
GET    /api/test/bots/analytics/leaderboard              # Leaderboard
GET    /api/test/bots/analytics/blueprint/:id            # Blueprint stats
GET    /api/test/bots/analytics/system-overview          # System stats
```

### Scheduler
```
POST   /api/test/bots/scheduler/trigger/:taskName        # Trigger task
GET    /api/test/bots/scheduler/status                   # Get status
POST   /api/test/bots/scheduler/stop-all                 # Stop all tasks
POST   /api/test/bots/scheduler/reinitialize             # Restart scheduler
```

---

## 🎨 Avatar Styles

### DiceBear API Styles
```
avataaars     # Cartoon faces (default)
bottts        # Robots
lorelei       # Pixel art females
notionists    # Notion-style avatars
personas      # Geometric faces
pixel-art     # Retro 8-bit style
```

### Generate Avatar URL
```
https://api.dicebear.com/7.x/{style}/svg?seed={seed}
```

Example:
```
https://api.dicebear.com/7.x/bottts/svg?seed=robot123
```

---

## ⏰ Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| **expireBots** | */30 * * * * | Every 30 min - Remove expired |
| **rotateIdentities** | 0 */6 * * * | Every 6 hours - Rotate old bots |
| **deactivateIdleBots** | 0 * * * * | Hourly - Flag inactive >48h |
| **healthCheck** | */5 * * * * | Every 5 min - System health |
| **cleanupInactiveBots** | 0 3 * * * | Daily 3 AM - Delete old inactive |

---

## 🎯 Hand Rankings (Teen Patti)

1. **Trail (Trio)** - AAA, KKK (Strength: 800-1300)
2. **Pure Sequence** - A-K-Q same suit (600-799)
3. **Sequence (Run)** - A-K-Q mixed suits (400-599)
4. **Color (Flush)** - All same suit (200-399)
5. **Pair** - AA-x (100-199)
6. **High Card** - No combination (0-99)

---

## 🔧 Environment Variables

### Server (.env)
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
DB_NAME=teen_patti_db
CLIENT_URL=https://your-client.com
SESSION_SECRET=min-32-chars
JWT_SECRET=min-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Web Client (.env)
```bash
VITE_API_URL=https://your-server.com/api
VITE_SOCKET_URL=https://your-server.com
```

### Mobile (config.ts)
```typescript
export const API_BASE_URL = 'https://your-server.com/api';
export const SOCKET_URL = 'https://your-server.com';
```

---

## 🐛 Common Error Codes

| Code | Meaning | Quick Fix |
|------|---------|-----------|
| 400 | Bad Request | Check JSON syntax |
| 401 | Unauthorized | Login as admin |
| 404 | Not Found | Verify ID exists |
| 409 | Conflict | Seat occupied |
| 500 | Server Error | Check logs |

---

## 📊 Analytics Formulas

```javascript
// Win Rate
win_rate = games_won / games_played

// ROI (Return on Investment)
roi = total_winnings / total_bet_amount

// Average Winnings
avg_winnings = total_winnings / games_played

// Fold Rate
fold_rate = total_hands_folded / games_played
```

---

## 🎪 Socket.IO Events

### Emitted by Server
```javascript
'bot:assigned'          // Bot assigned to table
'bot:removed'           // Bot removed from table
'bot:identityRotated'   // Bot identity changed
'bot:avatarUpdated'     // Bot avatar updated
```

### Listen in Client
```javascript
const socket = getSocket();

socket.on('bot:assigned', (data) => {
  // data: { botId, tableId, seatIndex, displayName }
  console.log('Bot assigned:', data);
});

socket.on('bot:identityRotated', (data) => {
  // data: { botId, newDisplayName, newBotId, avatarUrl }
  console.log('Identity rotated:', data);
});
```

---

## 🔑 Admin Routes (Web)

```
/admin                    # Admin dashboard
/admin/users              # User management
/admin/transactions       # Transaction history
/admin/subscriptions      # Subscription management
/admin/bots               # Bot management ⭐
/admin/settings           # System settings
```

---

## 📱 Mobile Navigation (Admin)

```
Dashboard Tab           # Overview
Users Tab              # User management
Transactions Tab       # Transaction history
Subscriptions Tab      # Subscription requests
Bots Tab ⭐            # Bot management
Settings Tab           # System settings
```

---

## ⚡ Performance Tips

### Backend
- Use indexes on frequently queried fields
- Limit large query results
- Cache bot blueprints (rarely change)
- Use CDN for avatars (Cloudinary does this)

### Frontend
- Lazy load components
- Debounce search inputs
- Paginate large lists
- Use React.memo for pure components

### Mobile
- Optimize images before upload
- Use FlatList for long lists
- Minimize re-renders
- Cache API responses

---

## 🧪 Quick Tests

### Test Bot System Health
```bash
curl http://localhost:3001/api/test/bots/scheduler/trigger/healthCheck
```

### Test Bot Decision
```bash
curl -X POST http://localhost:3001/api/test/bots/decision \
  -H "Content-Type: application/json" \
  -d '{"cards":[{"rank":"A","suit":"hearts"},{"rank":"K","suit":"hearts"},{"rank":"Q","suit":"hearts"}],"pot":1000,"current_bet":100,"bot_balance":10000,"behavior_profile_name":"balanced"}'
```

### Test Avatar Generation
```bash
curl "http://localhost:3001/api/admin/bots/avatars/generate?seed=test123&style=bottts"
```

---

## 📞 Support

- **GitHub:** https://github.com/yogi-68/Teen-Patti-react
- **Live Demo:** https://teen-patti-client.vercel.app
- **Server:** https://teen-patti-server.onrender.com
- **Documentation:** See `docs/BOT_MANAGEMENT_SYSTEM.md`

---

## 🎓 Learning Resources

### Teen Patti Rules
- Trail beats Pure Sequence
- Pure Sequence beats Sequence
- Sequence beats Color
- Color beats Pair
- Pair beats High Card

### Bot Behavior
- **Aggression** affects bet sizing
- **Bluff frequency** affects weak hand plays
- **Risk tolerance** affects decision thresholds

### Strategy Tips
- Mix bot profiles for variety
- Rotate identities regularly
- Monitor analytics for balance
- Use tight bots for tutorials
- Use aggressive bots for challenges

---

**Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Keep this handy while developing! 🚀**

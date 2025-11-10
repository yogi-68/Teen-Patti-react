# Bot Management System - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Avatar CDN Setup](#avatar-cdn-setup)
5. [Server Deployment](#server-deployment)
6. [Client Deployment](#client-deployment)
7. [Feature Flags Configuration](#feature-flags-configuration)
8. [Monitoring Setup](#monitoring-setup)
9. [Scheduled Jobs](#scheduled-jobs)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js:** v18.0.0 or higher
- **MongoDB:** v5.0 or higher
- **Redis:** (Optional) For session management
- **CDN:** For avatar hosting (Cloudflare, AWS CloudFront, or similar)

### Development Tools
- TypeScript 5.0+
- npm or yarn
- Git

---

## Environment Setup

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teenpatti?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Origins
CORS_ORIGIN=https://your-client-domain.com

# Bot Configuration
BOT_AVATAR_CDN_URL=https://cdn.your-domain.com/avatars
BOT_CLEANUP_SCHEDULE=*/15 * * * *  # Every 15 minutes
MAX_BOTS_PER_TABLE=4
ENABLE_BOT_ASSIGNMENT=true

# Redis (Optional)
REDIS_URL=redis://username:password@redis-host:6379

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
```

### Client Environment Variables

Create a `.env.production` file in the `client/` directory:

```bash
# API Configuration
VITE_API_URL=https://api.your-domain.com/api
VITE_WS_URL=wss://api.your-domain.com

# CDN
VITE_AVATAR_CDN_URL=https://cdn.your-domain.com/avatars

# Feature Flags (Client-side display)
VITE_SHOW_BOT_LABELS=false
VITE_ENABLE_BOT_REPORTS=true
```

---

## Database Configuration

### MongoDB Setup

1. **Create Database:**
```javascript
use teenpatti
```

2. **Create Collections:**
```javascript
// Collections are auto-created by Mongoose, but you can pre-create indexes

// Bot Blueprints
db.bot_blueprints.createIndex({ "created_at": -1 })

// Bot Instances
db.bot_instances.createIndex({ "assigned_table_id": 1, "assigned_seat_index": 1 })
db.bot_instances.createIndex({ "is_active": 1, "expires_at": 1 })
db.bot_instances.createIndex({ "created_at": -1 })

// Table Seats
db.table_seats.createIndex({ "table_id": 1, "seat_index": 1 }, { unique: true })
db.table_seats.createIndex({ "occupant_type": 1 })
db.table_seats.createIndex({ "locked_until": 1 })

// Audit Logs
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "table_id": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "admin_id": 1, "timestamp": -1 })
```

3. **Initialize Table Seats:**
```bash
# Run this after first deployment
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.your-domain.com/api/admin/tables/initialize
```

### Backup Strategy
```bash
# Daily backup script
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Retention: Keep 30 days
find /backups -mtime +30 -delete
```

---

## Avatar CDN Setup

### Preparing Avatar Assets

1. **Collect 48+ Avatar Images:**
   - Format: PNG or JPEG
   - Size: 256x256px or higher
   - Naming: `avatar_1.png` to `avatar_48.png`
   - Style: Human-looking, diverse, gender-neutral

2. **Optimize Images:**
```bash
# Using ImageMagick
for i in {1..48}; do
  convert avatar_$i.png -resize 256x256 -quality 85 avatar_$i.jpg
done
```

### Upload to CDN

#### Option 1: AWS S3 + CloudFront

```bash
# Install AWS CLI
npm install -g aws-cli

# Upload avatars
aws s3 sync ./avatars s3://your-bucket/avatars --acl public-read

# Set cache headers
aws s3 cp s3://your-bucket/avatars s3://your-bucket/avatars \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000,public"
```

**CloudFront Distribution:**
- Origin: S3 bucket
- Cache Behavior: Cache everything
- TTL: 1 year
- Compress Objects: Yes

#### Option 2: Cloudflare

1. Upload avatars to Cloudflare Images or R2
2. Get public URL: `https://cdn.your-domain.com/avatars/avatar_1.png`
3. Update `BOT_AVATAR_CDN_URL` in .env

#### Option 3: Self-Hosted (Not Recommended)

```nginx
# nginx configuration
location /avatars/ {
    alias /var/www/avatars/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Server Deployment

### Render.com (Recommended)

1. **Create New Web Service:**
   - Repository: Connect your GitHub repo
   - Branch: `main`
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Environment Variables:**
   Add all server environment variables from the Render dashboard

3. **Auto-Deploy:**
   - Enable auto-deploy on push to main branch
   - Health check: `/api/health`

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create teenpatti-api

# Set environment variables
heroku config:set MONGODB_URI=$MONGODB_URI
heroku config:set JWT_SECRET=$JWT_SECRET
# ... add all other env vars

# Deploy
git subtree push --prefix server heroku main

# Scale
heroku ps:scale web=2
```

### Docker

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

### PM2 (VPS)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start npm --name "teenpatti-server" -- start

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## Client Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   - Import GitHub repo
   - Root Directory: `client`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Environment Variables:**
   Add all client environment variables

3. **Domain:**
   - Add custom domain
   - SSL auto-configured

### Netlify

```toml
# netlify.toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Cloudflare Pages

```bash
# Build locally
cd client
npm run build

# Deploy
npx wrangler pages publish dist
```

---

## Feature Flags Configuration

### Initial Configuration

```typescript
// server/src/services/BotConfigService.ts
export const botConfig = {
  // Bot Assignment
  enableBotAssignment: true,
  maxBotsPerTable: 4,
  minBotsPerTable: 0,
  
  // Seat Management
  requireHumanConfirmation: true,
  seatLockDurationMs: 30000,
  
  // Identity Management
  enableIdentityRotation: true,
  avatarPoolSize: 48,
  nameCooldownHours: 168, // 7 days
  
  // Cleanup
  enableAutomaticCleanup: true,
  cleanupSchedule: '*/15 * * * *', // Every 15 minutes
  ephemeralBotTTL: 3600000, // 1 hour in ms
  
  // Analytics
  winRateAnomalyThreshold: 0.70, // Flag bots with >70% win rate
  enableAnomalyDetection: true,
  
  // Disclosure
  botDisclosureRequired: false, // Regulatory requirement (varies by jurisdiction)
};
```

### Runtime Updates

```bash
# Update feature flags via API
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableBotAssignment": false,
    "maxBotsPerTable": 2
  }' \
  https://api.your-domain.com/api/admin/config/flags
```

---

## Monitoring Setup

### Health Checks

```typescript
// server/src/routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

### Sentry Integration

```typescript
// server/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Logging

```typescript
// Use Winston or Pino
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Metrics Dashboard

**Recommended Tools:**
- **Grafana** + **Prometheus** for custom metrics
- **Datadog** for full observability
- **New Relic** for APM

**Key Metrics to Monitor:**
- Active bot count
- Bots per table distribution
- Average bot win rate
- API response times
- Database query performance
- Memory usage
- Error rates

---

## Scheduled Jobs

### Bot Cleanup Job

```typescript
// Runs every 15 minutes
import { schedule } from 'node-cron';

schedule('*/15 * * * *', async () => {
  console.log('Running bot cleanup job...');
  
  // Remove expired ephemeral bots
  await BotCleanupService.cleanupExpiredBots();
  
  // Clear expired seat locks
  await TableSeatRepository.cleanupExpiredLocks();
  
  // Deactivate inactive bots
  await BotCleanupService.deactivateInactiveBots(24); // 24 hours
});
```

### Manual Trigger

```bash
# Trigger cleanup manually
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.your-domain.com/api/admin/scheduler/trigger/cleanup-expired-bots
```

---

## Troubleshooting

### Common Issues

#### 1. **ERR_MODULE_NOT_FOUND**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/dist/models/TableSeat'
```

**Solution:** Ensure all imports have `.js` extensions:
```typescript
// Wrong
import { TableSeat } from '../models/TableSeat';

// Correct
import { TableSeat } from '../models/TableSeat.js';
```

#### 2. **Seat Lock Conflicts**
```
Error: Seat is locked by another admin
```

**Solution:** Implement lock timeout and cleanup:
```bash
# Check expired locks
curl https://api.your-domain.com/api/admin/tables/1/seats/2

# Force release (if admin confirms)
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.your-domain.com/api/admin/tables/1/seats/2/lock/force
```

#### 3. **High Bot Win Rates**
```
Warning: Bot instance_789 has 85% win rate (flagged)
```

**Solution:** Review bot behavior profile:
```bash
# Get bot analytics
curl https://api.your-domain.com/api/admin/bot-analytics/anomalies

# Adjust behavior profile to increase error_rate
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"error_rate": 15}' \
  https://api.your-domain.com/api/admin/bots/blueprint_123
```

#### 4. **MongoDB Connection Timeout**
```
MongooseError: Connection timeout
```

**Solution:** Check MongoDB Atlas IP whitelist, increase timeout:
```typescript
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
```

#### 5. **Avatar CDN 404 Errors**
```
Failed to load avatar: https://cdn.example.com/avatars/avatar_42.png
```

**Solution:** Verify CDN configuration:
```bash
# Test avatar URL
curl -I https://cdn.example.com/avatars/avatar_1.png

# Should return 200 OK with proper headers
```

### Logs Analysis

```bash
# View error logs
tail -f error.log | grep "bot"

# Search for specific bot instance
grep "instance_789" combined.log | tail -n 50

# Count bot assignments per hour
grep "bot_assigned" combined.log | awk '{print $1,$2}' | cut -d: -f1 | uniq -c
```

### Performance Tuning

```typescript
// Add database indexes
db.bot_instances.createIndex({ "assigned_table_id": 1, "is_active": 1 })

// Enable MongoDB connection pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
});

// Add Redis caching for bot analytics
import redis from 'redis';
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

// Cache analytics for 5 minutes
const cacheKey = `bot-analytics:${sortBy}:${limit}`;
const cached = await redisClient.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... fetch from DB ...
await redisClient.setEx(cacheKey, 300, JSON.stringify(analytics));
```

---

## Post-Deployment Checklist

- [ ] Database indexes created
- [ ] Avatar CDN configured and tested
- [ ] Environment variables set
- [ ] Health check endpoint returning 200 OK
- [ ] Scheduled cleanup job running
- [ ] Monitoring and alerts configured
- [ ] SSL certificates installed
- [ ] CORS origins configured correctly
- [ ] Admin authentication tested
- [ ] Bot assignment flow tested end-to-end
- [ ] Websocket events broadcasting
- [ ] Audit logs recording actions
- [ ] Feature flags reviewed and set appropriately
- [ ] Backup strategy implemented
- [ ] Error tracking (Sentry) receiving events
- [ ] API rate limiting configured
- [ ] Mobile app updated with new API endpoints

---

## Security Hardening

### API Security

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use('/api', limiter);

// Helmet for HTTP headers
import helmet from 'helmet';
app.use(helmet());

// Input validation
import { body, validationResult } from 'express-validator';

router.post('/admin/bots/assign',
  body('table_id').isInt({ min: 1 }),
  body('seat_index').isInt({ min: 0, max: 5 }),
  body('balance_coins').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... 
  }
);
```

### Admin Role Enforcement

```typescript
// Verify admin middleware
export const verifyAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply to all admin routes
router.use('/admin/*', authenticate, verifyAdmin);
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review bot analytics for anomalies
- Check audit logs for suspicious activity
- Monitor system resource usage
- Verify scheduled jobs are running

**Monthly:**
- Update dependencies (`npm update`)
- Review and archive old audit logs
- Analyze bot win rate distribution
- Update avatar pool if needed

**Quarterly:**
- Security audit
- Performance optimization review
- Update documentation
- Disaster recovery drill

### Contact & Support

- **Technical Issues:** tech@example.com
- **Security Concerns:** security@example.com
- **Documentation:** https://docs.example.com

---

## Version History

- **v1.0.0** (2025-11-10): Initial production release
  - Complete bot management system
  - 48-avatar pool
  - Automated cleanup jobs
  - Comprehensive audit logging
  - Real-time seat updates via WebSocket


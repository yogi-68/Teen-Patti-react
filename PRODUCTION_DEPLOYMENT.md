# Production Deployment Guide

## Pre-deployment Checklist

### 1. Environment Variables

#### Client (.env.production)
```env
VITE_API_URL=https://your-production-domain.com/api
VITE_SOCKET_URL=https://your-production-domain.com
```

#### Server (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-client-domain.com
```

### 2. Build Commands

#### Client Build
```bash
cd client
npm install --legacy-peer-deps
npm run build
```

#### Server Build
```bash
cd server
npm install
npm run build
```

### 3. Production Fixes Applied

✅ **TypeScript Error Fixed**: `setTableState` now accepts `null` parameter
✅ **Debug Logs Removed**: Console logs wrapped in `import.meta.env.DEV` checks
✅ **Admin Route**: Cleaned up debug logging
✅ **Socket Logging**: Production-safe logging implemented
✅ **Environment Variables**: Properly configured for production

### 4. Critical Production Settings

#### CORS Configuration
Ensure server CORS is configured for your production domain:
```typescript
// server/src/index.ts
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
})
```

#### Socket.IO Configuration
Update socket connection in production:
```typescript
// client/src/utils/socket.ts
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
```

### 5. Database Setup

1. **MongoDB Atlas**:
   - Create production cluster
   - Whitelist production server IP
   - Update connection string in server .env

2. **Initial Admin User**:
   ```bash
   cd server
   npm run create-admin
   ```

### 6. Deployment Platforms

#### Option 1: Vercel (Client) + Render (Server)

**Client (Vercel)**:
```bash
cd client
vercel --prod
```

**Server (Render)**:
- Connect GitHub repository
- Build command: `cd server && npm install && npm run build`
- Start command: `cd server && npm start`
- Environment variables: Add from .env

#### Option 2: Single VPS (DigitalOcean, AWS, etc.)

**Using PM2**:
```bash
# Install PM2
npm install -g pm2

# Start server
cd server
pm2 start dist/index.js --name teen-patti-server

# Serve client with nginx
# Copy client/dist to /var/www/html
```

### 7. Post-Deployment Testing

- [ ] Test user registration and login
- [ ] Verify game joining and gameplay
- [ ] Check admin panel access
- [ ] Test Joker feature
- [ ] Verify Socket.IO connections
- [ ] Test wallet transactions
- [ ] Check mobile responsiveness

### 8. Monitoring

**Recommended Tools**:
- Sentry (Error tracking)
- LogRocket (Session replay)
- New Relic (Performance monitoring)

### 9. Security Checklist

- [ ] HTTPS enabled
- [ ] JWT secrets are strong and unique
- [ ] MongoDB connection uses authentication
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Environment variables secured

### 10. Performance Optimization

- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement Redis for session management
- [ ] Database indexes optimized
- [ ] Client bundle size optimized

## Common Issues

### Issue: Socket.IO not connecting
**Solution**: Check CORS settings and WebSocket support on hosting platform

### Issue: MongoDB timeout
**Solution**: Verify IP whitelist in MongoDB Atlas

### Issue: 404 on routes
**Solution**: Configure server to serve index.html for all routes (SPA)

### Issue: Environment variables not loading
**Solution**: Restart server/rebuild client after changing .env files

## Rollback Plan

1. Keep previous build artifacts
2. Use git tags for production releases
3. Database migrations should be reversible
4. Test rollback procedure in staging

## Support

For issues, contact: your-support-email@domain.com

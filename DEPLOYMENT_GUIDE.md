# 🚀 Deployment Guide - Teen Patti Bot Management System

## Table of Contents
1. [MongoDB Atlas Setup](#mongodb-atlas-setup)
2. [Render Deployment](#render-deployment)
3. [Environment Variables](#environment-variables)
4. [Verification Steps](#verification-steps)
5. [Bot System Testing](#bot-system-testing)

---

## 📊 MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account (M0 Sandbox - Free Forever)
3. Create a new cluster

### Step 2: Configure Database Access
1. **Database Access** → **Add New Database User**
   - Username: `teenpatti_admin`
   - Password: Generate a secure password (save it!)
   - Built-in Role: **Atlas Admin** (for development) or **Read and write to any database**
   - Click **Add User**

### Step 3: Configure Network Access
1. **Network Access** → **Add IP Address**
   - For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
   - For production: Add your Render.com server IPs
   - Click **Confirm**

### Step 4: Get Connection String
1. Go to **Clusters** → Click **Connect**
2. Choose **Connect your application**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string:
   ```
   mongodb+srv://teenpatti_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `teenpatti` at the end:
   ```
   mongodb+srv://teenpatti_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/teenpatti?retryWrites=true&w=majority
   ```

### Step 5: Create Collections (Optional - Auto-created)
MongoDB will automatically create these collections when data is inserted:
- `users`
- `botblueprints`
- `botinstances`
- `transactions`
- `subscriptionrequests`
- `enquiries`

---

## 🌐 Render Deployment

### Step 1: Prepare Repository
1. Commit all changes to GitHub:
   ```bash
   git add .
   git commit -m "Add bot management system"
   git push origin main
   ```

### Step 2: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repository

### Step 3: Create New Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository: `Teen-Patti-react`
3. Configure service:
   - **Name**: `teen-patti-server`
   - **Region**: Choose closest to your users (e.g., Singapore, US East)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Instance Type**: Free (or Starter for production)

### Step 4: Configure Environment Variables
In Render dashboard, go to **Environment** tab and add:

```bash
NODE_ENV=production
PORT=3001

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://teenpatti_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/teenpatti?retryWrites=true&w=majority
DB_NAME=teenpatti

# Frontend URL (Vercel deployment)
CLIENT_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
SOCKET_CORS_ORIGIN=https://your-app.vercel.app

# Security - Generate random 32+ character strings
SESSION_SECRET=your-super-secret-session-key-min-32-chars-long
JWT_SECRET=your-super-secret-jwt-key-also-min-32-chars

# Game Config
MAX_PLAYERS_PER_TABLE=5
```

**Generate Secure Secrets:**
```bash
# In terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy
1. Click **Create Web Service**
2. Wait for deployment (3-5 minutes)
3. Your server URL: `https://teen-patti-server.onrender.com`

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Render auto-assigns) | `3001` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/teenpatti` |
| `DB_NAME` | Database name | `teenpatti` |
| `CLIENT_URL` | Frontend deployment URL | `https://your-app.vercel.app` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://your-app.vercel.app` |
| `SOCKET_CORS_ORIGIN` | Socket.IO CORS origin | `https://your-app.vercel.app` |
| `SESSION_SECRET` | Express session secret (32+ chars) | Generated random string |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Generated random string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_PLAYERS_PER_TABLE` | Maximum players per table | `5` |

---

## ✅ Verification Steps

### 1. Check Server Health
```bash
# Replace with your Render URL
curl https://teen-patti-server.onrender.com/

# Expected Response:
{
  "status": "ok",
  "service": "Teen Patti Game Server",
  "version": "1.0.0",
  "timestamp": "2025-11-09T..."
}
```

### 2. Check MongoDB Connection
View Render logs:
1. Go to Render Dashboard → Your Service → **Logs**
2. Look for:
   ```
   ✅ MongoDB connected successfully
   📍 Database: teenpatti
   ```

### 3. Test API Endpoints
```bash
# Health check
curl https://teen-patti-server.onrender.com/health

# API status
curl https://teen-patti-server.onrender.com/api/status

# Expected:
{
  "status": "running",
  "version": "1.0.0",
  "game": "Teen Patti"
}
```

---

## 🤖 Bot System Testing

### 1. Test Bot Assignment API

**Create Test Request:**
```bash
# Using curl (replace YOUR_RENDER_URL)
curl -X POST https://YOUR_RENDER_URL/api/admin/tables/1/seats/0/assign-bot \
  -H "Content-Type: application/json" \
  -d '{
    "identity_mode": "randomize",
    "behavior_profile_name": "balanced"
  }'
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Bot assigned successfully",
  "bot_instance": {
    "bot_instance_id": "673...",
    "display_name": "Rohan Sharma",
    "bot_id": "RS-8732",
    "avatar_url": "/avatars/bot_avatar_03.png",
    "assigned_table_id": 1,
    "assigned_seat_index": 0,
    "balance_coins": 10000,
    "expires_at": "2025-11-09T..."
  }
}
```

### 2. Test Get Bot Instances
```bash
curl https://YOUR_RENDER_URL/api/admin/bot_instances?table_id=1
```

### 3. Test Remove Bot
```bash
curl -X POST https://YOUR_RENDER_URL/api/admin/tables/1/seats/0/remove-bot
```

### 4. Test Get All Blueprints
```bash
curl https://YOUR_RENDER_URL/api/admin/bots
```

---

## 🔍 MongoDB Atlas Verification

### Check Collections in Atlas
1. Go to **Clusters** → **Browse Collections**
2. Database: `teenpatti`
3. You should see:
   - `botblueprints` - Bot configurations
   - `botinstances` - Active bot instances
   - `users` - User accounts

### View Bot Data
1. Click `botinstances` collection
2. You should see documents with:
   - `display_name`: "Rohan Sharma"
   - `bot_id`: "RS-8732"
   - `assigned_table_id`: 1
   - `balance_coins`: 10000

### Create Index (Optional Performance Boost)
In MongoDB Atlas:
1. Go to **Collections** → `botinstances` → **Indexes**
2. Click **Create Index**
3. Add indexes:
   ```json
   { "assigned_table_id": 1, "assigned_seat_index": 1 }
   { "bot_id": 1 }
   { "expires_at": 1 }
   ```

---

## 🐛 Troubleshooting

### Server Won't Start
**Check Render Logs:**
```
Go to Render Dashboard → Logs tab
Look for error messages
```

**Common Issues:**
1. **MongoDB Connection Failed**
   - Verify `MONGODB_URI` in environment variables
   - Check MongoDB Atlas Network Access (whitelist IPs)
   - Ensure password has no special characters that need URL encoding

2. **Port Already in Use**
   - Render automatically assigns PORT, don't hardcode it
   - Use `process.env.PORT || 3001`

3. **Module Not Found**
   - Ensure `npm install` ran successfully
   - Check `package.json` dependencies

### Bot Routes Not Working
1. **Verify routes are registered:**
   ```typescript
   // server/src/index.ts
   app.use('/api/admin', adminBotRoutes);
   ```

2. **Check authentication middleware:**
   - Bot routes may require admin authentication
   - Add auth token to requests if needed

3. **CORS errors:**
   - Add your frontend URL to `ALLOWED_ORIGINS`
   - Include credentials in CORS config

---

## 📱 Client Configuration

Update your client `.env.production`:
```bash
VITE_API_BASE_URL=https://teen-patti-server.onrender.com
VITE_SOCKET_URL=https://teen-patti-server.onrender.com
```

Deploy client to Vercel:
```bash
cd client
npm run build
# Push to GitHub, Vercel auto-deploys
```

---

## 🔒 Security Checklist

- ✅ MongoDB Atlas Network Access configured
- ✅ Strong database password (20+ characters)
- ✅ `SESSION_SECRET` is 32+ random characters
- ✅ `JWT_SECRET` is 32+ random characters
- ✅ CORS configured with specific origins (not *)
- ✅ Rate limiting enabled (already in code)
- ✅ Helmet middleware enabled (already in code)
- ✅ Environment variables stored securely in Render
- ✅ `.env` file in `.gitignore` (never commit secrets)

---

## 📊 Monitoring

### Render Dashboard
- **Metrics**: View CPU, Memory usage
- **Logs**: Real-time server logs
- **Events**: Deployment history

### MongoDB Atlas
- **Metrics**: Database operations, connections
- **Performance Advisor**: Index recommendations
- **Alerts**: Set up email alerts for issues

---

## 🎯 Production Checklist

Before going live:

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with strong password
- [ ] Network access configured (0.0.0.0/0 for Render)
- [ ] Render web service created and deployed
- [ ] All environment variables configured
- [ ] Server health endpoint responding
- [ ] MongoDB connection successful (check logs)
- [ ] Bot assignment API tested and working
- [ ] Client deployed to Vercel with correct API URL
- [ ] CORS configured for client URL
- [ ] Bot instances visible in MongoDB Atlas
- [ ] Security secrets generated and stored

---

## 📝 Next Steps After Deployment

1. **Test Full Bot Lifecycle:**
   - Assign bots to tables
   - Verify bot names are unique
   - Test identity rotation
   - Remove bots
   - Check MongoDB for data persistence

2. **Load Testing:**
   - Use Apache Bench or Artillery
   - Test 100 concurrent bot assignments
   - Verify no name collisions

3. **Monitor Performance:**
   - Watch Render metrics
   - Check MongoDB Atlas performance
   - Set up alerts

4. **Implement Remaining Features:**
   - Socket.IO events for bot actions
   - Audit logging
   - Bot decision engine
   - Admin UI for bot management

---

## 🆘 Support & Resources

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Render Docs**: https://render.com/docs
- **Express.js Docs**: https://expressjs.com
- **Socket.IO Docs**: https://socket.io/docs

**Need Help?**
- Check Render logs first
- Verify MongoDB Atlas connection
- Review environment variables
- Test API endpoints individually

---

**Deployment Status:** ✅ Ready for Production

**Last Updated:** November 9, 2025

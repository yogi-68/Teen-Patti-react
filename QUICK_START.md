# 🚀 Quick Start - Bot Management System

## ⚡ 5-Minute Setup Guide

This guide gets you from zero to deployed in 5 minutes.

---

## 📋 Prerequisites

- GitHub account
- MongoDB Atlas account (free)
- Render account (free)

---

## 🎯 Step-by-Step Deployment

### Step 1: MongoDB Atlas (2 minutes)

1. Go to https://cloud.mongodb.com
2. Sign up for free tier (M0 Sandbox)
3. Click **Build a Database** → **M0 FREE**
4. Choose region closest to you → **Create**
5. **Security Quickstart:**
   - Username: `teenpatti_admin`
   - Password: Click **Autogenerate** (COPY THIS!)
   - Click **Create User**
6. **Network Access:**
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Confirm
7. **Get Connection String:**
   - Click **Connect** → **Drivers**
   - Copy connection string:
     ```
     mongodb+srv://teenpatti_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your saved password
   - Add `/teenpatti` before the `?`:
     ```
     mongodb+srv://teenpatti_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/teenpatti?retryWrites=true&w=majority
     ```
   - **SAVE THIS STRING!** ✅

---

### Step 2: Render Deployment (3 minutes)

1. Go to https://render.com
2. Sign up with GitHub
3. **New** → **Web Service**
4. **Connect Repository:** `Teen-Patti-react`
5. **Configure:**
   ```
   Name: teen-patti-server
   Region: Singapore (or closest)
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

6. **Environment Variables** (click Advanced):
   ```bash
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=<PASTE YOUR MONGODB CONNECTION STRING HERE>
   DB_NAME=teenpatti
   CLIENT_URL=https://your-app.vercel.app
   ALLOWED_ORIGINS=https://your-app.vercel.app
   SOCKET_CORS_ORIGIN=https://your-app.vercel.app
   SESSION_SECRET=<GENERATE BELOW>
   JWT_SECRET=<GENERATE BELOW>
   MAX_PLAYERS_PER_TABLE=5
   ```

7. **Generate Secrets** (Windows PowerShell):
   ```powershell
   # SESSION_SECRET
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   
   # JWT_SECRET
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

8. Click **Create Web Service**

9. Wait 3-5 minutes for deployment ☕

10. Your server URL: `https://teen-patti-server.onrender.com`

---

## ✅ Verify Deployment

### Test 1: Server Health
```bash
curl https://teen-patti-server.onrender.com/
```

**Expected:**
```json
{
  "status": "ok",
  "service": "Teen Patti Game Server",
  "version": "1.0.0"
}
```

### Test 2: Assign Bot
```bash
curl -X POST https://teen-patti-server.onrender.com/api/admin/tables/1/seats/0/assign-bot \
  -H "Content-Type: application/json" \
  -d "{\"identity_mode\": \"randomize\", \"behavior_profile_name\": \"balanced\"}"
```

**Expected:**
```json
{
  "status": "ok",
  "message": "Bot assigned successfully",
  "bot_instance": {
    "display_name": "Rohan Sharma",
    "bot_id": "RS-8732",
    "assigned_table_id": 1,
    "assigned_seat_index": 0
  }
}
```

### Test 3: Check MongoDB
1. Go to MongoDB Atlas → **Database** → **Browse Collections**
2. You should see:
   - Database: `teenpatti`
   - Collections: `botblueprints`, `botinstances`
3. Click `botinstances` → See your bot data ✅

---

## 🎮 Test the Bot System

### PowerShell Commands

```powershell
# 1. Assign bot to seat 0
$response = Invoke-RestMethod -Uri "https://YOUR_RENDER_URL/api/admin/tables/1/seats/0/assign-bot" -Method Post -Body '{"identity_mode":"randomize","behavior_profile_name":"balanced"}' -ContentType "application/json"
$response | ConvertTo-Json

# 2. Assign bot to seat 1
Invoke-RestMethod -Uri "https://YOUR_RENDER_URL/api/admin/tables/1/seats/1/assign-bot" -Method Post -Body '{"identity_mode":"persistent","behavior_profile_name":"aggressive"}' -ContentType "application/json" | ConvertTo-Json

# 3. List all bot instances
Invoke-RestMethod -Uri "https://YOUR_RENDER_URL/api/admin/bot_instances?table_id=1" | ConvertTo-Json

# 4. Remove bot from seat 0
Invoke-RestMethod -Uri "https://YOUR_RENDER_URL/api/admin/tables/1/seats/0/remove-bot" -Method Post | ConvertTo-Json

# 5. List blueprints
Invoke-RestMethod -Uri "https://YOUR_RENDER_URL/api/admin/bots" | ConvertTo-Json
```

---

## 🔧 Local Development

### Run Locally

```powershell
# 1. Clone repository
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\server

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example)
Copy-Item .env.example .env

# 4. Edit .env with your MongoDB URI
notepad .env

# 5. Run development server
npm run dev

# Server runs on http://localhost:3001
```

### Test Locally

```powershell
# Assign bot
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/tables/1/seats/0/assign-bot" -Method Post -Body '{"identity_mode":"randomize"}' -ContentType "application/json" | ConvertTo-Json

# List instances
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/bot_instances" | ConvertTo-Json
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **IMPLEMENTATION_SUMMARY.md** | Overview of what was built |
| **TESTING_GUIDE.md** | Comprehensive testing instructions |
| **DEPLOYMENT_GUIDE.md** | Detailed deployment steps |
| **BOT_SYSTEM_REVIEW.md** | Code review and architecture |

---

## 🐛 Troubleshooting

### Server Won't Start
**Check Render Logs:**
1. Go to Render Dashboard
2. Click your service → **Logs** tab
3. Look for errors

**Common Issues:**
- MongoDB connection failed → Check `MONGODB_URI` in environment variables
- Port error → Render auto-assigns port, don't worry
- Build failed → Check `package.json` dependencies

### Bot Assignment Fails
**Check:**
1. MongoDB connection is active (Render logs)
2. Table ID and seat index are valid (0-5)
3. Seat is not already occupied

### Can't Connect to MongoDB Atlas
**Fix:**
1. Check Network Access → Should have 0.0.0.0/0
2. Check Database User → Password correct?
3. Check connection string → Has `/teenpatti` before `?`

---

## 🎯 Next Steps

### Integrate with Frontend
```typescript
// client/src/services/botService.ts
export async function assignBot(tableId: number, seatIndex: number) {
  const response = await fetch(`${API_URL}/api/admin/tables/${tableId}/seats/${seatIndex}/assign-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity_mode: 'randomize',
      behavior_profile_name: 'balanced'
    })
  });
  return response.json();
}
```

### Add Authentication
```typescript
// server/src/routes/adminBotRoutes.ts
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';

router.use(authenticate);
router.use(verifyAdmin);
```

### Implement Socket Events
```typescript
// After bot assignment
socketHandler.emitToTable(tableId, 'bot:assigned', {
  seatIndex,
  botData: botInstance
});
```

---

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string saved
- [ ] Render account created
- [ ] Web service deployed
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Server health check passes
- [ ] Bot assignment works
- [ ] Bot visible in MongoDB Atlas

---

## 🆘 Get Help

### Check Logs
```powershell
# Render: Dashboard → Your Service → Logs
# MongoDB Atlas: Database → Monitoring
```

### Common URLs
```
Render Dashboard: https://dashboard.render.com
MongoDB Atlas: https://cloud.mongodb.com
Your Server: https://teen-patti-server.onrender.com
```

### Documentation
```
TESTING_GUIDE.md - Testing instructions
DEPLOYMENT_GUIDE.md - Detailed deployment
BOT_SYSTEM_REVIEW.md - Technical details
```

---

## 🎉 You're Done!

**Your Bot Management System is LIVE!** 🚀

Test it out:
```powershell
Invoke-RestMethod -Uri "https://your-render-url.onrender.com/api/admin/tables/1/seats/0/assign-bot" -Method Post -Body '{"identity_mode":"randomize"}' -ContentType "application/json" | ConvertTo-Json
```

**Expected Result:**
- Bot name generated (e.g., "Rohan Sharma")
- Bot ID created (e.g., "RS-8732")
- Bot assigned to table 1, seat 0
- Bot data saved in MongoDB Atlas
- Balance: 10,000 coins ✅

---

**Total Time:** ~5 minutes  
**Status:** ✅ DEPLOYED  
**System:** 🟢 OPERATIONAL

**Built with ❤️ by GitHub Copilot**

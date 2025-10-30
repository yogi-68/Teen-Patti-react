# 🚀 Teen Patti Game - Online Deployment Guide

## Overview
This guide will help you deploy your Teen Patti game online so multiple players can play together from anywhere in the world.

---

## 📋 Prerequisites
1. GitHub account (to store your code)
2. MongoDB Atlas account (free - for database)
3. Render account (free - for backend server)
4. Vercel or Netlify account (free - for frontend)

---

## Part 1: Setup MongoDB Atlas (Database)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Click "Build a Database" → Choose **FREE** tier (M0)
4. Select a cloud provider (AWS/GCP/Azure) and region closest to you
5. Name your cluster (e.g., "TeenPattiCluster")

### Step 2: Create Database User
1. In Security → Database Access
2. Click "Add New Database User"
3. Username: `teenpatti_user`
4. Password: Generate a secure password (SAVE THIS!)
5. User Privileges: Read and write to any database

### Step 3: Allow Network Access
1. In Security → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Step 4: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://teenpatti_user:<password>@cluster.xxxxx.mongodb.net/
   ```
4. Replace `<password>` with your actual password
5. Add database name at the end: `...mongodb.net/teenpatti`

---

## Part 2: Deploy Backend Server (Render)

### Step 1: Prepare Server for Deployment
1. Make sure your server code is ready
2. Your `server/package.json` already has the correct scripts

### Step 2: Push Code to GitHub
```powershell
# In your project root
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 3: Deploy on Render
1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `teen-patti-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 4: Add Environment Variables on Render
In Render dashboard, go to Environment and add:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://teenpatti_admin:TeenPatti123@cluster0.3rtayk3.mongodb.net/teenpatti?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=teenpatti
CLIENT_URL=https://teen-patti-react.vercel.app
ALLOWED_ORIGINS=https://teen-patti-react.vercel.app
SOCKET_CORS_ORIGIN=https://teen-patti-react.vercel.app
SESSION_SECRET=teen-patti-production-secret-2024-change-this
JWT_SECRET=teen-patti-jwt-production-secret-2024-change-this
MAX_PLAYERS_PER_TABLE=5
```

**Note**: These are your actual values ready to paste into Render!

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (takes 2-5 minutes)
3. Copy your server URL (e.g., `https://teen-patti-server.onrender.com`)

---

## Part 3: Deploy Frontend (Vercel)

### Step 1: Create Environment File
Create a `.env.production` file in the `client` folder (we'll do this next)

### Step 2: Deploy on Vercel
1. Go to https://vercel.com and sign up
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables on Vercel
In Vercel dashboard, go to Settings → Environment Variables and add:

```
VITE_SOCKET_URL=https://teen-patti-server.onrender.com
```

Replace with your actual Render server URL from Part 2, Step 5.

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment (takes 1-2 minutes)
3. Copy your frontend URL (e.g., `https://teen-patti-game.vercel.app`)

---

## Part 4: Update Configuration

### Step 1: Update Server Environment Variables
Go back to Render and update these variables with your actual frontend URL:
- `CLIENT_URL`
- `ALLOWED_ORIGINS`
- `SOCKET_CORS_ORIGIN`

Then click "Save Changes" and wait for automatic redeploy.

---

## 🎮 Testing Your Live Game

1. Open your Vercel URL in a browser
2. Open the same URL in another browser or incognito window
3. Create a game in one browser
4. Join the game from the other browser
5. Start playing!

Share your Vercel URL with friends to play together!

---

## 🔧 Alternative Platforms

### Backend Alternatives:
- **Railway**: https://railway.app (Easy deployment, similar to Render)
- **Heroku**: https://heroku.com (Paid plans required now)
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### Frontend Alternatives:
- **Netlify**: https://netlify.com (Similar to Vercel)
- **Render Static Sites**: https://render.com
- **GitHub Pages**: Free but requires SPA routing setup

---

## 📊 Monitoring & Maintenance

### Check Logs
- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Deployments → View Function Logs

### Free Tier Limitations
- **Render Free**: Server sleeps after 15 min inactivity (takes 30-60s to wake up)
- **MongoDB Atlas Free**: 512MB storage, shared CPU
- **Vercel Free**: 100GB bandwidth/month

### Keep Server Awake (Optional)
If you want to prevent Render from sleeping, you can:
1. Use a service like UptimeRobot (https://uptimerobot.com)
2. Ping your server URL every 10 minutes
3. Or upgrade to Render's paid plan ($7/month)

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
- Check if server is running on Render
- Verify `VITE_SOCKET_URL` in Vercel matches your Render URL
- Check server logs for errors

### Issue: "CORS error"
- Verify `ALLOWED_ORIGINS` and `SOCKET_CORS_ORIGIN` in Render include your Vercel URL
- Make sure URLs don't have trailing slashes

### Issue: "Database connection failed"
- Check MongoDB Atlas is running
- Verify MongoDB connection string is correct
- Ensure IP whitelist includes 0.0.0.0/0

### Issue: Players can't join game
- Check Socket.IO is working (check browser console)
- Verify both players are connected to the same server
- Check server logs for game state errors

---

## 💰 Cost Summary

### Free Forever (with limitations):
- MongoDB Atlas: 512MB storage
- Render: Sleeps after inactivity
- Vercel: 100GB bandwidth/month

### Paid Options (if you need better performance):
- **MongoDB Atlas**: $9/month for dedicated cluster
- **Render**: $7/month to keep server always on
- **Vercel**: $20/month for Pro features (usually not needed)

**Total to keep everything always-on: ~$16/month**

---

## 🚀 Next Steps After Deployment

1. Test with friends from different locations
2. Monitor performance and logs
3. Add user authentication (optional)
4. Add game history and statistics
5. Add chat feature
6. Implement tournaments or leagues

---

## 📞 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review server logs on Render
3. Check browser console for errors
4. Verify all environment variables are correct

Good luck with your deployment! 🎉

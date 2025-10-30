# 🚀 Quick Deployment Checklist

Follow these steps in order to deploy your Teen Patti game online:

## ✅ Phase 1: Database Setup (10 minutes)
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a FREE cluster (M0)
- [ ] Create database user with password
- [ ] Allow access from anywhere (0.0.0.0/0)
- [ ] Get connection string and save it

## ✅ Phase 2: Push Code to GitHub (5 minutes)
```powershell
# Run these commands in your project root:
git add .
git commit -m "Ready for deployment"
git push origin main
```

## ✅ Phase 3: Deploy Backend (15 minutes)
- [ ] Sign up at https://render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Root Directory: `server`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Add environment variables (see `.env.example`)
- [ ] **Copy your server URL** (e.g., https://teen-patti-server.onrender.com)

## ✅ Phase 4: Deploy Frontend (10 minutes)
- [ ] Sign up at https://vercel.com
- [ ] Import GitHub repository
- [ ] Root Directory: `client`
- [ ] Framework: Vite
- [ ] Add environment variable: `VITE_SOCKET_URL` = your Render server URL
- [ ] Deploy
- [ ] **Copy your frontend URL** (e.g., https://teen-patti.vercel.app)

## ✅ Phase 5: Connect Frontend & Backend (5 minutes)
- [ ] Go back to Render dashboard
- [ ] Update these environment variables with your Vercel URL:
  - `CLIENT_URL`
  - `ALLOWED_ORIGINS`
  - `SOCKET_CORS_ORIGIN`
- [ ] Save and wait for automatic redeploy

## ✅ Phase 6: Test Your Game! (5 minutes)
- [ ] Open your Vercel URL in browser 1
- [ ] Open same URL in browser 2 (or incognito)
- [ ] Create a game in browser 1
- [ ] Join game from browser 2
- [ ] Play a round to verify everything works!

## 🎉 You're Live!
Share your Vercel URL with friends and play together online!

---

## 📝 Important URLs to Save:
- **Your Game (Frontend)**: ___________________________________
- **Your Server (Backend)**: ___________________________________
- **MongoDB Atlas**: https://cloud.mongodb.com

---

## ⚠️ Common Issues & Quick Fixes:

### "Cannot connect to server"
→ Check `VITE_SOCKET_URL` in Vercel matches your Render URL

### "CORS Error"
→ Update `ALLOWED_ORIGINS` in Render with your Vercel URL

### "Server not responding"
→ Render free tier sleeps after 15 min. First request takes 30-60 seconds to wake up

### "Database connection failed"
→ Check MongoDB connection string has correct password and database name

---

## 💡 Pro Tips:
- Free Render server sleeps after 15 min of inactivity
- First connection after sleep takes 30-60 seconds
- Use UptimeRobot to keep server awake (optional)
- MongoDB Atlas free tier has 512MB storage limit

---

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

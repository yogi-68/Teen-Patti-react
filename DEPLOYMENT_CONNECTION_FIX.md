# 🚀 Deployment Connection Fix

## Issue
Frontend (Vercel) was trying to connect to `localhost:3001` instead of deployed backend.

## ✅ What Was Fixed

### 1. Updated API URLs to use Environment Variables
- **Auth.tsx**: Changed to `import.meta.env.VITE_API_URL`
- **Dashboard.tsx**: Changed to `import.meta.env.VITE_API_URL`
- **socket.ts**: Already using `import.meta.env.VITE_SOCKET_URL` ✓

### 2. Fallback for Local Development
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```
- Production: Uses environment variable from Vercel
- Local: Uses localhost:3001

## 🔧 Setup Instructions

### Step 1: Get Your Render Backend URL
1. Go to your Render dashboard
2. Find your backend service
3. Copy the URL (e.g., `https://teen-patti-server.onrender.com`)

### Step 2: Add Environment Variables to Vercel
1. Go to: https://vercel.com/
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

**Variable 1:**
- **Name**: `VITE_API_URL`
- **Value**: `https://YOUR-BACKEND.onrender.com/api`
- Check: Production, Preview, Development

**Variable 2:**
- **Name**: `VITE_SOCKET_URL`
- **Value**: `https://YOUR-BACKEND.onrender.com`
- Check: Production, Preview, Development

### Step 3: Redeploy
```powershell
git add .
git commit -m "Fix API URLs for deployment"
git push
```

Vercel will automatically redeploy with the new environment variables!

## 🧪 Testing

After deployment:
1. Go to your Vercel URL
2. Try to sign up/login
3. Open browser console (F12)
4. You should see:
   - ✅ "Attempting to login/register user..."
   - ✅ "User data received..."
   - ✅ Connected to your Render backend

## 🔍 Verify Environment Variables

In browser console on your deployed site, type:
```javascript
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_SOCKET_URL);
```

Should show your Render URLs, not localhost!

## 📋 Quick Checklist

- [ ] Render backend is deployed and running
- [ ] Copy Render backend URL
- [ ] Add `VITE_API_URL` to Vercel (with `/api` at end)
- [ ] Add `VITE_SOCKET_URL` to Vercel (without `/api`)
- [ ] Push code changes to GitHub
- [ ] Wait for Vercel auto-deploy
- [ ] Test login on deployed site
- [ ] Check browser console for connection logs

## 🎯 Expected URLs

### Render Backend
```
https://teen-patti-server.onrender.com
```

### Vercel Environment Variables
```
VITE_API_URL=https://teen-patti-server.onrender.com/api
VITE_SOCKET_URL=https://teen-patti-server.onrender.com
```

### Local Development (.env.local)
```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### "Failed to connect to server"
- ✓ Check Render backend is running (not sleeping)
- ✓ Verify environment variables in Vercel
- ✓ Make sure URLs have `https://` (not `http://`)
- ✓ API URL should end with `/api`
- ✓ Socket URL should NOT end with `/api`

### "CORS Error"
- Backend needs to allow your Vercel domain
- Check `server/.env` has correct `ALLOWED_ORIGINS`
- Should include your Vercel domain

### Backend Not Responding
- Render free tier sleeps after 15 min
- First request takes ~30 seconds to wake up
- Subsequent requests are fast

## ✅ Success Indicators

✅ No "localhost" errors in browser console
✅ Login creates user in MongoDB
✅ Socket connection established
✅ Game works correctly
✅ Add money saves to database

Your app should now work in production! 🎉

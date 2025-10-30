# Render Environment Variables Setup

## 🚨 CRITICAL: CORS Configuration Required

Your deployment is failing because the Render backend doesn't allow requests from your Vercel domain.

**Error:** `Failed to fetch` = CORS (Cross-Origin Resource Sharing) blocked

---

## ✅ Step-by-Step Fix

### 1. Get Your Vercel Domain
1. Go to your Vercel dashboard
2. Find your project URL (e.g., `https://teen-patti-react.vercel.app`)
3. Copy the full URL

### 2. Add Environment Variables to Render
1. Go to **Render Dashboard** → Your Backend Service
2. Click on **Environment** tab (left sidebar)
3. Add the following environment variables:

#### Required Variables:

```bash
# Database
MONGODB_URI=mongodb+srv://teenpatti_admin:TeenPatti123@cluster0.3rtayk3.mongodb.net/teenpatti?retryWrites=true&w=majority&appName=Cluster0

# CORS - CRITICAL FOR VERCEL CONNECTION
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:5173
SOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app,http://localhost:5173

# Other Settings
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-vercel-domain.vercel.app
SESSION_SECRET=your-secret-key-change-in-production-teen-patti-2024
JWT_SECRET=your-jwt-secret-change-in-production-teen-patti-2024
MAX_PLAYERS_PER_TABLE=5
```

**⚠️ IMPORTANT:** Replace `https://your-vercel-domain.vercel.app` with your actual Vercel URL!

### 3. Format for Multiple Domains
Use comma-separated values (no spaces):
```
ALLOWED_ORIGINS=https://teen-patti-react.vercel.app,http://localhost:5173
```

### 4. Save and Redeploy
1. Click **Save Changes** in Render
2. Render will automatically redeploy your backend
3. Wait 2-3 minutes for deployment to complete

---

## 🔍 Verify the Fix

### Test Backend Directly
Open this URL in your browser:
```
https://teen-patti-server.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T..."
}
```

### Test from Vercel Site
1. Open your Vercel site
2. Try to login
3. Open browser console (F12)
4. Should see successful API calls, no CORS errors

---

## 📋 Common CORS Errors

### Error: "Failed to fetch"
**Cause:** Backend doesn't allow your Vercel domain

**Fix:** Add Vercel domain to `ALLOWED_ORIGINS` and `SOCKET_CORS_ORIGIN`

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Cause:** Same as above

**Fix:** Double-check environment variables are saved in Render

### Error: "Network request failed"
**Cause:** Backend service is down or URL is wrong

**Fix:** Check Render dashboard - is service running? Check logs for errors.

---

## 🎯 Expected Render Environment Variables

Your Render environment should have these variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | `mongodb+srv://...` | Database connection |
| `ALLOWED_ORIGINS` | `https://yourapp.vercel.app,http://localhost:5173` | API CORS |
| `SOCKET_CORS_ORIGIN` | `https://yourapp.vercel.app,http://localhost:5173` | Socket.IO CORS |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `https://yourapp.vercel.app` | Frontend URL |

---

## 🔄 After Adding Variables

1. ✅ Save in Render dashboard
2. ✅ Wait for auto-redeploy (2-3 minutes)
3. ✅ Check Render logs for successful startup
4. ✅ Test your Vercel site
5. ✅ Hard refresh browser (Ctrl + Shift + R)

---

## 🆘 Still Not Working?

### Check Render Logs
1. Go to Render dashboard → Your service
2. Click **Logs** tab
3. Look for:
   - ✅ `MongoDB connected successfully`
   - ✅ `Teen Patti Server Running!`
   - ❌ Any error messages

### Check Browser Console
1. Open Vercel site
2. Press F12
3. Go to Network tab
4. Try to login
5. Look at the failed request:
   - Status 403 = CORS issue (add domain to ALLOWED_ORIGINS)
   - Status 500 = Server error (check Render logs)
   - Status 0 = Server not running or wrong URL

---

## 📝 Notes

- Environment variables in Render must be saved AND deployed to take effect
- CORS is browser security - backend must explicitly allow frontend domain
- Multiple origins are separated by commas with NO spaces
- Changes to environment variables require redeploy
- Render free tier may spin down after inactivity (takes 30-60 seconds to wake up)

---

## ✅ Success Checklist

- [ ] Added `ALLOWED_ORIGINS` to Render with Vercel domain
- [ ] Added `SOCKET_CORS_ORIGIN` to Render with Vercel domain
- [ ] Saved environment variables in Render
- [ ] Waited for Render to redeploy
- [ ] Tested backend health endpoint
- [ ] Tested login from Vercel site
- [ ] No CORS errors in browser console

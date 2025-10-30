# Troubleshooting Production Connection Error

## Current Error
```
Failed to connect to server. Make sure the server is running on port 3001.
```

## Root Cause
Your deployed Vercel frontend is still trying to connect to `localhost:3001` instead of your Render backend.

---

## ✅ Step-by-Step Fix

### 1. Verify Vercel Environment Variables
Go to your Vercel dashboard and check if these variables are set:

**Navigate to:** https://vercel.com → Your Project → Settings → Environment Variables

**Required Variables:**
```
VITE_API_URL=https://teen-patti-server.onrender.com/api
VITE_SOCKET_URL=https://teen-patti-server.onrender.com
```

**⚠️ IMPORTANT:** Replace `your-render-backend` with your actual Render URL.

### 2. Apply Variables to Production
After adding variables, make sure they are checked for:
- ✅ Production
- ✅ Preview (optional)
- ✅ Development (optional)

### 3. Trigger Redeploy
Since code is already pushed, you need to redeploy:

**Option A:** Go to Vercel → Deployments → Click "Redeploy" on the latest deployment

**Option B:** Make a small commit to trigger auto-deploy:
```powershell
cd c:\Users\yoges\OneDrive\Desktop\teen-patti-react
echo "" >> README.md
git add README.md
git commit -m "Trigger redeploy"
git push
```

### 4. Clear Browser Cache
After redeployment completes:
1. Open your Vercel site in browser
2. Press `Ctrl + Shift + R` (hard refresh)
3. Or open in Incognito/Private window

### 5. Verify the Fix
Open browser Developer Tools (F12) and check Console:
- ❌ If you see "localhost:3001" → Environment variables not loaded
- ✅ If you see your Render URL → Variables loaded correctly

---

## 🔍 Quick Diagnostic

### Check Current Deployed Code
1. Open your Vercel site
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Type: `import.meta.env.VITE_API_URL`
5. Press Enter

**Expected Results:**
- ❌ `undefined` → Environment variables NOT set in Vercel
- ✅ `https://your-render-backend.onrender.com/api` → Correctly configured

---

## 📋 Common Issues

### Issue 1: Variables Not Showing
**Symptom:** `import.meta.env.VITE_API_URL` returns `undefined`

**Fix:** 
1. Double-check variable names (must start with `VITE_`)
2. Make sure "Production" is checked when adding variable
3. Redeploy after adding variables

### Issue 2: Old Code Still Running
**Symptom:** Still seeing localhost in errors after redeploy

**Fix:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Try incognito window

### Issue 3: Render Backend Not Running
**Symptom:** Variables set correctly but still can't connect

**Fix:**
1. Check Render dashboard - is your backend service running?
2. Test backend directly: Open `https://your-render-backend.onrender.com/api/health`
3. Should return "OK" or server info

---

## 🎯 What Should Happen

### Before Fix:
```
Browser → tries localhost:3001 → ❌ Not found (Error)
```

### After Fix:
```
Browser → reads VITE_API_URL from Vercel env vars → 
connects to Render backend → ✅ Success
```

---

## 🆘 Still Not Working?

If you've done all the above and still getting errors, provide:
1. Screenshot of Vercel environment variables page
2. Your Render backend URL
3. Browser console error (F12 → Console tab)
4. Output of: `import.meta.env.VITE_API_URL` from browser console

---

## 📝 Notes

- Environment variables must start with `VITE_` to be exposed to browser
- Changes to environment variables require redeploy to take effect
- Vercel caches aggressively - always hard refresh after redeploy
- Backend URL should be HTTPS (not HTTP) on Render

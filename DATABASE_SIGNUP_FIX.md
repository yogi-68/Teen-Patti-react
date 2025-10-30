# Database Signup Fix - Testing Guide

## Issue
Signup data not being stored in database.

## What Was Fixed
✅ Added detailed console logging on both client and server
✅ Added better error handling and validation
✅ Server now logs every step of user creation

## How to Test

### 1. Start the Server (Terminal 1)
```powershell
cd server
npm run dev
```

**Look for:**
```
✅ MongoDB connected successfully
📍 Database: teenpatti
🚀 Server running on port 3001
```

### 2. Start the Client (Terminal 2)
```powershell
cd client
npm run dev
```

### 3. Test Signup Flow

**Step A: Open Browser Console**
- Open browser (Chrome/Edge)
- Press F12 to open Developer Tools
- Go to Console tab

**Step B: Try to Register**
1. Go to http://localhost:5173
2. Click "Register" tab
3. Enter username: `testuser123`
4. Enter email (optional): `test@example.com`
5. Enter password: `password123`
6. Confirm password: `password123`
7. Check "I agree to Terms" checkbox
8. Click "Create Account"

**Step C: Watch the Logs**

**In Browser Console, you should see:**
```
🔄 Attempting to login/register user: testuser123
📥 Response from server: { user: {...}, message: "Login successful" }
✅ User data received: { id: "...", username: "testuser123", coins: 100, cashBalance: 0 }
```

**In Server Terminal, you should see:**
```
🔄 Login/Register request received: { username: 'testuser123', email: 'test@example.com' }
📦 Finding or creating user in database...
✅ User created/found: { id: '...', username: 'testuser123', coins: 100, cashBalance: 0 }
```

### 4. Verify in Database

**Option A: MongoDB Compass**
1. Open MongoDB Compass
2. Connect to: `mongodb+srv://teenpatti_admin:TeenPatti123@cluster0.3rtayk3.mongodb.net/`
3. Browse to `teenpatti` database → `users` collection
4. Look for your user with username `testuser123`

**Option B: MongoDB Atlas**
1. Go to https://cloud.mongodb.com/
2. Login to your account
3. Click on your cluster
4. Click "Browse Collections"
5. Select `teenpatti` database → `users` collection
6. Search for username `testuser123`

## Troubleshooting

### Error: "Failed to connect to server"

**Problem:** Server is not running or wrong port

**Solution:**
1. Make sure server is running on port 3001
2. Check server terminal for errors
3. Restart server: `Ctrl+C` then `npm run dev`

### Error: "Login failed"

**Problem:** Database connection issue

**Check:**
1. Server logs show: `✅ MongoDB connected successfully`
2. If not, check `.env` file has correct `MONGODB_URI`
3. Check MongoDB Atlas network access (0.0.0.0/0 allowed)

### No Console Logs in Browser

**Problem:** Browser console might be filtered

**Solution:**
1. In browser console, make sure filter is set to "All" or "Info"
2. Clear console and try again
3. Refresh the page

### Server Shows "Cannot find module"

**Problem:** Dependencies not installed

**Solution:**
```powershell
cd server
npm install
npm run dev
```

### User Created but Not Saved

**Problem:** MongoDB connection issue

**Check Server Logs for:**
```
⚠️  MongoDB connection failed, running without database
```

**If you see this:**
1. Check `server/.env` has correct `MONGODB_URI`
2. Check MongoDB Atlas allows your IP address
3. Test connection string in MongoDB Compass first

## Expected Database Document

After successful signup, your user document should look like:

```json
{
  "_id": "673ea1234567890abcdef123",
  "username": "testuser123",
  "email": "test@example.com",
  "coins": 100,
  "cashBalance": 0,
  "gamesPlayed": 0,
  "gamesWon": 0,
  "totalWinnings": 0,
  "totalCashWinnings": 0,
  "createdAt": "2025-10-31T12:00:00.000Z",
  "updatedAt": "2025-10-31T12:00:00.000Z",
  "__v": 0
}
```

## Quick Debug Checklist

- [ ] Server running on port 3001
- [ ] MongoDB connected (check server logs)
- [ ] Client running on port 5173
- [ ] Browser console open (F12)
- [ ] Network tab shows POST request to `/api/users/login`
- [ ] Response status is 200 (not 404, 500)
- [ ] Response contains `user` object with `_id`
- [ ] MongoDB shows the new user document

## Common Issues

### 1. CORS Error
```
Access to fetch at 'http://localhost:3001/api/users/login' blocked by CORS
```

**Fix:** Server should have CORS enabled (already done in server/src/index.ts)

### 2. Network Error
```
Failed to fetch
```

**Fix:** Make sure server is running and accessible at http://localhost:3001

### 3. MongoDB Not Connected
```
⚠️ MongoDB connection failed
```

**Fix:** 
- Check `MONGODB_URI` in `server/.env`
- Test connection in MongoDB Compass
- Check network access in MongoDB Atlas

## Success Indicators

✅ No errors in browser console
✅ Server logs show user created
✅ User appears in MongoDB
✅ Login with same username works
✅ Cash balance persists after logout/login

## Need Help?

If signup still doesn't work after following this guide:

1. Copy the error message from browser console
2. Copy the error message from server terminal
3. Check MongoDB Atlas "Metrics" tab for connection errors
4. Verify your MongoDB connection string is correct

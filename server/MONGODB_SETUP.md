# 🗄️ MongoDB Setup Guide

## ✅ Mongoose Installed & Configured!

The server is configured to work with MongoDB, but you need to set up a database.

---

## 🚀 Option 1: MongoDB Atlas (Cloud - Recommended)

**Free tier available, no installation needed!**

### Steps:
1. **Create Account**: Visit https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**: 
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create Cluster"
3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username/password (save these!)
4. **Whitelist IP**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
6. **Update `.env`**:
   ```properties
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teenpatti?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your credentials

### ✅ Restart server - MongoDB will connect automatically!

---

## 🏠 Option 2: Local MongoDB (Development)

### Windows Installation:

1. **Download**: https://www.mongodb.com/try/download/community
2. **Install**: Run the installer
   - Choose "Complete" installation
   - Install as Windows Service
   - Install MongoDB Compass (GUI tool)
3. **Verify Installation**:
   ```powershell
   mongod --version
   ```
4. **Start MongoDB**:
   - Automatically starts as Windows Service
   - Or run: `net start MongoDB`
5. **Update `.env`** (already configured):
   ```properties
   MONGODB_URI=mongodb://localhost:27017/teenpatti
   ```

### ✅ Restart server - MongoDB will connect!

---

## 🐧 Linux Installation:

### Ubuntu/Debian:
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

---

## 🍎 macOS Installation:

```bash
# Install with Homebrew
brew tap mongodb/brew
brew install mongodb-community@8.0

# Start MongoDB
brew services start mongodb-community@8.0

# Check status
brew services list
```

---

## 📊 Using MongoDB Compass (GUI)

**Free MongoDB GUI tool for database management**

1. **Download**: https://www.mongodb.com/try/download/compass
2. **Connect**: 
   - Local: `mongodb://localhost:27017`
   - Atlas: Use connection string from Atlas
3. **Features**:
   - Browse collections
   - Run queries
   - View indexes
   - Performance monitoring

---

## 🔍 Verify Connection

### Check Server Logs:
```
✅ MongoDB connected successfully
📍 Database: teenpatti
```

### Or see warning if not connected:
```
⚠️ Server will run without database. Install MongoDB or use MongoDB Atlas.
```

---

## 🧪 Test Database Operations

### Create a User:
```typescript
import { userRepository } from './repositories/UserRepository';

const user = await userRepository.create({
  username: 'testplayer',
  chips: 10000,
});

console.log('User created:', user);
```

### View in MongoDB Compass:
1. Connect to database
2. Browse `teenpatti` database
3. View `users` collection
4. See your test user!

---

## 🎯 Environment Variables

### Local MongoDB (`.env`):
```properties
MONGODB_URI=mongodb://localhost:27017/teenpatti
DB_NAME=teenpatti
```

### MongoDB Atlas (`.env`):
```properties
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teenpatti?retryWrites=true&w=majority
DB_NAME=teenpatti
```

---

## 🔧 Troubleshooting

### Error: "connect ECONNREFUSED"
**Problem**: MongoDB is not running
**Solution**: 
- Windows: `net start MongoDB`
- Linux: `sudo systemctl start mongod`
- macOS: `brew services start mongodb-community`
- Or use MongoDB Atlas (cloud)

### Error: "Authentication failed"
**Problem**: Wrong username/password
**Solution**: Check MongoDB Atlas credentials or create database user

### Error: "IP not whitelisted"
**Problem**: Atlas connection blocked
**Solution**: Add your IP in Atlas Network Access settings

### Server runs without database
**Status**: ⚠️ Warning (not error)
**Impact**: Game works, but no data persistence
**Solution**: Install MongoDB or use Atlas

---

## 📦 Collections Created

When you start using the database, these collections will be created:

| Collection | Schema | Purpose |
|------------|--------|---------|
| `users` | User.model.ts | Player profiles, chips, stats |
| `gamehistories` | GameHistory.model.ts | Game records, winners, pots |

---

## 🎮 Current Status

The server will **start without MongoDB** and show a warning:
```
⚠️ Server will run without database. Install MongoDB or use MongoDB Atlas.
```

**This is intentional for development!** You can:
- ✅ Test the game without database
- ✅ Set up MongoDB when ready
- ✅ Everything else works normally

---

## 🚀 Recommended: MongoDB Atlas (Free)

**Best option for development and production:**
- ✅ No installation required
- ✅ Free tier (512 MB)
- ✅ Automatic backups
- ✅ Cloud-hosted
- ✅ Easy to scale
- ✅ Works from anywhere
- ✅ 10-minute setup

**Follow Option 1 above to get started!**

---

## 📚 Resources

- **MongoDB Docs**: https://www.mongodb.com/docs/
- **Atlas Setup**: https://www.mongodb.com/docs/atlas/getting-started/
- **Compass**: https://www.mongodb.com/products/compass
- **Mongoose Guide**: See `MONGOOSE_GUIDE.md`

---

**Once MongoDB is set up, the database will connect automatically on server start! 🎉**

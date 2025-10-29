# 🚀 Quick Command Reference

## Installation Commands

### Install Server Dependencies
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\server
npm install
```

### Install Client Dependencies
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\client
npm install
```

## Development Commands

### Start Server (Terminal 1)
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\server
npm run dev
```
Server: http://localhost:3001

### Start Client (Terminal 2)
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react\client
npm run dev
```
Client: http://localhost:5173

## Production Commands

### Build Server
```powershell
cd server
npm run build
npm start
```

### Build Client
```powershell
cd client
npm run build
npm run preview
```

## Utility Commands

### Check Server Status
```powershell
curl http://localhost:3001/health
```

### Kill Process on Port 3001
```powershell
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

### Git Commands
```powershell
# Initialize (already done)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit - Modern Teen Patti setup"

# Push to GitHub
git remote add origin https://github.com/yogi-68/teen-patti-react.git
git push -u origin main
```

## NPM Script Reference

### Server Scripts
- `npm run dev` - Start development server with tsx watch
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint

### Client Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## File Locations

### Configuration Files
- Server: `teen-patti-react/server/.env`
- Client: `teen-patti-react/client/.env`

### Main Entry Points
- Server: `teen-patti-react/server/src/index.ts`
- Client: `teen-patti-react/client/src/main.tsx` (to be created)

### Package Files
- Server: `teen-patti-react/server/package.json`
- Client: `teen-patti-react/client/package.json`

## VS Code Commands

### Open Project
```powershell
cd C:\Users\yoges\OneDrive\Desktop\Task\teen-patti-react
code .
```

### Open Integrated Terminal
```
Ctrl + ` (backtick)
```

### Split Terminal
```
Ctrl + Shift + 5
```

## Troubleshooting

### Clear npm cache
```powershell
npm cache clean --force
```

### Delete node_modules and reinstall
```powershell
# Server
cd server
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Client
cd ../client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### TypeScript errors not clearing
```powershell
# Restart TypeScript server in VS Code
Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## Quick Test

### Test Socket.IO Connection
Open browser console at http://localhost:5173 and run:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

## Environment Variables

### Server (.env)
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## Common Issues

### Issue: Port 3001 already in use
**Solution:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

### Issue: Module not found
**Solution:**
```powershell
npm install
```

### Issue: TypeScript errors
**Solution:** Install dependencies first, then restart TS server

### Issue: CORS errors
**Solution:** Check CLIENT_URL in server/.env matches client URL

---

**Copy and paste these commands as needed!** 🚀

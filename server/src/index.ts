import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { SocketHandler } from './socket/SocketHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    game: 'Teen Patti',
  });
});

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);
console.log('✅ Socket.IO initialized');

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🎮 Teen Patti Server Running! 🎮   ║
╠═══════════════════════════════════════╣
║  Port:        ${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
║  Client URL:  ${process.env.CLIENT_URL || 'http://localhost:5173'}  ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { SocketHandler } from './socket/SocketHandler.js';
import { database } from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:5173'];
console.log('🔐 CORS Allowed Origins:', allowedOrigins);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for:', origin);
      console.log('   Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// User routes
app.use('/api/users', userRoutes);

// Subscription routes
app.use('/api/subscription', subscriptionRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Initialize Database
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    try {
      await database.connect();
      console.log('✅ MongoDB is CONNECTED and READY');
    } catch (dbError) {
      console.error('❌ MongoDB connection FAILED:');
      console.error('Error details:', dbError);
      console.warn('⚠️  Running without database - data will NOT be saved!');
      console.warn('⚠️  Users will be created in memory only!');
    }
    
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
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await database.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await database.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

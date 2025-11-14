import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { SocketHandler } from './socket/SocketHandler.js';
import { database } from './config/database.js';
import SocketService from './services/SocketService.js';
import BotSocketManager from './services/BotSocketManager.js';
import { BotScheduler } from './services/BotScheduler.js';
import AuditLogRepository from './repositories/AuditLogRepository.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminBotRoutes from './routes/adminBotRoutes.js';
import botAnalyticsRoutes from './routes/botAnalyticsRoutes.js';
import botSchedulerRoutes from './routes/botSchedulerRoutes.js';
import testBotRoutes from './routes/testBotRoutes.js';
import testBotDecisionRoutes from './routes/testBotDecisionRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import botChatRoutes from './routes/botChatRoutes.js';
import jokerRoutes from './routes/jokerRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import transactionHistoryRoutes from './routes/transactionHistoryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT: number = Number(process.env.PORT) || 3001;

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:5173'];

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview/deployment URLs (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Apply basic rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint for health checks (Render.com, etc.)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Teen Patti Game Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Also respond to HEAD requests for root
app.head('/', (req, res) => {
  res.status(200).end();
});

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

// Protect API routes with rate limiter
app.use('/api', apiLimiter);

// User routes
app.use('/api/users', userRoutes);

// Table routes
app.use('/api/tables', tableRoutes);

// Subscription routes
app.use('/api/subscription', subscriptionRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Enquiry routes
app.use('/api/enquiry', enquiryRoutes);

// Public test routes for bot system (NO AUTH)
app.use('/api/test', testBotRoutes);
app.use('/api/test', testBotDecisionRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Admin bot management routes
app.use('/api/admin', adminBotRoutes);

// Bot analytics routes (public for testing, should be admin-protected in production)
app.use('/api/admin/bot-analytics', botAnalyticsRoutes);

// Bot scheduler routes (admin-protected)
app.use('/api/admin/scheduler', botSchedulerRoutes);

// Audit log routes (admin-protected)
app.use('/api/admin/audit-logs', auditLogRoutes);

// Bot chat routes (admin-protected)
app.use('/api/admin/bot-chat', botChatRoutes);

// Joker feature routes
app.use('/api/joker', jokerRoutes);

// Referral system routes
app.use('/api/referral', referralRoutes);

// Transaction history routes
app.use('/api/history', transactionHistoryRoutes);

// Transfer routes
app.use('/api/transfer', transferRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

// Initialize Database
async function startServer() {
  try {
    // Connect to MongoDB
    
    try {
      await database.connect();
    } catch (dbError) {
      console.error('❌ MongoDB connection FAILED:');
      console.error('Error details:', dbError);
      console.warn('⚠️  Running without database - data will NOT be saved!');
      console.warn('⚠️  Users will be created in memory only!');
    }
    
    // Initialize Socket.IO
    const socketHandler = new SocketHandler(server);
    
    // Store socketHandler on app for route access
    app.set('socketHandler', socketHandler);
    
    // Initialize BotSocketManager with Socket.IO instance and SocketHandler
    BotSocketManager.initialize(socketHandler.getIO(), socketHandler);
    
    // Initialize SocketService with the socketHandler instance
    SocketService.initialize(socketHandler);
    
    // Initialize Audit Log Repository
    try {
      const db = database.getDb();
      if (db) {
        await AuditLogRepository.initialize(db);
      }
    } catch (auditError) {
      console.warn('⚠️  Audit Log initialization failed:', auditError);
      console.warn('⚠️  Continuing without audit logging');
    }
    
    // Initialize Bot Scheduler
    BotScheduler.initialize();
    
    // Start server - bind to 0.0.0.0 to allow connections from network (mobile devices)
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════╗
║   🎮 Teen Patti Server Running! 🎮   ║
╠═══════════════════════════════════════╣
║  Port:        ${PORT}                    ║
║  Host:        0.0.0.0 (all interfaces)  ║
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
  BotScheduler.stopAll();
  await database.disconnect();
  server.close(() => {
  });
});

process.on('SIGINT', async () => {
  BotScheduler.stopAll();
  await database.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

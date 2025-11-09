import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { SocketHandler } from './socket/SocketHandler.js';
import { database } from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT: number = Number(process.env.PORT) || 3001;

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:5173'];
console.log('🔐 CORS Allowed Origins:', allowedOrigins);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for:', origin);
      return callback(null, true);
    }
    
    // Allow all Vercel preview/deployment URLs (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      console.log('✅ CORS allowed for Vercel deployment:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked for:', origin);
    console.log('   Allowed origins:', allowedOrigins);
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

// Admin routes
app.use('/api/admin', adminRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

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

/**
 * Test server setup for security tests
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Mock authentication middleware
export const mockAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (token === 'invalid-token') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (token === 'expired-token') {
    return res.status(401).json({ error: 'Token expired' });
  }

  if (token === 'non-admin-token') {
    req.user = { userId: 'test-user', isAdmin: false };
    return next();
  }

  // Valid admin token
  req.user = { userId: 'admin-user', isAdmin: true };
  next();
};

// Mock admin middleware
export const mockAdminMiddleware = (req: any, res: any, next: any) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Input validation middleware
export const validateTableId = (req: any, res: any, next: any) => {
  const tableId = req.params.tableId || req.body.table_id;
  
  if (tableId && (isNaN(tableId) || tableId < 1 || tableId > 1000)) {
    return res.status(400).json({ error: 'Invalid table_id' });
  }
  next();
};

export const validateSeatIndex = (req: any, res: any, next: any) => {
  const seatIndex = req.params.seatIndex || req.body.seat_index;
  
  if (seatIndex !== undefined && (isNaN(seatIndex) || seatIndex < 0 || seatIndex > 5)) {
    return res.status(400).json({ error: 'Invalid seat_index (must be 0-5)' });
  }
  next();
};

// Payload size limiter
export const payloadSizeLimiter = express.json({ limit: '10kb' });

// Create test server
export function createTestServer(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(payloadSizeLimiter);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: { error: 'Too many requests' }
  });

  // Mock routes
  app.get('/api/admin/bots/blueprints', mockAuthMiddleware, mockAdminMiddleware, (req, res) => {
    res.json({ blueprints: [] });
  });

  app.post('/api/admin/tables/:tableId/seats', 
    mockAuthMiddleware, 
    mockAdminMiddleware,
    validateTableId,
    validateSeatIndex,
    (req, res) => {
      // Check for NoSQL injection
      if (typeof req.body.table_id === 'object' || typeof req.body.seat_index === 'object') {
        return res.status(400).json({ error: 'Invalid input format' });
      }
      res.json({ success: true });
    }
  );

  app.post('/api/admin/bots/blueprints',
    mockAuthMiddleware,
    mockAdminMiddleware,
    (req, res) => {
      // XSS protection check
      const description = req.body.description || '';
      if (description.includes('<script>') || description.includes('javascript:')) {
        return res.status(400).json({ error: 'Invalid characters in description' });
      }
      res.json({ blueprint: { id: '123', description } });
    }
  );

  app.get('/api/test-rate-limit', limiter, (req, res) => {
    res.json({ success: true });
  });

  app.get('/api/cors-test', (req, res) => {
    res.json({ success: true });
  });

  // Error handler - don't expose sensitive info
  app.use((err: any, req: any, res: any, next: any) => {
    // Don't expose stack traces or sensitive data
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;
    
    res.status(500).json({ error: message });
  });

  return app;
}

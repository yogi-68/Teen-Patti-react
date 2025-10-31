import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model.js';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isAdmin?: boolean;
    }
  }
}

/**
 * Middleware to verify if user is an admin
 * Must be used after authentication middleware
 */
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId; // Set by authentication middleware
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
};

/**
 * Simple auth middleware to extract userId from header/session
 * In production, use JWT or proper session management
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, accept userId from header (you should use JWT in production)
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

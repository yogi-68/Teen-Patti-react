import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Express Request to include rate limit info
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

/**
 * Rate limiter for admin bot management endpoints
 * Limits: 100 requests per 15 minutes per admin user
 */
export const adminBotRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each admin to 100 requests per windowMs
  message: {
    error: 'Too many requests from this admin account. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Use userId from authenticated request as key
  keyGenerator: (req: Request) => {
    return req.userId || req.ip || 'anonymous';
  },
  
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit for admin operations',
      retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() || Date.now()) / 1000),
      limit: 100,
      window: '15 minutes'
    });
  },
  
  // Skip successful requests from count (optional - counts all requests by default)
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Stricter rate limiter for sensitive operations
 * Limits: 20 requests per 15 minutes
 */
export const strictAdminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit to 20 requests per windowMs
  message: {
    error: 'Too many sensitive operations. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req: Request) => {
    return req.userId || req.ip || 'anonymous';
  },
  
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded for sensitive operations',
      message: 'You have exceeded the rate limit for bot assignments and modifications',
      retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() || Date.now()) / 1000),
      limit: 20,
      window: '15 minutes'
    });
  },
});

/**
 * General API rate limiter (for non-admin endpoints)
 * Limits: 1000 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // More generous for general API usage
  message: {
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

export default {
  adminBotRateLimiter,
  strictAdminRateLimiter,
  generalRateLimiter,
};

import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
  details?: any;
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error code constants
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  NOT_SUBSCRIBED: 'NOT_SUBSCRIBED',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORDS_DO_NOT_MATCH: 'PASSWORDS_DO_NOT_MATCH',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  
  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  
  // Business logic errors (422)
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_OPERATION: 'INVALID_OPERATION',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};

/**
 * Standard error messages
 */
export const ErrorMessages = {
  // Authentication
  UNAUTHORIZED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid username or password',
  INCORRECT_PASSWORD: 'Current password is incorrect',
  
  // Validation
  REQUIRED_FIELDS: 'All required fields must be filled',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  INVALID_AMOUNT: 'Please enter a valid amount',
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  REQUEST_NOT_FOUND: 'Request not found',
  
  // Conflicts
  USERNAME_EXISTS: 'Username already exists',
  EMAIL_EXISTS: 'Email already exists',
  ALREADY_PROCESSED: 'This request has already been processed',
  
  // Business logic
  INSUFFICIENT_BALANCE: 'Insufficient balance for this operation',
  SUBSCRIPTION_REQUIRED: 'You must subscribe to use this feature',
  INVALID_OPERATION: 'This operation is not allowed',
  
  // Server
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
  DATABASE_ERROR: 'Database operation failed',
};

/**
 * Validation helper functions
 */
export const validate = {
  required: (fields: Record<string, any>): string | null => {
    for (const [key, value] of Object.entries(fields)) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return `${key} is required`;
      }
    }
    return null;
  },

  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  passwordLength: (password: string, minLength: number = 6): boolean => {
    return password.length >= minLength;
  },

  positiveNumber: (value: any): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  passwordsMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  },
};

/**
 * Error handler middleware
 * Must be placed AFTER all routes
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error values
  let statusCode = 500;
  let message = ErrorMessages.INTERNAL_ERROR;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } 
  // Handle mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed: ' + err.message;
  }
  // Handle mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // Handle mongoose duplicate key errors
  else if (err.name === 'MongoError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry detected';
  }
  // Handle other errors
  else if (err.message) {
    message = err.message;
  }

  // Send error response
  const errorResponse: ErrorResponse = {
    error: message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

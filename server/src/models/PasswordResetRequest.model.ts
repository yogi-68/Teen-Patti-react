import mongoose, { Schema, Document } from 'mongoose';

/**
 * PasswordResetRequest Interface
 */
export interface IPasswordResetRequest extends Document {
  userId: string;
  username: string;
  email: string;
  userIdentifier: string; // What user entered (email or username)
  requestType: 'login' | 'token'; // login reset or token transfer reset
  status: 'pending' | 'completed' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string; // Admin user ID who processed the request
  adminNote?: string; // Optional note from admin
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PasswordResetRequest Schema
 */
const PasswordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    userIdentifier: {
      type: String,
      required: true,
    },
    requestType: {
      type: String,
      enum: ['login', 'token'],
      required: true,
      default: 'login',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    processedDate: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: String,
      ref: 'User',
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PasswordResetRequestSchema.index({ userId: 1, status: 1 });
PasswordResetRequestSchema.index({ status: 1, requestDate: -1 });

export const PasswordResetRequest = mongoose.model<IPasswordResetRequest>(
  'PasswordResetRequest',
  PasswordResetRequestSchema
);

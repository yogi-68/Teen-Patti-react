import mongoose, { Schema, Document } from 'mongoose';

/**
 * SubscriptionRequest Interface
 */
export interface ISubscriptionRequest extends Document {
  _id: string;
  userId: string;
  username: string;
  email: string;
  message: string; // User's request message
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string; // Admin user ID who processed the request
  adminNote?: string; // Optional note from admin
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SubscriptionRequest Schema
 */
const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>(
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
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
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
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
SubscriptionRequestSchema.index({ userId: 1 });
SubscriptionRequestSchema.index({ status: 1 });
SubscriptionRequestSchema.index({ requestDate: -1 });

export const SubscriptionRequest = mongoose.model<ISubscriptionRequest>(
  'SubscriptionRequest',
  SubscriptionRequestSchema
);

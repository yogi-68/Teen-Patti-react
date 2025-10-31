import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface ITransaction extends Document {
  _id: string;
  userId: string;
  username: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  upiId?: string;
  accountNumber?: string;
  remarks?: string;
  adminId?: string;
  adminUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10, // Minimum transaction ₹10
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    upiId: {
      type: String,
      default: null,
    },
    accountNumber: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      default: null,
    },
    adminId: {
      type: String,
      default: null,
    },
    adminUsername: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

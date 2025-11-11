import mongoose, { Schema, Document } from 'mongoose';

/**
 * Transaction History Types - Complete log of all user transactions
 */
export enum TransactionHistoryType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  JOKER_DEDUCTION = 'JOKER_DEDUCTION',
  TRANSFER_SENT = 'TRANSFER_SENT',
  TRANSFER_RECEIVED = 'TRANSFER_RECEIVED',
  GAME_WIN = 'GAME_WIN',
  GAME_LOSS = 'GAME_LOSS',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

/**
 * Transaction History Interface
 */
export interface ITransactionHistory extends Document {
  _id: string;
  userId: string; // User who owns this transaction
  type: TransactionHistoryType;
  amount: number; // Amount involved (positive or negative)
  balanceBefore: number; // Balance before transaction
  balanceAfter: number; // Balance after transaction
  description: string; // Human-readable description
  
  // Referral-specific fields
  fromUserId?: string; // For referral bonuses: who made the deposit
  fromUsername?: string; // Username of the referrer
  referralDepositNumber?: number; // 1st, 2nd, or 3rd deposit
  referralBonusPercent?: number; // 5%, 2%, or 1%
  
  // Transfer-specific fields
  toUserId?: string; // For transfers: recipient user ID
  toUsername?: string; // Username of recipient
  
  // Joker-specific fields
  gameId?: string; // Game where Joker was used
  jokerFeePercent?: number; // Usually 30%
  originalWinAmount?: number; // Win amount before Joker fee
  
  // Deposit/Withdrawal specific fields
  paymentMethod?: string; // UPI, Card, Bank Transfer, etc.
  transactionId?: string; // Reference ID from Transaction model
  
  // Metadata
  metadata?: Record<string, any>; // Additional data as needed
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction History Schema
 */
const TransactionHistorySchema = new Schema<ITransactionHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Index for fast queries by user
    },
    type: {
      type: String,
      enum: Object.values(TransactionHistoryType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    
    // Optional referral fields
    fromUserId: {
      type: String,
      default: null,
    },
    fromUsername: {
      type: String,
      default: null,
    },
    referralDepositNumber: {
      type: Number,
      min: 1,
      max: 3,
      default: null,
    },
    referralBonusPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    
    // Optional transfer fields
    toUserId: {
      type: String,
      default: null,
    },
    toUsername: {
      type: String,
      default: null,
    },
    
    // Optional Joker fields
    gameId: {
      type: String,
      default: null,
    },
    jokerFeePercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    originalWinAmount: {
      type: Number,
      default: null,
    },
    
    // Optional payment fields
    paymentMethod: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    
    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TransactionHistorySchema.index({ userId: 1, createdAt: -1 }); // User history sorted by date
TransactionHistorySchema.index({ userId: 1, type: 1 }); // Filter by type
TransactionHistorySchema.index({ fromUserId: 1 }); // Find referral bonuses from specific user
TransactionHistorySchema.index({ toUserId: 1 }); // Find transfers to specific user

export const TransactionHistory = mongoose.model<ITransactionHistory>('TransactionHistory', TransactionHistorySchema);

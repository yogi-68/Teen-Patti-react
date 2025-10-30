import mongoose, { Schema, Document } from 'mongoose';

/**
 * User Interface - TypeScript type
 */
export interface IUser extends Document {
  _id: string;
  username: string;
  email?: string;
  coins: number; // Free practice coins (fixed at 100, non-refillable)
  cashBalance: number; // Real money cash balance
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Schema
 */
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    coins: {
      type: Number,
      default: 100, // Free practice coins
      min: 0,
      max: 100, // Cannot exceed 100
    },
    cashBalance: {
      type: Number,
      default: 0, // Real money starts at 0
      min: 0,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes are automatically created by 'unique: true' in the schema
// No need for explicit index definitions

// Method to add/remove coins (free practice)
UserSchema.methods.updateCoins = function (amount: number) {
  this.coins += amount;
  if (this.coins < 0) this.coins = 0;
  if (this.coins > 100) this.coins = 100; // Cap at 100
  return this.save();
};

// Method to add/remove cash balance (real money)
UserSchema.methods.updateCashBalance = function (amount: number) {
  this.cashBalance += amount;
  if (this.cashBalance < 0) this.cashBalance = 0;
  return this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);

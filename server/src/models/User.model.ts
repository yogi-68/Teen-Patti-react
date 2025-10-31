import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Interface - TypeScript type
 */
export interface IUser extends Document {
  _id: string;
  username: string;
  email?: string;
  password: string; // Hashed password
  coins: number; // Free practice coins (fixed at 100, non-refillable)
  cashBalance: number; // Real money cash balance
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    password: {
      type: String,
      required: true,
      minlength: 6,
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

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

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

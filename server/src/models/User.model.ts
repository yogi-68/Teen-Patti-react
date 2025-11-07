import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Interface - TypeScript type
 */
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string; // Now required
  password: string; // Hashed password
  isAdmin: boolean; // Admin role flag
  isSubscribed: boolean; // Subscription status (lifetime)
  practiceCoins: number; // Practice mode coins (for normal users)
  realCoins: number; // Real mode coins (for subscribed users)
  subscriptionDate?: Date; // Date when user was subscribed
  avatar?: string;
  hasSeenTour: boolean; // Track if user has completed the game tour
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
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {
      type: Boolean,
      default: false, // Normal users by default
    },
    practiceCoins: {
      type: Number,
      default: 50, // Normal users start with 50 practice coins
      min: 0,
    },
    realCoins: {
      type: Number,
      default: 0, // Subscribed users' real coins (admin credits manually)
      min: 0,
    },
    subscriptionDate: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    hasSeenTour: {
      type: Boolean,
      default: false, // New users haven't seen the tour yet
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

// Method to add/remove practice coins
UserSchema.methods.updatePracticeCoins = function (amount: number) {
  this.practiceCoins += amount;
  if (this.practiceCoins < 0) this.practiceCoins = 0;
  return this.save();
};

// Method to add/remove real coins (for subscribed users)
UserSchema.methods.updateRealCoins = function (amount: number) {
  this.realCoins += amount;
  if (this.realCoins < 0) this.realCoins = 0;
  return this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);

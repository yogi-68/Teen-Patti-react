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
  practiceCoins: number; // Practice mode coins (for normal users) - FREE, cannot transfer/withdraw
  realCoins: number; // Real mode coins (for subscribed users) - Can transfer/withdraw after first deposit
  hasMadeFirstDeposit: boolean; // Track if user has made at least one real deposit
  totalDeposited: number; // Total amount deposited (for Joker eligibility)
  canUseJoker: boolean; // Computed: hasMadeFirstDeposit && realCoins >= 500
  referralCode: string; // Unique referral code for this user (e.g., REF12345)
  referredBy?: string; // User ID of the referrer (who invited this user)
  referredUsers: string[]; // Array of user IDs that this user has referred
  referralEarnings: number; // Total coins earned from referrals
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
      default: 100, // Every new user gets 100 practice coins (FREE - cannot transfer/withdraw)
      min: 0,
    },
    realCoins: {
      type: Number,
      default: 0, // Real cash coins from deposits (can transfer/withdraw after first deposit)
      min: 0,
    },
    hasMadeFirstDeposit: {
      type: Boolean,
      default: false, // Becomes true after first real deposit
    },
    totalDeposited: {
      type: Number,
      default: 0, // Total amount ever deposited
      min: 0,
    },
    canUseJoker: {
      type: Boolean,
      default: false, // Computed: hasMadeFirstDeposit && realCoins >= 500
    },
    referralCode: {
      type: String,
      required: false, // Optional, auto-generated if not provided
      unique: true,
      uppercase: true,
    },
    referredBy: {
      type: String, // User ID of the referrer
      default: null,
    },
    referredUsers: {
      type: [String], // Array of user IDs referred by this user
      default: [],
    },
    referralEarnings: {
      type: Number,
      default: 0, // Total coins earned from referral bonuses
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

// Generate unique referral code before saving new user
UserSchema.pre('save', async function (next) {
  // Generate referral code for new users
  if (this.isNew && !this.referralCode) {
    this.referralCode = await generateUniqueReferralCode();
  }
  
  // Hash password if modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Helper function to generate unique referral code
async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let exists = true;
  
  while (exists) {
    // Generate format: REF + 6 alphanumeric characters (e.g., REF12A3B4)
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `REF${randomPart}`;
    
    // Check if code already exists
    const user = await mongoose.model('User').findOne({ referralCode: code });
    exists = !!user;
  }
  
  return code!;
}

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

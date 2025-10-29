import mongoose, { Schema, Document } from 'mongoose';

/**
 * User Interface - TypeScript type
 */
export interface IUser extends Document {
  _id: string;
  username: string;
  email?: string;
  chips: number;
  avatar?: string;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
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
    chips: {
      type: Number,
      default: 10000,
      min: 0,
    },
    avatar: {
      type: String,
      default: null,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    gamesWon: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWinnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for better query performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

// Virtual for win rate
UserSchema.virtual('winRate').get(function () {
  if (this.gamesPlayed === 0) return 0;
  return (this.gamesWon / this.gamesPlayed) * 100;
});

// Method to update stats after game
UserSchema.methods.updateGameStats = function (won: boolean, winnings: number) {
  this.gamesPlayed += 1;
  if (won) {
    this.gamesWon += 1;
    this.totalWinnings += winnings;
  }
  return this.save();
};

// Method to add/remove chips
UserSchema.methods.updateChips = function (amount: number) {
  this.chips += amount;
  if (this.chips < 0) this.chips = 0;
  return this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);

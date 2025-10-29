import mongoose, { Schema, Document } from 'mongoose';

/**
 * Game History Interface
 */
export interface IGameHistory extends Document {
  _id: string;
  tableId: string;
  players: Array<{
    userId: string;
    username: string;
    startingChips: number;
    endingChips: number;
    bet: number;
    won: boolean;
    handRank?: string;
  }>;
  winner: {
    userId: string;
    username: string;
    amount: number;
  };
  pot: number;
  bootAmount: number;
  rounds: number;
  duration: number; // in seconds
  createdAt: Date;
}

/**
 * Game History Schema
 */
const GameHistorySchema = new Schema<IGameHistory>(
  {
    tableId: {
      type: String,
      required: true,
      index: true,
    },
    players: [
      {
        userId: {
          type: String,
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        startingChips: {
          type: Number,
          required: true,
        },
        endingChips: {
          type: Number,
          required: true,
        },
        bet: {
          type: Number,
          default: 0,
        },
        won: {
          type: Boolean,
          default: false,
        },
        handRank: {
          type: String,
        },
      },
    ],
    winner: {
      userId: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    pot: {
      type: Number,
      required: true,
    },
    bootAmount: {
      type: Number,
      required: true,
    },
    rounds: {
      type: Number,
      default: 1,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for queries
GameHistorySchema.index({ 'players.userId': 1 });
GameHistorySchema.index({ 'winner.userId': 1 });
GameHistorySchema.index({ createdAt: -1 });

export const GameHistory = mongoose.model<IGameHistory>('GameHistory', GameHistorySchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ITip extends Document {
  tipId: string;
  tableId: number;
  playerId: string;
  playerName: string;
  amount: number;
  gameMode: 'trial' | 'token';
  roundNumber: number;
  timestamp: Date;
  cardQuality?: 'pair' | 'color' | 'sequence' | 'pure_sequence' | 'trail' | 'regular';
}

const TipSchema: Schema = new Schema(
  {
    tipId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tableId: {
      type: Number,
      required: true,
      index: true,
    },
    playerId: {
      type: String,
      required: true,
      index: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      enum: [10, 20, 50, 100], // Only allow these amounts
    },
    gameMode: {
      type: String,
      enum: ['trial', 'token'],
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    cardQuality: {
      type: String,
      enum: ['pair', 'color', 'sequence', 'pure_sequence', 'trail', 'regular'],
      default: 'regular',
    },
  },
  {
    timestamps: true,
    collection: 'tips',
  }
);

// Indexes for efficient querying
TipSchema.index({ tableId: 1, roundNumber: 1 });
TipSchema.index({ playerId: 1, timestamp: -1 });
TipSchema.index({ timestamp: -1 });

export default mongoose.model<ITip>('Tip', TipSchema);

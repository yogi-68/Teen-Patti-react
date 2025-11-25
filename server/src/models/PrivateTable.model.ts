import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivateTable extends Document {
  tableCode: string;
  tableId: number;
  creatorId: string;
  creatorUsername: string;
  gameMode: 'practice' | 'real';
  bootAmount: number;
  maxPlayers: number;
  playerIds: string[];
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const PrivateTableSchema: Schema = new Schema({
  tableCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tableId: {
    type: Number,
    required: true,
  },
  creatorId: {
    type: String,
    required: true,
  },
  creatorUsername: {
    type: String,
    required: true,
  },
  gameMode: {
    type: String,
    enum: ['practice', 'real'],
    required: true,
  },
  bootAmount: {
    type: Number,
    required: true,
    default: 1,
  },
  maxPlayers: {
    type: Number,
    required: true,
    default: 5,
  },
  playerIds: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
});

// Create TTL index to auto-delete expired tables
PrivateTableSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPrivateTable>('PrivateTable', PrivateTableSchema);

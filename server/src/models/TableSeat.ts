import mongoose, { Schema, Document } from 'mongoose';

/**
 * OccupantType enum - Defines what type of entity occupies a seat
 */
export enum OccupantType {
  EMPTY = 'empty',
  HUMAN = 'human',
  BOT = 'bot'
}

/**
 * TableSeat interface - Represents a seat at a game table
 */
export interface TableSeat {
  seat_id: string;
  table_id: number;
  seat_index: number; // 0-5 for 6-player tables
  occupant_type: OccupantType;
  occupant_id: string | null; // user_id for human, bot_instance_id for bot
  occupant_name?: string; // cached name for quick display
  occupant_avatar?: string; // cached avatar URL
  updated_at: Date;
  updated_by: string; // admin_id or 'system'
  locked_until?: Date; // for optimistic locking during assignment
  lock_token?: string; // random token for lock ownership
  version: number; // for optimistic concurrency control
}

/**
 * TableSeat document interface for Mongoose
 */
export interface TableSeatDocument extends TableSeat, Document {}

/**
 * TableSeat Schema
 */
const TableSeatSchema = new Schema<TableSeatDocument>({
  seat_id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  table_id: {
    type: Number,
    required: true,
    index: true
  },
  seat_index: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Seat index must be an integer between 0 and 5'
    }
  },
  occupant_type: {
    type: String,
    enum: Object.values(OccupantType),
    default: OccupantType.EMPTY,
    required: true,
    index: true
  },
  occupant_id: {
    type: String,
    default: null,
    index: true,
    sparse: true // allows null values to not be indexed
  },
  occupant_name: {
    type: String,
    default: null
  },
  occupant_avatar: {
    type: String,
    default: null
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  updated_by: {
    type: String,
    required: true,
    default: 'system'
  },
  locked_until: {
    type: Date,
    default: null
  },
  lock_token: {
    type: String,
    default: null
  },
  version: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: false, // We manage updated_at manually
  collection: 'table_seats'
});

// Compound index for efficient table+seat lookups
TableSeatSchema.index({ table_id: 1, seat_index: 1 }, { unique: true });

// Index for finding occupied seats
TableSeatSchema.index({ table_id: 1, occupant_type: 1 });

// Index for cleanup of expired locks
TableSeatSchema.index({ locked_until: 1 }, { sparse: true });

/**
 * Pre-save middleware to update version for optimistic locking
 */
TableSeatSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version += 1;
    this.updated_at = new Date();
  }
  next();
});

/**
 * Method to check if seat is locked
 */
TableSeatSchema.methods.isLocked = function(): boolean {
  if (!this.locked_until) return false;
  return this.locked_until > new Date();
};

/**
 * Method to acquire lock on seat
 */
TableSeatSchema.methods.acquireLock = function(adminId: string, durationMs: number = 30000): string {
  const lockToken = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.locked_until = new Date(Date.now() + durationMs);
  this.lock_token = lockToken;
  this.updated_by = adminId;
  return lockToken;
};

/**
 * Method to release lock
 */
TableSeatSchema.methods.releaseLock = function(lockToken?: string): boolean {
  if (lockToken && this.lock_token !== lockToken) {
    return false; // Wrong token, lock not released
  }
  this.locked_until = null;
  this.lock_token = null;
  return true;
};

/**
 * Static method to initialize seats for a table
 */
TableSeatSchema.statics.initializeTableSeats = async function(tableId: number, seatCount: number = 6): Promise<TableSeatDocument[]> {
  const seats: TableSeatDocument[] = [];
  
  for (let i = 0; i < seatCount; i++) {
    const seat = new this({
      table_id: tableId,
      seat_index: i,
      occupant_type: OccupantType.EMPTY,
      updated_by: 'system'
    });
    await seat.save();
    seats.push(seat);
  }
  
  return seats;
};

/**
 * Static method to cleanup expired locks
 */
TableSeatSchema.statics.cleanupExpiredLocks = async function(): Promise<number> {
  const result = await this.updateMany(
    {
      locked_until: { $lt: new Date() }
    },
    {
      $set: {
        locked_until: null,
        lock_token: null
      }
    }
  );
  return result.modifiedCount;
};

export const TableSeatModel = mongoose.model<TableSeatDocument>('TableSeat', TableSeatSchema);

/**
 * Input type for creating a table seat
 */
export interface CreateTableSeatInput {
  table_id: number;
  seat_index: number;
  occupant_type?: OccupantType;
  occupant_id?: string | null;
  occupant_name?: string;
  occupant_avatar?: string;
  updated_by?: string;
}

/**
 * Input type for updating a table seat
 */
export interface UpdateTableSeatInput {
  occupant_type?: OccupantType;
  occupant_id?: string | null;
  occupant_name?: string;
  occupant_avatar?: string;
  updated_by?: string;
}

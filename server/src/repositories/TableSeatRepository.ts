import { 
  TableSeatModel, 
  TableSeat, 
  TableSeatDocument,
  CreateTableSeatInput,
  UpdateTableSeatInput,
  OccupantType 
} from '../models/TableSeat';
import mongoose from 'mongoose';

/**
 * TableSeatRepository - Handles all table seat database operations
 */
export class TableSeatRepository {
  /**
   * Create a new table seat
   */
  async create(input: CreateTableSeatInput): Promise<TableSeat> {
    const seat = new TableSeatModel({
      seat_id: new mongoose.Types.ObjectId().toString(),
      table_id: input.table_id,
      seat_index: input.seat_index,
      occupant_type: input.occupant_type || OccupantType.EMPTY,
      occupant_id: input.occupant_id || null,
      occupant_name: input.occupant_name,
      occupant_avatar: input.occupant_avatar,
      updated_by: input.updated_by || 'system',
      version: 0
    });

    const saved = await seat.save();
    return this.mapToModel(saved);
  }

  /**
   * Find seat by table and index
   */
  async findByTableAndSeat(tableId: number, seatIndex: number): Promise<TableSeat | null> {
    const seat = await TableSeatModel.findOne({ table_id: tableId, seat_index: seatIndex });
    return seat ? this.mapToModel(seat) : null;
  }

  /**
   * Find all seats for a table
   */
  async findAllByTableId(tableId: number): Promise<TableSeat[]> {
    const seats = await TableSeatModel.find({ table_id: tableId }).sort({ seat_index: 1 });
    return seats.map((seat: TableSeatDocument) => this.mapToModel(seat));
  }

  /**
   * Find occupied seats at a table
   */
  async findOccupiedSeatsByTableId(tableId: number): Promise<TableSeat[]> {
    const seats = await TableSeatModel.find({ 
      table_id: tableId, 
      occupant_type: { $ne: OccupantType.EMPTY } 
    }).sort({ seat_index: 1 });
    return seats.map((seat: TableSeatDocument) => this.mapToModel(seat));
  }

  /**
   * Find seat by occupant ID
   */
  async findByOccupantId(occupantId: string): Promise<TableSeat | null> {
    const seat = await TableSeatModel.findOne({ occupant_id: occupantId });
    return seat ? this.mapToModel(seat) : null;
  }

  /**
   * Initialize seats for a new table
   */
  async initializeTableSeats(tableId: number, seatCount: number = 6): Promise<TableSeat[]> {
    // Check if seats already exist
    const existingSeats = await TableSeatModel.find({ table_id: tableId });
    if (existingSeats.length > 0) {
      throw new Error(`Seats already initialized for table ${tableId}`);
    }

    const seats: TableSeat[] = [];
    for (let i = 0; i < seatCount; i++) {
      const seat = await this.create({
        table_id: tableId,
        seat_index: i,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });
      seats.push(seat);
    }

    return seats;
  }

  /**
   * Assign occupant to seat with optimistic locking
   * Returns null if version conflict occurs (seat was modified by another operation)
   */
  async assignSeat(
    tableId: number,
    seatIndex: number,
    occupantType: OccupantType,
    occupantId: string,
    occupantName: string,
    occupantAvatar: string,
    adminId: string,
    expectedVersion?: number
  ): Promise<TableSeat | null> {
    const query: any = {
      table_id: tableId,
      seat_index: seatIndex
    };

    // Add version check for optimistic locking
    if (expectedVersion !== undefined) {
      query.version = expectedVersion;
    }

    const updated = await TableSeatModel.findOneAndUpdate(
      query,
      {
        $set: {
          occupant_type: occupantType,
          occupant_id: occupantId,
          occupant_name: occupantName,
          occupant_avatar: occupantAvatar,
          updated_by: adminId,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    return updated ? this.mapToModel(updated) : null;
  }

  /**
   * Clear seat (set to empty)
   */
  async clearSeat(tableId: number, seatIndex: number, adminId: string): Promise<TableSeat | null> {
    const updated = await TableSeatModel.findOneAndUpdate(
      { table_id: tableId, seat_index: seatIndex },
      {
        $set: {
          occupant_type: OccupantType.EMPTY,
          occupant_id: null,
          occupant_name: null,
          occupant_avatar: null,
          updated_by: adminId,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    return updated ? this.mapToModel(updated) : null;
  }

  /**
   * Acquire lock on seat for safe assignment
   */
  async acquireSeatLock(
    tableId: number,
    seatIndex: number,
    adminId: string,
    durationMs: number = 30000
  ): Promise<{ seat: TableSeat; lockToken: string } | null> {
    const seat = await TableSeatModel.findOne({ table_id: tableId, seat_index: seatIndex });
    
    if (!seat) return null;

    // Check if already locked
    if (seat.locked_until && seat.locked_until > new Date()) {
      return null; // Seat is locked by another admin
    }

    const lockToken = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updated = await TableSeatModel.findOneAndUpdate(
      {
        table_id: tableId,
        seat_index: seatIndex,
        $or: [
          { locked_until: null },
          { locked_until: { $lt: new Date() } }
        ]
      },
      {
        $set: {
          locked_until: new Date(Date.now() + durationMs),
          lock_token: lockToken,
          updated_by: adminId
        }
      },
      { new: true }
    );

    if (!updated) return null;

    return {
      seat: this.mapToModel(updated),
      lockToken
    };
  }

  /**
   * Release lock on seat
   */
  async releaseSeatLock(
    tableId: number,
    seatIndex: number,
    lockToken: string
  ): Promise<boolean> {
    const result = await TableSeatModel.updateOne(
      {
        table_id: tableId,
        seat_index: seatIndex,
        lock_token: lockToken
      },
      {
        $set: {
          locked_until: null,
          lock_token: null
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Cleanup expired locks across all seats
   */
  async cleanupExpiredLocks(): Promise<number> {
    const result = await TableSeatModel.updateMany(
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
  }

  /**
   * Update seat information
   */
  async update(
    tableId: number,
    seatIndex: number,
    input: UpdateTableSeatInput
  ): Promise<TableSeat | null> {
    const updateFields: any = { updated_at: new Date() };

    if (input.occupant_type !== undefined) updateFields.occupant_type = input.occupant_type;
    if (input.occupant_id !== undefined) updateFields.occupant_id = input.occupant_id;
    if (input.occupant_name !== undefined) updateFields.occupant_name = input.occupant_name;
    if (input.occupant_avatar !== undefined) updateFields.occupant_avatar = input.occupant_avatar;
    if (input.updated_by !== undefined) updateFields.updated_by = input.updated_by;

    const updated = await TableSeatModel.findOneAndUpdate(
      { table_id: tableId, seat_index: seatIndex },
      {
        $set: updateFields,
        $inc: { version: 1 }
      },
      { new: true }
    );

    return updated ? this.mapToModel(updated) : null;
  }

  /**
   * Delete all seats for a table
   */
  async deleteByTableId(tableId: number): Promise<number> {
    const result = await TableSeatModel.deleteMany({ table_id: tableId });
    return result.deletedCount;
  }

  /**
   * Get seat statistics
   */
  async getTableStats(tableId?: number): Promise<any> {
    const match: any = tableId ? { table_id: tableId } : {};

    const stats = await TableSeatModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$occupant_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const result: any = {
      empty: 0,
      human: 0,
      bot: 0,
      total: 0
    };

    stats.forEach((stat: any) => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    return result;
  }

  /**
   * Validate seat availability
   */
  async isSeatAvailable(tableId: number, seatIndex: number): Promise<boolean> {
    const seat = await TableSeatModel.findOne({ table_id: tableId, seat_index: seatIndex });
    if (!seat) return false;
    
    // Check if empty and not locked
    return seat.occupant_type === OccupantType.EMPTY && 
           (!seat.locked_until || seat.locked_until < new Date());
  }

  /**
   * Check if seat exists
   */
  async exists(tableId: number, seatIndex: number): Promise<boolean> {
    const count = await TableSeatModel.countDocuments({ table_id: tableId, seat_index: seatIndex });
    return count > 0;
  }

  /**
   * Map database document to model
   */
  private mapToModel(doc: TableSeatDocument): TableSeat {
    return {
      seat_id: doc.seat_id,
      table_id: doc.table_id,
      seat_index: doc.seat_index,
      occupant_type: doc.occupant_type,
      occupant_id: doc.occupant_id,
      occupant_name: doc.occupant_name,
      occupant_avatar: doc.occupant_avatar,
      updated_at: doc.updated_at,
      updated_by: doc.updated_by,
      locked_until: doc.locked_until,
      lock_token: doc.lock_token,
      version: doc.version
    };
  }
}

// Export singleton instance
export default new TableSeatRepository();

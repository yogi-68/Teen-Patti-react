import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import TableSeatRepository from '../repositories/TableSeatRepository';
import { OccupantType } from '../models/TableSeat';

describe('TableSeatRepository', () => {
  const repo = TableSeatRepository;
  
  beforeEach(async () => {
    // Clean up test data
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  describe('create', () => {
    it('should create a new table seat', async () => {
      const seat = await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'test-admin'
      });

      expect(seat).toBeDefined();
      expect(seat.seat_id).toBeTruthy();
      expect(seat.table_id).toBe(1);
      expect(seat.seat_index).toBe(0);
      expect(seat.occupant_type).toBe(OccupantType.EMPTY);
      expect(seat.version).toBe(0);
    });

    it('should create seat with occupant', async () => {
      const seat = await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.HUMAN,
        occupant_id: 'user-123',
        occupant_name: 'John Doe',
        updated_by: 'test-admin'
      });

      expect(seat.occupant_type).toBe(OccupantType.HUMAN);
      expect(seat.occupant_id).toBe('user-123');
      expect(seat.occupant_name).toBe('John Doe');
    });
  });

  describe('findByTableAndSeat', () => {
    it('should find seat by table and index', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 2,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const found = await repo.findByTableAndSeat(1, 2);
      
      expect(found).toBeDefined();
      expect(found?.table_id).toBe(1);
      expect(found?.seat_index).toBe(2);
    });

    it('should return null for non-existent seat', async () => {
      const found = await repo.findByTableAndSeat(999, 5);
      expect(found).toBeNull();
    });
  });

  describe('initializeTableSeats', () => {
    it('should create 6 seats for new table', async () => {
      const seats = await repo.initializeTableSeats(1, 6);

      expect(seats).toHaveLength(6);
      seats.forEach((seat, index) => {
        expect(seat.table_id).toBe(1);
        expect(seat.seat_index).toBe(index);
        expect(seat.occupant_type).toBe(OccupantType.EMPTY);
      });
    });

    it('should throw error if seats already exist', async () => {
      await repo.initializeTableSeats(1, 6);

      await expect(
        repo.initializeTableSeats(1, 6)
      ).rejects.toThrow('Seats already initialized');
    });
  });

  describe('assignSeat', () => {
    it('should assign occupant to seat', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const assigned = await repo.assignSeat(
        1,
        0,
        OccupantType.BOT,
        'bot-123',
        'Bot Player',
        '/avatar.png',
        'admin-1'
      );

      expect(assigned).toBeDefined();
      expect(assigned?.occupant_type).toBe(OccupantType.BOT);
      expect(assigned?.occupant_id).toBe('bot-123');
      expect(assigned?.occupant_name).toBe('Bot Player');
      expect(assigned?.version).toBe(1);
    });

    it('should support optimistic locking', async () => {
      const seat = await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      // Assign with correct version
      const assigned = await repo.assignSeat(
        1,
        0,
        OccupantType.BOT,
        'bot-123',
        'Bot1',
        '/avatar.png',
        'admin-1',
        seat.version
      );

      expect(assigned).toBeDefined();

      // Try to assign with old version (should fail)
      const failedAssign = await repo.assignSeat(
        1,
        0,
        OccupantType.BOT,
        'bot-456',
        'Bot2',
        '/avatar2.png',
        'admin-2',
        seat.version // Old version
      );

      expect(failedAssign).toBeNull();
    });
  });

  describe('clearSeat', () => {
    it('should clear seat occupant', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.BOT,
        occupant_id: 'bot-123',
        updated_by: 'system'
      });

      const cleared = await repo.clearSeat(1, 0, 'admin-1');

      expect(cleared).toBeDefined();
      expect(cleared?.occupant_type).toBe(OccupantType.EMPTY);
      expect(cleared?.occupant_id).toBeNull();
    });
  });

  describe('acquireSeatLock', () => {
    it('should acquire lock on seat', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const result = await repo.acquireSeatLock(1, 0, 'admin-1', 5000);

      expect(result).toBeDefined();
      expect(result?.lockToken).toBeTruthy();
      expect(result?.seat.locked_until).toBeDefined();
    });

    it('should fail to acquire lock if already locked', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      // First admin acquires lock
      const lock1 = await repo.acquireSeatLock(1, 0, 'admin-1', 60000);
      expect(lock1).toBeDefined();

      // Second admin tries to acquire same lock
      const lock2 = await repo.acquireSeatLock(1, 0, 'admin-2', 60000);
      expect(lock2).toBeNull();
    });
  });

  describe('releaseSeatLock', () => {
    it('should release lock with correct token', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const lockResult = await repo.acquireSeatLock(1, 0, 'admin-1', 5000);
      expect(lockResult).toBeDefined();

      const released = await repo.releaseSeatLock(1, 0, lockResult!.lockToken);
      expect(released).toBe(true);
    });

    it('should fail to release with wrong token', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      await repo.acquireSeatLock(1, 0, 'admin-1', 5000);

      const released = await repo.releaseSeatLock(1, 0, 'wrong-token');
      expect(released).toBe(false);
    });
  });

  describe('cleanupExpiredLocks', () => {
    it('should clean up expired locks', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      // Acquire lock with very short duration (already expired)
      await repo.acquireSeatLock(1, 0, 'admin-1', -1000);

      const cleaned = await repo.cleanupExpiredLocks();
      expect(cleaned).toBeGreaterThan(0);

      // Verify seat is unlocked
      const seat = await repo.findByTableAndSeat(1, 0);
      expect(seat?.locked_until).toBeNull();
    });
  });

  describe('isSeatAvailable', () => {
    it('should return true for empty unlocked seat', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const available = await repo.isSeatAvailable(1, 0);
      expect(available).toBe(true);
    });

    it('should return false for occupied seat', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.BOT,
        occupant_id: 'bot-123',
        updated_by: 'system'
      });

      const available = await repo.isSeatAvailable(1, 0);
      expect(available).toBe(false);
    });

    it('should return false for locked seat', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      await repo.acquireSeatLock(1, 0, 'admin-1', 60000);

      const available = await repo.isSeatAvailable(1, 0);
      expect(available).toBe(false);
    });
  });

  describe('getTableStats', () => {
    it('should calculate seat statistics', async () => {
      await repo.initializeTableSeats(1, 6);
      
      // Assign some bots and humans
      await repo.assignSeat(1, 0, OccupantType.BOT, 'bot-1', 'Bot1', '/av.png', 'admin');
      await repo.assignSeat(1, 1, OccupantType.BOT, 'bot-2', 'Bot2', '/av.png', 'admin');
      await repo.assignSeat(1, 2, OccupantType.HUMAN, 'user-1', 'Player1', '/av.png', 'admin');

      const stats = await repo.getTableStats(1);

      expect(stats.total).toBe(6);
      expect(stats.bot).toBe(2);
      expect(stats.human).toBe(1);
      expect(stats.empty).toBe(3);
    });
  });

  describe('findAllByTableId', () => {
    it('should return all seats for table', async () => {
      await repo.initializeTableSeats(1, 6);

      const seats = await repo.findAllByTableId(1);

      expect(seats).toHaveLength(6);
      expect(seats[0].seat_index).toBe(0);
      expect(seats[5].seat_index).toBe(5);
    });

    it('should return empty array for non-existent table', async () => {
      const seats = await repo.findAllByTableId(999);
      expect(seats).toHaveLength(0);
    });
  });

  describe('findOccupiedSeatsByTableId', () => {
    it('should return only occupied seats', async () => {
      await repo.initializeTableSeats(1, 6);
      
      await repo.assignSeat(1, 0, OccupantType.BOT, 'bot-1', 'Bot1', '/av.png', 'admin');
      await repo.assignSeat(1, 2, OccupantType.HUMAN, 'user-1', 'Player1', '/av.png', 'admin');

      const occupied = await repo.findOccupiedSeatsByTableId(1);

      expect(occupied).toHaveLength(2);
      expect(occupied.every(s => s.occupant_type !== OccupantType.EMPTY)).toBe(true);
    });
  });

  describe('deleteByTableId', () => {
    it('should delete all seats for table', async () => {
      await repo.initializeTableSeats(1, 6);

      const deleted = await repo.deleteByTableId(1);
      expect(deleted).toBe(6);

      const seats = await repo.findAllByTableId(1);
      expect(seats).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('should return true if seat exists', async () => {
      await repo.create({
        table_id: 1,
        seat_index: 0,
        occupant_type: OccupantType.EMPTY,
        updated_by: 'system'
      });

      const exists = await repo.exists(1, 0);
      expect(exists).toBe(true);
    });

    it('should return false if seat does not exist', async () => {
      const exists = await repo.exists(999, 5);
      expect(exists).toBe(false);
    });
  });
});

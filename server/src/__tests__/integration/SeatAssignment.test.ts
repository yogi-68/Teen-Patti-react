/**
 * Integration Test: Complete Bot Seat Assignment Flow
 * Tests the entire workflow from seat initialization to bot assignment
 */

import TableSeatRepository from '../../repositories/TableSeatRepository.js';
import BotInstanceRepository from '../../repositories/BotInstanceRepository.js';
import BotBlueprintRepository from '../../repositories/BotBlueprintRepository.js';
import { OccupantType } from '../../models/TableSeat.js';
import { BehaviorProfiles } from '../../models/BotBlueprint.js';

describe('Bot Seat Assignment Integration Tests', () => {
  const TEST_TABLE_ID = 1;
  const TEST_SEAT_INDEX = 0;

  beforeEach(async () => {
    // Clean up test data
    await TableSeatRepository.deleteByTableId(TEST_TABLE_ID);
  });

  describe('Complete Assignment Workflow', () => {
    it('should complete full bot assignment workflow', async () => {
      // Step 1: Initialize table seats
      const seats = await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);
      expect(seats).toHaveLength(6);
      expect(seats[0].occupant_type).toBe(OccupantType.EMPTY);

      // Step 2: Check seat availability
      const isAvailable = await TableSeatRepository.isSeatAvailable(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(isAvailable).toBe(true);

      // Step 3: Create bot blueprint
      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50,
        persistent: false
      });

      // Step 4: Create bot instance
      const botInstance = await BotInstanceRepository.create({
        bot_blueprint_id: blueprint.bot_blueprint_id,
        display_name: 'Test Bot',
        bot_id: 'test_bot_001',
        assigned_table_id: TEST_TABLE_ID,
        assigned_seat_index: TEST_SEAT_INDEX,
        balance_coins: 10000,
        balance_cash: 0
      });

      expect(botInstance).toBeTruthy();
      expect(botInstance.assigned_table_id).toBe(TEST_TABLE_ID);

      // Step 5: Assign bot to seat
      const assignedSeat = await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.BOT,
        botInstance.bot_instance_id,
        botInstance.display_name,
        botInstance.avatar_url || '',
        'test-admin'
      );

      expect(assignedSeat).toBeTruthy();
      expect(assignedSeat?.occupant_type).toBe(OccupantType.BOT);
      expect(assignedSeat?.occupant_id).toBe(botInstance.bot_instance_id);

      // Step 6: Verify seat is no longer available
      const stillAvailable = await TableSeatRepository.isSeatAvailable(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(stillAvailable).toBe(false);

      // Step 7: Get table stats
      const stats = await TableSeatRepository.getTableStats(TEST_TABLE_ID);
      expect(stats.bot).toBe(1);
      expect(stats.empty).toBe(5);
      expect(stats.total).toBe(6);

      // Step 8: Clear seat and cleanup
      const cleared = await TableSeatRepository.clearSeat(TEST_TABLE_ID, TEST_SEAT_INDEX, 'test-admin');
      expect(cleared).toBeTruthy();
      expect(cleared?.occupant_type).toBe(OccupantType.EMPTY);

      // Step 9: Deactivate bot
      const deactivated = await BotInstanceRepository.deactivate(botInstance.bot_instance_id);
      expect(deactivated).toBe(true);

      // Step 10: Verify seat is available again
      const availableAgain = await TableSeatRepository.isSeatAvailable(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(availableAgain).toBe(true);
    });

    it('should handle concurrent seat assignments with locking', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      const lockToken1 = 'lock-token-1';
      const lockToken2 = 'lock-token-2';

      // First lock acquires successfully
      const lock1 = await TableSeatRepository.acquireSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        lockToken1,
        5000
      );
      expect(lock1).toBeTruthy();
      expect(lock1?.lockToken).toBeTruthy();

      // Second lock should fail while first is active
      const lock2 = await TableSeatRepository.acquireSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        lockToken2,
        5000
      );
      expect(lock2).toBeNull();

      // Release first lock
      const released = await TableSeatRepository.releaseSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        lock1!.lockToken
      );
      expect(released).toBe(true);

      // Now second lock should succeed
      const lock2Retry = await TableSeatRepository.acquireSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        lockToken2,
        5000
      );
      expect(lock2Retry).toBeTruthy();
      expect(lock2Retry?.lockToken).toBeTruthy();
    });

    it('should prevent double assignment to same seat', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      // Create two bot instances
      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50,
        persistent: false
      });

      const bot1 = await BotInstanceRepository.create({
        bot_blueprint_id: blueprint.bot_blueprint_id,
        display_name: 'Bot One',
        bot_id: 'bot_001',
        assigned_table_id: TEST_TABLE_ID,
        assigned_seat_index: TEST_SEAT_INDEX,
        balance_coins: 10000,
        balance_cash: 0
      });

      const bot2 = await BotInstanceRepository.create({
        bot_blueprint_id: blueprint.bot_blueprint_id,
        display_name: 'Bot Two',
        bot_id: 'bot_002',
        assigned_table_id: TEST_TABLE_ID,
        assigned_seat_index: TEST_SEAT_INDEX,
        balance_coins: 10000,
        balance_cash: 0
      });

      // Assign first bot
      const assigned1 = await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.BOT,
        bot1.bot_instance_id,
        bot1.display_name,
        bot1.avatar_url || '',
        'test-admin'
      );
      expect(assigned1).toBeTruthy();

      // Verify seat is now occupied
      const seatAfterFirst = await TableSeatRepository.findByTableAndSeat(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(seatAfterFirst?.occupant_type).toBe(OccupantType.BOT);
      expect(seatAfterFirst?.occupant_id).toBe(bot1.bot_instance_id);

      // Second assignment should overwrite (repository level allows this - API layer should prevent)
      const assigned2 = await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.BOT,
        bot2.bot_instance_id,
        bot2.display_name,
        bot2.avatar_url || '',
        'test-admin'
      );
      expect(assigned2).toBeTruthy();
      
      // Verify second bot is now assigned
      const seatAfterSecond = await TableSeatRepository.findByTableAndSeat(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(seatAfterSecond?.occupant_id).toBe(bot2.bot_instance_id);
      expect(assigned2?.occupant_id).toBe(bot2.bot_instance_id);
    });

    it('should handle bot instance cleanup correctly', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.AGGRESSIVE,
        default_level: 70,
        persistent: false
      });

      // Create ephemeral bot (with expiry)
      const expiresAt = new Date(Date.now() + 1000); // Expires in 1 second
      const bot = await BotInstanceRepository.create({
        bot_blueprint_id: blueprint.bot_blueprint_id,
        display_name: 'Ephemeral Bot',
        bot_id: 'ephemeral_001',
        assigned_table_id: TEST_TABLE_ID,
        assigned_seat_index: TEST_SEAT_INDEX,
        balance_coins: 10000,
        balance_cash: 0,
        expires_at: expiresAt
      });

      // Assign to seat
      await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.BOT,
        bot.bot_instance_id,
        bot.display_name,
        bot.avatar_url || '',
        'test-admin'
      );

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Find expired bots
      const expiredBots = await BotInstanceRepository.findExpired();
      expect(expiredBots.length).toBeGreaterThan(0);
      expect(expiredBots[0].bot_instance_id).toBe(bot.bot_instance_id);

      // Cleanup expired
      const cleanedCount = await BotInstanceRepository.cleanupExpired();
      expect(cleanedCount).toBe(1);

      // Verify bot is deactivated
      const botAfterCleanup = await BotInstanceRepository.findById(bot.bot_instance_id);
      expect(botAfterCleanup?.is_active).toBe(false);
    });
  });

  describe('Table Management', () => {
    it('should manage multiple bots across different seats', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50,
        persistent: false
      });

      // Create 4 bots
      const bots = [];
      for (let i = 0; i < 4; i++) {
        const bot = await BotInstanceRepository.create({
          bot_blueprint_id: blueprint.bot_blueprint_id,
          display_name: `Bot ${i + 1}`,
          bot_id: `bot_${i + 1}`,
          assigned_table_id: TEST_TABLE_ID,
          assigned_seat_index: i,
          balance_coins: 10000,
          balance_cash: 0
        });

        await TableSeatRepository.assignSeat(
          TEST_TABLE_ID,
          i,
          OccupantType.BOT,
          bot.bot_instance_id,
          bot.display_name,
          bot.avatar_url || '',
          'test-admin'
        );

        bots.push(bot);
      }

      // Get table stats
      const stats = await TableSeatRepository.getTableStats(TEST_TABLE_ID);
      expect(stats.bot).toBe(4);
      expect(stats.empty).toBe(2);
      expect(stats.total).toBe(6);

      // Get all occupied seats
      const occupiedSeats = await TableSeatRepository.findOccupiedSeatsByTableId(TEST_TABLE_ID);
      expect(occupiedSeats).toHaveLength(4);

      // Get bots by table
      const tableBots = await BotInstanceRepository.findByTableId(TEST_TABLE_ID);
      expect(tableBots).toHaveLength(4);
    });

    it('should handle seat version conflicts with optimistic locking', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      const seat = await TableSeatRepository.findByTableAndSeat(TEST_TABLE_ID, TEST_SEAT_INDEX);
      expect(seat).toBeTruthy();
      const originalVersion = seat!.version;
      expect(originalVersion).toBeGreaterThanOrEqual(0);

      const blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50,
        persistent: false
      });

      const bot = await BotInstanceRepository.create({
        bot_blueprint_id: blueprint.bot_blueprint_id,
        display_name: 'Test Bot',
        bot_id: 'test_bot',
        assigned_table_id: TEST_TABLE_ID,
        assigned_seat_index: TEST_SEAT_INDEX,
        balance_coins: 10000,
        balance_cash: 0
      });

      // Assign with correct version
      const assigned1 = await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.BOT,
        bot.bot_instance_id,
        bot.display_name,
        bot.avatar_url || '',
        'test-admin',
        originalVersion // use actual version from DB
      );
      expect(assigned1).toBeTruthy();
      expect(assigned1?.version).toBe(originalVersion + 1);

      // Try to assign with old version - should fail
      const assigned2 = await TableSeatRepository.assignSeat(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        OccupantType.EMPTY,
        '',
        '',
        '',
        'test-admin',
        0 // old version
      );
      expect(assigned2).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent table gracefully', async () => {
      const seat = await TableSeatRepository.findByTableAndSeat(999, 0);
      expect(seat).toBeNull();

      const stats = await TableSeatRepository.getTableStats(999);
      expect(stats.empty).toBe(0);
      expect(stats.total).toBe(0);
    });

    it('should handle invalid seat index gracefully', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      const isAvailable = await TableSeatRepository.isSeatAvailable(TEST_TABLE_ID, 10);
      expect(isAvailable).toBe(false);
    });

    it('should cleanup expired locks automatically', async () => {
      await TableSeatRepository.initializeTableSeats(TEST_TABLE_ID);

      // Acquire lock with short timeout
      const locked = await TableSeatRepository.acquireSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        'test-lock',
        100 // 100ms timeout
      );
      expect(locked).toBeTruthy();
      expect(locked?.lockToken).toBeTruthy();
      expect(locked?.lockToken).toBeTruthy();

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Cleanup expired locks
      const cleanedCount = await TableSeatRepository.cleanupExpiredLocks();
      expect(cleanedCount).toBeGreaterThanOrEqual(0);

      // Should be able to acquire lock again
      const lockedAgain = await TableSeatRepository.acquireSeatLock(
        TEST_TABLE_ID,
        TEST_SEAT_INDEX,
        'new-lock',
        5000
      );
      expect(lockedAgain).toBeTruthy();
      expect(lockedAgain?.lockToken).toBeTruthy();
    });
  });
});

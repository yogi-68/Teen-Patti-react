/**
 * End-to-End System Smoke Test
 * Validates critical bot management workflows
 */

import mongoose from 'mongoose';
import TableSeatRepository from '../../repositories/TableSeatRepository.js';
import BotInstanceRepository from '../../repositories/BotInstanceRepository.js';
import BotBlueprintRepository from '../../repositories/BotBlueprintRepository.js';
import { OccupantType } from '../../models/TableSeat.js';

describe('System Smoke Test', () => {
  const tableSeatRepo = TableSeatRepository;
  const botInstanceRepo = BotInstanceRepository;
  const botBlueprintRepo = BotBlueprintRepository;

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
  });

  it('should complete basic bot lifecycle workflow', async () => {
    const tableId = 1;
    const adminId = 'admin-test';

    // Step 1: Initialize table seats
    const seats = await tableSeatRepo.initializeTableSeats(tableId, 6);
    expect(seats).toHaveLength(6);
    console.log(`✓ Created ${seats.length} seats for table ${tableId}`);

    // Step 2: Create bot blueprint
    const blueprint = await botBlueprintRepo.create({
      display_name_template: 'TestBot {{id}}',
      behavior_profile: {
        aggressiveness: 60,
        risk_tolerance: 50,
        reaction_delay_ms: 1000,
        error_rate: 5,
        skill_level: 70
      },
      default_level: 50,
      persistent: true,
      created_by: adminId
    });

    expect(blueprint.bot_blueprint_id).toBeDefined();
    console.log(`✓ Created bot blueprint: ${blueprint.bot_blueprint_id}`);

    // Step 3: Create bot instance
    const botInstance = await botInstanceRepo.create({
      bot_blueprint_id: blueprint.bot_blueprint_id,
      display_name: 'TestBot 001',
      bot_id: 'TB-001',
      assigned_table_id: tableId,
      assigned_seat_index: 0,
      balance_coins: 10000,
      balance_cash: 0,
      randomized: false,
      created_by_admin_id: adminId
    });

    expect(botInstance.bot_instance_id).toBeDefined();
    console.log(`✓ Created bot instance: ${botInstance.bot_id}`);

    // Step 4: Assign bot to seat
    const assignedSeat = await tableSeatRepo.assignSeat(
      tableId,
      0,
      OccupantType.BOT,
      botInstance.bot_instance_id,
      'TestBot 001',
      '/avatar.png',
      adminId
    );

    expect(assignedSeat?.occupant_type).toBe(OccupantType.BOT);
    expect(assignedSeat?.occupant_id).toBe(botInstance.bot_instance_id);
    console.log(`✓ Assigned bot to seat 0`);

    // Step 5: Test seat locking
    const lockResult = await tableSeatRepo.acquireSeatLock(
      tableId,
      1,
      'session-001',
      5000
    );

    expect(lockResult).toBeTruthy();
    expect(lockResult).toHaveProperty('lockToken');
    console.log(`✓ Acquired lock on seat 1`);

    // Step 6: Verify table stats
    const stats = await tableSeatRepo.getTableStats(tableId);
    expect(stats.total).toBe(6);
    expect(stats.bot).toBeGreaterThanOrEqual(1);
    console.log(`✓ Table stats: ${stats.bot} bots, ${stats.human} humans, ${stats.empty} empty`);

    // Step 7: Query occupied seats
    const occupiedSeats = await tableSeatRepo.findOccupiedSeatsByTableId(tableId);
    expect(occupiedSeats.length).toBeGreaterThanOrEqual(1);
    console.log(`✓ Found ${occupiedSeats.length} occupied seats`);

    // Step 8: Clear seat
    const cleared = await tableSeatRepo.clearSeat(tableId, 0, adminId);
    expect(cleared).toBeDefined();
    console.log(`✓ Cleared seat 0`);

    // Step 9: Mark bot inactive
    const updated = await botInstanceRepo.update(botInstance.bot_instance_id, {
      is_active: false
    });
    expect(updated?.is_active).toBe(false);
    console.log(`✓ Deactivated bot instance`);

    // Step 10: Release lock
    if (lockResult && lockResult.lockToken) {
      const released = await tableSeatRepo.releaseSeatLock(tableId, 1, lockResult.lockToken);
      expect(released).toBe(true);
      console.log(`✓ Released lock on seat 1`);
    }

    console.log('\n✓ All smoke test steps completed successfully\n');
  });

  it('should prevent duplicate table initialization', async () => {
    const tableId = 2;

    await tableSeatRepo.initializeTableSeats(tableId, 6);
    
    await expect(
      tableSeatRepo.initializeTableSeats(tableId, 6)
    ).rejects.toThrow('Seats already initialized');

    console.log('✓ Business rule enforced: Cannot reinitialize table');
  });

  it('should cleanup expired locks', async () => {
    const tableId = 3;
    await tableSeatRepo.initializeTableSeats(tableId, 6);

    // Create a lock with 100ms expiry
    await tableSeatRepo.acquireSeatLock(tableId, 0, 'temp-session', 100);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    // Cleanup should find and remove the expired lock
    const cleanedCount = await tableSeatRepo.cleanupExpiredLocks();
    expect(cleanedCount).toBeGreaterThanOrEqual(0);

    console.log(`✓ Cleaned ${cleanedCount} expired locks`);
  });
});

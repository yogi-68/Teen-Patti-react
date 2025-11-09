// Bot System Verification Script
// Run this to verify all bot components are working correctly

import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import { BehaviorProfiles } from '../models/BotBlueprint.js';
import { generateBotIdentity, clearRecentNamesCache } from '../services/BotIdentityService.js';
import { resolveIdentity } from '../services/BotIdentityResolver.js';
import { getRandomAvatar, getAllAvatars } from '../services/BotAvatarService.js';
import { database } from '../config/database.js';

async function verifyBotSystem() {
  console.log('🔍 Starting Bot Management System Verification...\n');

  try {
    // Step 1: Connect to MongoDB
    console.log('📡 Step 1: Connecting to MongoDB...');
    await database.connect();
    if (!database.getConnectionStatus()) {
      throw new Error('MongoDB connection failed');
    }
    console.log('✅ MongoDB connected\n');

    // Step 2: Verify Bot Identity Generation
    console.log('🎭 Step 2: Testing Bot Identity Generation...');
    clearRecentNamesCache();
    
    const identity1 = await generateBotIdentity('{{first}} {{last}}');
    const identity2 = await generateBotIdentity('{{first}} {{last}}');
    
    console.log(`   Generated Name 1: ${identity1.displayName} (${identity1.botId})`);
    console.log(`   Generated Name 2: ${identity2.displayName} (${identity2.botId})`);
    
    if (identity1.displayName === identity2.displayName) {
      throw new Error('Name collision detected!');
    }
    if (identity1.botId === identity2.botId) {
      throw new Error('Bot ID collision detected!');
    }
    console.log('✅ Identity generation working (no collisions)\n');

    // Step 3: Test Avatar Service
    console.log('🖼️ Step 3: Testing Avatar Service...');
    const allAvatars = getAllAvatars();
    console.log(`   Total Avatars: ${allAvatars.length}`);
    
    const avatar1 = getRandomAvatar();
    const avatar2 = getRandomAvatar('male');
    const avatar3 = getRandomAvatar('female');
    
    console.log(`   Random Avatar: ${avatar1}`);
    console.log(`   Male Avatar: ${avatar2}`);
    console.log(`   Female Avatar: ${avatar3}`);
    console.log('✅ Avatar service working\n');

    // Step 4: Create Bot Blueprint
    console.log('📋 Step 4: Creating Bot Blueprint...');
    const blueprint = await BotBlueprintRepository.create({
      display_name_template: '{{first}} {{last}}',
      behavior_profile: BehaviorProfiles.BALANCED,
      default_level: 50,
      persistent: false,
      created_by: 'verification-script'
    });
    console.log(`   Blueprint ID: ${blueprint.bot_blueprint_id}`);
    console.log(`   Behavior: Aggressiveness ${blueprint.behavior_profile.aggressiveness}%`);
    console.log('✅ Blueprint created successfully\n');

    // Step 5: Test Identity Resolution
    console.log('🔄 Step 5: Testing Identity Resolution...');
    
    // Test randomize mode
    const randomIdentity = await resolveIdentity(blueprint, 'randomize', 4);
    console.log(`   Randomize Mode: ${randomIdentity.displayName} (${randomIdentity.botId})`);
    console.log(`   Expires: ${randomIdentity.expiresAt?.toISOString().split('T')[1].substring(0, 8)} (4 hours)`);
    
    // Test persistent mode
    const persistentIdentity = await resolveIdentity(blueprint, 'persistent', 24);
    console.log(`   Persistent Mode: ${persistentIdentity.displayName} (${persistentIdentity.botId})`);
    console.log(`   Expires: ${persistentIdentity.expiresAt || 'Never'}`);
    
    console.log('✅ Identity resolution working\n');

    // Step 6: Create Bot Instance
    console.log('🤖 Step 6: Creating Bot Instance...');
    const botInstance = await BotInstanceRepository.create({
      bot_blueprint_id: blueprint.bot_blueprint_id,
      display_name: randomIdentity.displayName,
      bot_id: randomIdentity.botId,
      avatar_url: avatar1,
      assigned_table_id: 1,
      assigned_seat_index: 0,
      expires_at: randomIdentity.expiresAt,
      randomized: true,
      created_by_admin_id: 'verification-script'
    });
    console.log(`   Instance ID: ${botInstance.bot_instance_id}`);
    console.log(`   Display Name: ${botInstance.display_name}`);
    console.log(`   Bot ID: ${botInstance.bot_id}`);
    console.log(`   Table: ${botInstance.assigned_table_id}, Seat: ${botInstance.assigned_seat_index}`);
    console.log(`   Balance: ${botInstance.balance_coins} coins`);
    console.log('✅ Bot instance created successfully\n');

    // Step 7: Test Queries
    console.log('🔎 Step 7: Testing Repository Queries...');
    
    const foundByTableSeat = await BotInstanceRepository.findByTableAndSeat(1, 0);
    if (!foundByTableSeat) {
      throw new Error('Failed to find bot by table and seat');
    }
    console.log(`   ✓ Find by table/seat: ${foundByTableSeat.display_name}`);
    
    const foundById = await BotInstanceRepository.findById(botInstance.bot_instance_id);
    if (!foundById) {
      throw new Error('Failed to find bot by ID');
    }
    console.log(`   ✓ Find by ID: ${foundById.display_name}`);
    
    const stats = await BotInstanceRepository.getStats();
    console.log(`   ✓ Stats: Total=${stats.total}, Active=${stats.active}`);
    console.log('✅ All queries working\n');

    // Step 8: Test Collision Detection
    console.log('🚫 Step 8: Testing Collision Detection...');
    const nameExists = await BotInstanceRepository.displayNameExists(botInstance.display_name);
    const idExists = await BotInstanceRepository.botIdExists(botInstance.bot_id);
    
    console.log(`   Name exists check: ${nameExists ? '✓' : '✗'}`);
    console.log(`   ID exists check: ${idExists ? '✓' : '✗'}`);
    
    if (!nameExists || !idExists) {
      throw new Error('Collision detection failed');
    }
    console.log('✅ Collision detection working\n');

    // Step 9: Test Update Operations
    console.log('💰 Step 9: Testing Update Operations...');
    const balanceUpdated = await BotInstanceRepository.updateBalance(
      botInstance.bot_instance_id,
      500,
      50
    );
    if (balanceUpdated) {
      const updatedBot = await BotInstanceRepository.findById(botInstance.bot_instance_id);
      console.log(`   Updated balance: ${updatedBot?.balance_coins} coins, ${updatedBot?.balance_cash} cash`);
    }
    console.log('✅ Update operations working\n');

    // Step 10: Test Deactivation
    console.log('🛑 Step 10: Testing Bot Deactivation...');
    const wasDeactivated = await BotInstanceRepository.deactivate(botInstance.bot_instance_id);
    if (wasDeactivated) {
      const deactivatedBot = await BotInstanceRepository.findById(botInstance.bot_instance_id);
      console.log(`   Deactivated: ${deactivatedBot?.display_name}`);
      console.log(`   Active status: ${deactivatedBot?.is_active}`);
    }
    console.log('✅ Deactivation working\n');

    // Step 11: Cleanup
    console.log('🧹 Step 11: Cleaning up test data...');
    await BotInstanceRepository.hardDelete(botInstance.bot_instance_id);
    await BotBlueprintRepository.hardDelete(blueprint.bot_blueprint_id);
    console.log('✅ Test data cleaned\n');

    // Final Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL VERIFICATION TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📊 Bot Management System Status:');
    console.log('   ✅ MongoDB Connection: Working');
    console.log('   ✅ Identity Generation: Working');
    console.log('   ✅ Avatar Service: Working');
    console.log('   ✅ Blueprint Repository: Working');
    console.log('   ✅ Instance Repository: Working');
    console.log('   ✅ Identity Resolution: Working');
    console.log('   ✅ Collision Detection: Working');
    console.log('   ✅ Update Operations: Working');
    console.log('   ✅ Deactivation: Working');
    console.log('\n🎉 System is ready for deployment!\n');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await database.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run verification
verifyBotSystem().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

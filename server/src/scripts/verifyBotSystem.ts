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

  try {
    // Step 1: Connect to MongoDB
    await database.connect();
    if (!database.getConnectionStatus()) {
      throw new Error('MongoDB connection failed');
    }

    // Step 2: Verify Bot Identity Generation
    clearRecentNamesCache();
    
    const identity1 = await generateBotIdentity('{{first}} {{last}}');
    const identity2 = await generateBotIdentity('{{first}} {{last}}');
    
    
    if (identity1.displayName === identity2.displayName) {
      throw new Error('Name collision detected!');
    }
    if (identity1.botId === identity2.botId) {
      throw new Error('Bot ID collision detected!');
    }

    // Step 3: Test Avatar Service
    const allAvatars = getAllAvatars();
    
    const avatar1 = getRandomAvatar();
    const avatar2 = getRandomAvatar('male');
    const avatar3 = getRandomAvatar('female');
    

    // Step 4: Create Bot Blueprint
    const blueprint = await BotBlueprintRepository.create({
      display_name_template: '{{first}} {{last}}',
      behavior_profile: BehaviorProfiles.BALANCED,
      default_level: 50,
      persistent: false,
      created_by: 'verification-script'
    });

    // Step 5: Test Identity Resolution
    
    // Test randomize mode
    const randomIdentity = await resolveIdentity(blueprint, 'randomize', 4);
    
    // Test persistent mode
    const persistentIdentity = await resolveIdentity(blueprint, 'persistent', 24);
    

    // Step 6: Create Bot Instance
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

    // Step 7: Test Queries
    
    const foundByTableSeat = await BotInstanceRepository.findByTableAndSeat(1, 0);
    if (!foundByTableSeat) {
      throw new Error('Failed to find bot by table and seat');
    }
    
    const foundById = await BotInstanceRepository.findById(botInstance.bot_instance_id);
    if (!foundById) {
      throw new Error('Failed to find bot by ID');
    }
    
    const stats = await BotInstanceRepository.getStats();

    // Step 8: Test Collision Detection
    const nameExists = await BotInstanceRepository.displayNameExists(botInstance.display_name);
    const idExists = await BotInstanceRepository.botIdExists(botInstance.bot_id);
    
    
    if (!nameExists || !idExists) {
      throw new Error('Collision detection failed');
    }

    // Step 9: Test Update Operations
    const balanceUpdated = await BotInstanceRepository.updateBalance(
      botInstance.bot_instance_id,
      500,
      50
    );
    if (balanceUpdated) {
      const updatedBot = await BotInstanceRepository.findById(botInstance.bot_instance_id);
    }

    // Step 10: Test Deactivation
    const wasDeactivated = await BotInstanceRepository.deactivate(botInstance.bot_instance_id);
    if (wasDeactivated) {
      const deactivatedBot = await BotInstanceRepository.findById(botInstance.bot_instance_id);
    }

    // Step 11: Cleanup
    await BotInstanceRepository.hardDelete(botInstance.bot_instance_id);
    await BotBlueprintRepository.hardDelete(blueprint.bot_blueprint_id);

    // Final Summary

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

// Run verification
verifyBotSystem().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

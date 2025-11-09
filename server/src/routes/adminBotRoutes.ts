import { Router, Request, Response } from 'express';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository';
import BotInstanceRepository from '../repositories/BotInstanceRepository';
import { resolveIdentity, rotateIdentity } from '../services/BotIdentityResolver';
import { getRandomAvatar } from '../services/BotAvatarService';
import { BehaviorProfiles } from '../models/BotBlueprint';
import { IdentityMode } from '../models/BotInstance';

const router = Router();

/**
 * POST /admin/tables/:tableId/seats/:seatIndex/assign-bot
 * Assign a bot to a specific seat
 */
router.post('/tables/:tableId/seats/:seatIndex/assign-bot', async (req: Request, res: Response) => {
  try {
    const { tableId, seatIndex } = req.params;
    const {
      bot_blueprint_id,
      identity_mode = 'randomize',
      display_name_override,
      bot_id_override,
      behavior_profile_name
    } = req.body;

    // Validate inputs
    const tableIdNum = parseInt(tableId);
    const seatIndexNum = parseInt(seatIndex);

    if (isNaN(tableIdNum) || isNaN(seatIndexNum)) {
      return res.status(400).json({ error: 'Invalid table ID or seat index' });
    }

    if (seatIndexNum < 0 || seatIndexNum > 5) {
      return res.status(400).json({ error: 'Seat index must be between 0 and 5' });
    }

    // Check if seat is already occupied by a bot
    const existingBot = await BotInstanceRepository.findByTableAndSeat(tableIdNum, seatIndexNum);
    if (existingBot) {
      return res.status(409).json({ error: 'Seat already occupied by a bot' });
    }

    // Get or create blueprint
    let blueprint;
    if (bot_blueprint_id) {
      blueprint = await BotBlueprintRepository.findById(bot_blueprint_id);
      if (!blueprint) {
        return res.status(404).json({ error: 'Bot blueprint not found' });
      }
    } else if (behavior_profile_name) {
      // Create blueprint from predefined profile
      const profileKey = behavior_profile_name.toUpperCase() as keyof typeof BehaviorProfiles;
      const behaviorProfile = BehaviorProfiles[profileKey];
      
      if (!behaviorProfile) {
        return res.status(400).json({ error: 'Invalid behavior profile name' });
      }

      blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: behaviorProfile,
        default_level: behaviorProfile.skill_level,
        persistent: identity_mode === 'persistent'
      });
    } else {
      // Use default balanced profile
      blueprint = await BotBlueprintRepository.create({
        display_name_template: '{{first}} {{last}}',
        behavior_profile: BehaviorProfiles.BALANCED,
        default_level: 50,
        persistent: false
      });
    }

    // Resolve identity
    const identity = await resolveIdentity(
      blueprint,
      identity_mode as IdentityMode,
      identity_mode === 'ephemeral' ? 24 : 4
    );

    // Override if provided
    const finalDisplayName = display_name_override || identity.displayName;
    const finalBotId = bot_id_override || identity.botId;
    const finalAvatar = identity.avatarUrl || getRandomAvatar();

    // Create bot instance
    const botInstance = await BotInstanceRepository.create({
      bot_blueprint_id: blueprint.bot_blueprint_id,
      display_name: finalDisplayName,
      bot_id: finalBotId,
      avatar_url: finalAvatar,
      assigned_table_id: tableIdNum,
      assigned_seat_index: seatIndexNum,
      expires_at: identity.expiresAt,
      randomized: identity_mode === 'randomize',
      balance_coins: 10000,
      balance_cash: 0
    });

    // TODO: Emit socket event to update table state
    // TODO: Create audit log entry

    return res.status(201).json({
      status: 'ok',
      message: 'Bot assigned successfully',
      bot_instance: {
        bot_instance_id: botInstance.bot_instance_id,
        display_name: botInstance.display_name,
        bot_id: botInstance.bot_id,
        avatar_url: botInstance.avatar_url,
        assigned_table_id: botInstance.assigned_table_id,
        assigned_seat_index: botInstance.assigned_seat_index,
        expires_at: botInstance.expires_at
      }
    });

  } catch (error: any) {
    console.error('Error assigning bot:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /admin/tables/:tableId/seats/:seatIndex/remove-bot
 * Remove a bot from a specific seat
 */
router.post('/tables/:tableId/seats/:seatIndex/remove-bot', async (req: Request, res: Response) => {
  try {
    const { tableId, seatIndex } = req.params;
    const tableIdNum = parseInt(tableId);
    const seatIndexNum = parseInt(seatIndex);

    if (isNaN(tableIdNum) || isNaN(seatIndexNum)) {
      return res.status(400).json({ error: 'Invalid table ID or seat index' });
    }

    // Find bot at this seat
    const botInstance = await BotInstanceRepository.findByTableAndSeat(tableIdNum, seatIndexNum);
    
    if (!botInstance) {
      return res.status(404).json({ error: 'No bot found at this seat' });
    }

    // Deactivate bot instance
    await BotInstanceRepository.deactivate(botInstance.bot_instance_id);

    // TODO: Emit socket event to update table state
    // TODO: Create audit log entry

    return res.json({
      status: 'ok',
      message: 'Bot removed successfully',
      bot_instance_id: botInstance.bot_instance_id
    });

  } catch (error: any) {
    console.error('Error removing bot:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/tables
 * Get all tables with seat information
 */
router.get('/tables', async (req: Request, res: Response) => {
  try {
    // TODO: Implement table listing with seat states
    // For now, return basic structure
    
    const botInstances = await BotInstanceRepository.findAllActive();
    const stats = await BotInstanceRepository.getStats();

    return res.json({
      status: 'ok',
      tables: [], // TODO: Implement table listing
      bot_stats: stats,
      active_bots: botInstances.length
    });

  } catch (error: any) {
    console.error('Error fetching tables:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PATCH /admin/bots/:blueprintId
 * Update bot blueprint
 */
router.patch('/bots/:blueprintId', async (req: Request, res: Response) => {
  try {
    const { blueprintId } = req.params;
    const updateData = req.body;

    const updated = await BotBlueprintRepository.update(blueprintId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Bot blueprint not found' });
    }

    // TODO: Create audit log entry

    return res.json({
      status: 'ok',
      message: 'Bot blueprint updated successfully',
      blueprint: updated
    });

  } catch (error: any) {
    console.error('Error updating bot blueprint:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /admin/bot_instances/:instanceId/rotate-identity
 * Rotate bot identity (new name and ID)
 */
router.post('/bot_instances/:instanceId/rotate-identity', async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;

    const newIdentity = await rotateIdentity(instanceId);
    
    // Update bot instance
    const updated = await BotInstanceRepository.update(instanceId, {
      display_name: newIdentity.displayName,
      bot_id: newIdentity.botId
    });

    if (!updated) {
      return res.status(404).json({ error: 'Bot instance not found' });
    }

    // TODO: Emit socket event if bot is in active game
    // TODO: Create audit log entry

    return res.json({
      status: 'ok',
      message: 'Bot identity rotated successfully',
      new_identity: {
        display_name: newIdentity.displayName,
        bot_id: newIdentity.botId
      }
    });

  } catch (error: any) {
    console.error('Error rotating bot identity:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/bots
 * Get all bot blueprints
 */
router.get('/bots', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const blueprints = await BotBlueprintRepository.findAll(includeInactive);

    return res.json({
      status: 'ok',
      blueprints
    });

  } catch (error: any) {
    console.error('Error fetching bot blueprints:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/bot_instances
 * Get all bot instances
 */
router.get('/bot_instances', async (req: Request, res: Response) => {
  try {
    const { table_id } = req.query;

    let instances;
    if (table_id) {
      instances = await BotInstanceRepository.findByTableId(parseInt(table_id as string));
    } else {
      instances = await BotInstanceRepository.findAllActive();
    }

    return res.json({
      status: 'ok',
      bot_instances: instances
    });

  } catch (error: any) {
    console.error('Error fetching bot instances:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;

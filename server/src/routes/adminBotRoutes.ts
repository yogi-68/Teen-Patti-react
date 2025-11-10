import { Router, Request, Response } from 'express';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import TableSeatRepository from '../repositories/TableSeatRepository.js';
import { resolveIdentity, rotateIdentity } from '../services/BotIdentityResolver.js';
import { getRandomAvatar } from '../services/BotAvatarService.js';
import { BehaviorProfiles } from '../models/BotBlueprint.js';
import { IdentityMode } from '../models/BotInstance.js';
import { OccupantType } from '../models/TableSeat.js';
import SocketService from '../services/SocketService.js';
import upload from '../middleware/upload.js';
import { uploadAvatar, deleteAvatar, generateRandomAvatar, getRandomAvatarStyle } from '../config/cloudinary.js';
import AuditService from '../services/AuditService.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';
import { adminBotRateLimiter, strictAdminRateLimiter } from '../middleware/rateLimiter.js';
import botConfig from '../services/BotConfigService.js';
// Audit logging now enabled with simplified system

const router = Router();

// Apply authentication and admin verification to all routes
router.use(authenticate);
router.use(verifyAdmin);

// Apply rate limiting to all admin bot routes
router.use(adminBotRateLimiter);

/**
 * POST /admin/tables/:tableId/seats/:seatIndex/assign-bot
 * Assign a bot to a specific seat
 * Uses strict rate limiting (20 req/15min)
 */
router.post('/tables/:tableId/seats/:seatIndex/assign-bot', strictAdminRateLimiter, async (req: Request, res: Response) => {
  const lockToken = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  let seatLocked = false;

  try {
    const { tableId, seatIndex } = req.params;
    const {
      bot_blueprint_id,
      identity_mode = 'randomize',
      display_name_override,
      bot_id_override,
      behavior_profile_name,
      force_replace_human = false
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

    // Check bot system feature flags
    if (!botConfig.canAssignBots()) {
      return res.status(503).json({ error: 'Bot assignment is currently disabled' });
    }

    // Check per-table bot limit
    const tableBotsCount = (await BotInstanceRepository.findByTableId(tableIdNum)).length;
    if (!botConfig.canAddBotToTable(tableBotsCount)) {
      return res.status(400).json({ 
        error: 'Maximum bots per table reached',
        max_allowed: botConfig.get('max_bots_per_table')
      });
    }

    // Ensure seat record exists (initialize if needed)
    let seat = await TableSeatRepository.findByTableAndSeat(tableIdNum, seatIndexNum);
    if (!seat) {
      // Initialize all seats for this table if none exist
      await TableSeatRepository.initializeTableSeats(tableIdNum);
      seat = await TableSeatRepository.findByTableAndSeat(tableIdNum, seatIndexNum);
      if (!seat) {
        return res.status(500).json({ error: 'Failed to initialize seat' });
      }
    }

    // Check seat availability
    const isAvailable = await TableSeatRepository.isSeatAvailable(tableIdNum, seatIndexNum);
    if (!isAvailable) {
      const seatInfo = await TableSeatRepository.findByTableAndSeat(tableIdNum, seatIndexNum);
      if (seatInfo?.occupant_type === OccupantType.HUMAN && !force_replace_human) {
        return res.status(409).json({ 
          error: 'Seat occupied by human player',
          message: 'Set force_replace_human=true to replace (requires confirmation)',
          occupant_id: seatInfo.occupant_id,
          occupant_name: seatInfo.occupant_name
        });
      } else if (seatInfo?.occupant_type === OccupantType.BOT) {
        return res.status(409).json({ 
          error: 'Seat already occupied by a bot',
          bot_instance_id: seatInfo.occupant_id
        });
      } else {
        return res.status(423).json({ error: 'Seat is locked by another operation' });
      }
    }

    // Acquire seat lock for atomic assignment
    const lockAcquired = await TableSeatRepository.acquireSeatLock(
      tableIdNum, 
      seatIndexNum, 
      lockToken, 
      30000 // 30 second timeout
    );

    if (!lockAcquired) {
      return res.status(423).json({ error: 'Failed to acquire seat lock. Seat may be in use.' });
    }

    seatLocked = true;

    // Check if seat is already occupied by a bot (double-check after lock)
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

    // Assign bot to seat with optimistic locking
    const adminUserId = (req as any).user?.userId || 'system';
    const assignmentSuccess = await TableSeatRepository.assignSeat(
      tableIdNum,
      seatIndexNum,
      OccupantType.BOT,
      botInstance.bot_instance_id,
      finalDisplayName,
      finalAvatar,
      adminUserId
    );

    if (!assignmentSuccess) {
      // Rollback bot instance creation if seat assignment fails
      await BotInstanceRepository.hardDelete(botInstance.bot_instance_id);
      return res.status(500).json({ error: 'Failed to assign seat. Please try again.' });
    }

    // Release seat lock
    await TableSeatRepository.releaseSeatLock(tableIdNum, seatIndexNum, lockToken);
    seatLocked = false;

    // Emit socket event to update table state
    {
      const socketHandler = SocketService.getSocketHandler();
      if (socketHandler) {
        socketHandler.emitBotAssigned(tableIdNum, seatIndexNum, {
          bot_instance_id: botInstance.bot_instance_id,
          display_name: botInstance.display_name,
          bot_id: botInstance.bot_id,
          avatar_url: botInstance.avatar_url,
          balance_coins: botInstance.balance_coins,
          balance_cash: botInstance.balance_cash,
        });
      }
    }
    
    // Audit logging (non-blocking, fail-safe)
    try {
      const adminUserId = (req as any).user?.userId || 'system';
      const adminUsername = (req as any).user?.username || 'admin';
      await AuditService.logBotAssignment(
        adminUserId,
        adminUsername,
        botInstance,
        tableIdNum,
        seatIndexNum
      );
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

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
    
    // Always release seat lock on error
    if (seatLocked) {
      try {
        const tableIdNum = parseInt(req.params.tableId);
        const seatIndexNum = parseInt(req.params.seatIndex);
        await TableSeatRepository.releaseSeatLock(tableIdNum, seatIndexNum, lockToken);
      } catch (unlockError) {
        console.error('Failed to release seat lock:', unlockError);
      }
    }
    
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /admin/tables/:tableId/seats/:seatIndex/remove-bot
 * Remove a bot from a specific seat
 * Uses strict rate limiting (20 req/15min)
 */
router.post('/tables/:tableId/seats/:seatIndex/remove-bot', strictAdminRateLimiter, async (req: Request, res: Response) => {
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

    // Clear the seat first (this updates table_seats to EMPTY)
    const adminUserId = (req as any).user?.userId || 'system';
    const seatCleared = await TableSeatRepository.clearSeat(tableIdNum, seatIndexNum, adminUserId);
    
    if (!seatCleared) {
      return res.status(500).json({ error: 'Failed to clear seat' });
    }

    // Deactivate bot instance
    await BotInstanceRepository.deactivate(botInstance.bot_instance_id);
    
    // If bot is ephemeral, hard delete it
    if (botInstance.expires_at) {
      await BotInstanceRepository.hardDelete(botInstance.bot_instance_id);
    }

    // Emit socket event to update table state
    {
      const socketHandler = SocketService.getSocketHandler();
      if (socketHandler) {
        socketHandler.emitBotRemoved(tableIdNum, seatIndexNum, botInstance.bot_instance_id);
      }
    }

    // Audit logging (non-blocking, fail-safe)
    try {
      const adminUsername = (req as any).user?.username || 'admin';
      await AuditService.logBotRemoval(
        adminUserId,
        adminUsername,
        botInstance,
        tableIdNum,
        seatIndexNum
      );
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

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
    // Get all bot instances to know which tables have bots
    const botInstances = await BotInstanceRepository.findAllActive();
    const stats = await BotInstanceRepository.getStats();
    
    // Group bots by table
    const tableMap = new Map<number, typeof botInstances>();
    for (const bot of botInstances) {
      if (bot.assigned_table_id !== undefined) {
        if (!tableMap.has(bot.assigned_table_id)) {
          tableMap.set(bot.assigned_table_id, []);
        }
        tableMap.get(bot.assigned_table_id)!.push(bot);
      }
    }

    // Get seat states for each table
    const tables = [];
    const tableIds = Array.from(tableMap.keys());
    
    for (const tableId of tableIds) {
      const seats = await TableSeatRepository.findAllByTableId(tableId);
      const tableStats = await TableSeatRepository.getTableStats(tableId);
      
      tables.push({
        table_id: tableId,
        seat_count: 6,
        occupied_seats: tableStats.occupied,
        bot_seats: tableStats.bot_occupied,
        human_seats: tableStats.human_occupied,
        empty_seats: tableStats.empty,
        locked_seats: tableStats.locked,
        seats: seats.map(seat => ({
          seat_index: seat.seat_index,
          occupant_type: seat.occupant_type,
          occupant_id: seat.occupant_id,
          occupant_name: seat.occupant_name,
          occupant_avatar: seat.occupant_avatar,
          is_locked: seat.locked_until ? seat.locked_until > new Date() : false,
          updated_at: seat.updated_at,
          updated_by: seat.updated_by
        }))
      });
    }

    return res.json({
      status: 'ok',
      tables,
      bot_stats: stats,
      active_bots: botInstances.length,
      total_tables: tables.length
    });

  } catch (error: any) {
    console.error('Error fetching tables:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PATCH /admin/bots/:blueprintId
 * Update bot blueprint
 * Uses strict rate limiting (20 req/15min)
 */
router.patch('/bots/:blueprintId', strictAdminRateLimiter, async (req: Request, res: Response) => {
  try {
    const { blueprintId } = req.params;
    const updateData = req.body;

    // Get old blueprint for audit logging
    const oldBlueprint = await BotBlueprintRepository.findById(blueprintId);
    if (!oldBlueprint) {
      return res.status(404).json({ error: 'Bot blueprint not found' });
    }

    const updated = await BotBlueprintRepository.update(blueprintId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Bot blueprint update failed' });
    }

    // Audit logging (non-blocking, fail-safe)
    try {
      const user = (req as any).user;
      await AuditService.logBlueprintUpdate(
        user.userId,
        user.username,
        blueprintId,
        oldBlueprint,
        updated
      );
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

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
 * Uses strict rate limiting (20 req/15min)
 */
router.post('/bot_instances/:instanceId/rotate-identity', strictAdminRateLimiter, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;

    // Get current identity before rotation
    const currentBot = await BotInstanceRepository.findById(instanceId);
    if (!currentBot) {
      return res.status(404).json({ error: 'Bot instance not found' });
    }

    const oldIdentity = {
      display_name: currentBot.display_name,
      bot_id: currentBot.bot_id
    };

    const newIdentity = await rotateIdentity(instanceId);
    
    // Update bot instance
    const updated = await BotInstanceRepository.update(instanceId, {
      display_name: newIdentity.displayName,
      bot_id: newIdentity.botId
    });

    if (!updated) {
      return res.status(404).json({ error: 'Bot instance not found after update' });
    }

    // Emit socket event if bot is assigned to a table
    if (currentBot.assigned_table_id != null && currentBot.assigned_seat_index != null) {
      const socketHandler = SocketService.getSocketHandler();
      if (socketHandler) {
        // assigned_table_id and assigned_seat_index are checked for != null above
        socketHandler.emitBotIdentityRotated(
          currentBot.assigned_table_id as number,
          currentBot.assigned_seat_index as number,
          oldIdentity,
          {
            display_name: newIdentity.displayName,
            bot_id: newIdentity.botId,
          }
        );
      }
    }
    
    // Audit logging (non-blocking, fail-safe)
    try {
      const adminUserId = (req as any).user?.userId || 'system';
      const adminUsername = (req as any).user?.username || 'admin';
      await AuditService.logIdentityRotation(
        adminUserId,
        adminUsername,
        updated,
        oldIdentity
      );
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

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
 * GET /admin/bots/blueprints
 * Alias for /admin/bots - Get all bot blueprints
 */
router.get('/bots/blueprints', async (req: Request, res: Response) => {
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

/**
 * POST /admin/test/bot-system
 * Public test endpoint to verify bot system is working (NO AUTH REQUIRED)
 * Use for production testing and health checks
 */
router.post('/test/bot-system', async (req: Request, res: Response) => {
  try {
    // Create a test blueprint
    const blueprint = await BotBlueprintRepository.create({
      display_name_template: '{{first}} {{last}}',
      behavior_profile: BehaviorProfiles.BALANCED,
      default_level: 50,
      persistent: false,
      created_by: 'test-endpoint'
    });

    // Resolve identity
    const identity = await resolveIdentity(blueprint, 'randomize', 4);
    
    // Get avatar
    const avatar = getRandomAvatar();

    // Create bot instance (not assigned to any table)
    const botInstance = await BotInstanceRepository.create({
      bot_blueprint_id: blueprint.bot_blueprint_id,
      display_name: identity.displayName,
      bot_id: identity.botId,
      avatar_url: avatar,
      expires_at: identity.expiresAt,
      randomized: true,
      created_by_admin_id: 'test-endpoint'
    });

    // Get stats
    const stats = await BotInstanceRepository.getStats();

    return res.status(201).json({
      status: 'ok',
      message: 'Bot system test successful',
      test_results: {
        blueprint_created: true,
        identity_resolved: true,
        avatar_selected: true,
        bot_instance_created: true
      },
      bot_instance: {
        bot_instance_id: botInstance.bot_instance_id,
        display_name: botInstance.display_name,
        bot_id: botInstance.bot_id,
        avatar_url: botInstance.avatar_url,
        balance_coins: botInstance.balance_coins,
        expires_at: botInstance.expires_at,
        created_at: botInstance.created_at
      },
      system_stats: {
        total_bots: stats.total,
        active_bots: stats.active
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bot system test error:', error);
    return res.status(500).json({ 
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// NOTE: Audit log endpoints have been moved to auditLogRoutes.ts
// Available at: /api/admin/audit-logs
// - GET /api/admin/audit-logs - Get logs with filters
// - GET /api/admin/audit-logs/recent - Get recent logs
// - GET /api/admin/audit-logs/entity/:entityType/:entityId - Get entity logs
// - GET /api/admin/audit-logs/stats - Get statistics

/**
 * POST /admin/bots/avatars/upload
 * Upload avatar image to Cloudinary
 */
router.post('/bots/avatars/upload', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await uploadAvatar(base64Image, 'bot-avatars');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      avatar_url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /admin/bots/avatars/:publicId
 * Delete avatar from Cloudinary
 */
router.delete('/bots/avatars/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;

    // Decode public_id (it may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);

    const result = await deleteAvatar(decodedPublicId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({
      error: 'Failed to delete avatar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /admin/bots/avatars/generate
 * Generate random avatar URL using DiceBear API
 */
router.get('/bots/avatars/generate', async (req: Request, res: Response) => {
  try {
    const { seed, style } = req.query;

    const avatarStyle = (style as string) || getRandomAvatarStyle();
    const avatarUrl = generateRandomAvatar(seed as string, avatarStyle);

    res.json({
      success: true,
      avatar_url: avatarUrl,
      style: avatarStyle,
      seed: seed || 'random',
    });
  } catch (error) {
    console.error('Avatar generation error:', error);
    res.status(500).json({
      error: 'Failed to generate avatar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /admin/bots/instance/:botId/avatar
 * Update bot instance avatar
 */
router.put('/bots/instance/:botId/avatar', async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: 'avatar_url is required' });
    }

    // Find bot instance
    const botInstance = await BotInstanceRepository.findById(botId);
    if (!botInstance) {
      return res.status(404).json({ error: 'Bot instance not found' });
    }

    // Update avatar
    botInstance.avatar_url = avatar_url;
    await BotInstanceRepository.update(botId, botInstance);

    // Emit socket event for real-time update (if table assigned)
    if (botInstance.assigned_table_id !== null) {
      const socketHandler = SocketService.getSocketHandler();
      if (socketHandler) {
        socketHandler.getIO().emit('bot:avatarUpdated', {
          botId,
          avatar_url,
          tableId: botInstance.assigned_table_id,
          seatIndex: botInstance.assigned_seat_index,
        });
      }
    }

    res.json({
      success: true,
      message: 'Bot avatar updated successfully',
      bot: botInstance,
    });
  } catch (error) {
    console.error('Bot avatar update error:', error);
    res.status(500).json({
      error: 'Failed to update bot avatar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /admin/bots/blueprint/:blueprintId/avatar
 * Update bot blueprint default avatar
 */
router.put('/bots/blueprint/:blueprintId/avatar', async (req: Request, res: Response) => {
  try {
    const { blueprintId } = req.params;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: 'avatar_url is required' });
    }

    // Find blueprint
    const blueprint = await BotBlueprintRepository.findById(blueprintId);
    if (!blueprint) {
      return res.status(404).json({ error: 'Bot blueprint not found' });
    }

    // Update avatar
    blueprint.avatar_url = avatar_url;
    await BotBlueprintRepository.update(blueprintId, blueprint);

    res.json({
      success: true,
      message: 'Blueprint avatar updated successfully',
      blueprint,
    });
  } catch (error) {
    console.error('Blueprint avatar update error:', error);
    res.status(500).json({
      error: 'Failed to update blueprint avatar',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


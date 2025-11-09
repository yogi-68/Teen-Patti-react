import { Router, Request, Response } from 'express';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import { resolveIdentity, rotateIdentity } from '../services/BotIdentityResolver.js';
import { getRandomAvatar } from '../services/BotAvatarService.js';
import { BehaviorProfiles } from '../models/BotBlueprint.js';
import { IdentityMode } from '../models/BotInstance.js';
import SocketService from '../services/SocketService.js';
import AuditService from '../services/AuditService.js';
import AuditLogRepository from '../repositories/AuditLogRepository.js';
import { AuditActionType, AuditEntityType } from '../models/AuditLog.js';

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
    
    // Create audit log entry (non-blocking, fail-safe)
    try {
      const adminUserId = req.headers['x-user-id'] as string || 'unknown';
      AuditService.logBotAssigned(
        adminUserId,
        undefined,
        tableIdNum,
        seatIndexNum,
        botInstance.bot_instance_id,
        botInstance.bot_id,
        {
          display_name: botInstance.display_name,
          avatar_url: botInstance.avatar_url,
          balance_coins: botInstance.balance_coins,
          behavior_profile: blueprint.behavior_profile,
        },
        req
      ).catch(err => console.error('Audit log error:', err));
    } catch (auditError) {
      console.error('Failed to initiate audit logging:', auditError);
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

    // Emit socket event to update table state
    {
      const socketHandler = SocketService.getSocketHandler();
      if (socketHandler) {
        socketHandler.emitBotRemoved(tableIdNum, seatIndexNum, botInstance.bot_instance_id);
      }
    }

    // Create audit log entry (non-blocking, fail-safe)
    try {
      const adminUserId = req.headers['x-user-id'] as string || 'unknown';
      AuditService.logBotRemoved(
        adminUserId,
        undefined,
        tableIdNum,
        seatIndexNum,
        botInstance.bot_instance_id,
        botInstance.bot_id,
        req
      ).catch(err => console.error('Audit log error:', err));
    } catch (auditError) {
      console.error('Failed to initiate audit logging:', auditError);
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
    
    // Create audit log entry (non-blocking, fail-safe)
    try {
      const adminUserId = req.headers['x-user-id'] as string || 'unknown';
      AuditService.logBotIdentityRotated(
        adminUserId,
        undefined,
        instanceId,
        currentBot.assigned_table_id,
        currentBot.assigned_seat_index,
        oldIdentity,
        {
          display_name: newIdentity.displayName,
          bot_id: newIdentity.botId,
        },
        req
      ).catch(err => console.error('Audit log error:', err));
    } catch (auditError) {
      console.error('Failed to initiate audit logging:', auditError);
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

/**
 * GET /admin/audit-logs
 * Get audit logs with optional filters
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const {
      admin_user_id,
      action_type,
      entity_type,
      entity_id,
      table_id,
      status,
      start_date,
      end_date,
      limit = '50',
      skip = '0',
    } = req.query;

    const queryParams: any = {};

    if (admin_user_id) queryParams.admin_user_id = admin_user_id as string;
    if (action_type) queryParams.action_type = action_type as AuditActionType;
    if (entity_type) queryParams.entity_type = entity_type as AuditEntityType;
    if (entity_id) queryParams.entity_id = entity_id as string;
    if (table_id) queryParams.table_id = parseInt(table_id as string);
    if (status) queryParams.status = status as 'success' | 'failure';
    if (start_date) queryParams.start_date = new Date(start_date as string);
    if (end_date) queryParams.end_date = new Date(end_date as string);

    queryParams.limit = parseInt(limit as string);
    queryParams.skip = parseInt(skip as string);

    const [logs, total] = await Promise.all([
      AuditLogRepository.find(queryParams),
      AuditLogRepository.count(queryParams),
    ]);

    return res.json({
      status: 'ok',
      logs,
      pagination: {
        total,
        limit: queryParams.limit,
        skip: queryParams.skip,
        has_more: total > queryParams.skip + queryParams.limit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', async (req: Request, res: Response) => {
  try {
    const stats = await AuditLogRepository.getStats();

    return res.json({
      status: 'ok',
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching audit log stats:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/audit-logs/entity/:entityType/:entityId
 * Get audit logs for a specific entity
 */
router.get('/audit-logs/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const logs = await AuditLogRepository.findByEntity(entityType as AuditEntityType, entityId, limit);

    return res.json({
      status: 'ok',
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error('Error fetching entity audit logs:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/audit-logs/table/:tableId
 * Get audit logs for a specific table
 */
router.get('/audit-logs/table/:tableId', async (req: Request, res: Response) => {
  try {
    const tableId = parseInt(req.params.tableId);
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await AuditLogRepository.findByTable(tableId, limit);

    return res.json({
      status: 'ok',
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error('Error fetching table audit logs:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /admin/audit-logs/recent
 * Get recent audit logs
 */
router.get('/audit-logs/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await AuditLogRepository.findRecent(limit);

    return res.json({
      status: 'ok',
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error('Error fetching recent audit logs:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;


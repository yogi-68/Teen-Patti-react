import { Router, Request, Response } from 'express';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import { resolveIdentity } from '../services/BotIdentityResolver.js';
import { getRandomAvatar } from '../services/BotAvatarService.js';
import { BehaviorProfiles } from '../models/BotBlueprint.js';

const router = Router();

/**
 * POST /test/bot-system
 * Public test endpoint to verify bot system is working
 * NO AUTHENTICATION REQUIRED - For testing and health checks only
 */
router.post('/bot-system', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Bot system test initiated...');

    // Create a test blueprint
    const blueprint = await BotBlueprintRepository.create({
      display_name_template: '{{first}} {{last}}',
      behavior_profile: BehaviorProfiles.BALANCED,
      default_level: 50,
      persistent: false,
      created_by: 'public-test-endpoint'
    });
    console.log('✅ Blueprint created:', blueprint.bot_blueprint_id);

    // Resolve identity
    const identity = await resolveIdentity(blueprint, 'randomize', 4);
    console.log('✅ Identity resolved:', identity.displayName, identity.botId);
    
    // Get avatar
    const avatar = getRandomAvatar();
    console.log('✅ Avatar selected:', avatar);

    // Create bot instance (not assigned to any table)
    const botInstance = await BotInstanceRepository.create({
      bot_blueprint_id: blueprint.bot_blueprint_id,
      display_name: identity.displayName,
      bot_id: identity.botId,
      avatar_url: avatar,
      expires_at: identity.expiresAt,
      randomized: true,
      created_by_admin_id: 'public-test'
    });
    console.log('✅ Bot instance created:', botInstance.bot_instance_id);

    // Get stats
    const stats = await BotInstanceRepository.getStats();
    console.log('✅ System stats:', stats);

    return res.status(201).json({
      status: 'success',
      message: '🎉 Bot Management System is fully operational!',
      test_results: {
        blueprint_created: true,
        identity_resolved: true,
        avatar_selected: true,
        bot_instance_created: true,
        database_connected: true
      },
      bot_details: {
        bot_instance_id: botInstance.bot_instance_id,
        display_name: botInstance.display_name,
        bot_id: botInstance.bot_id,
        avatar_url: botInstance.avatar_url,
        balance_coins: botInstance.balance_coins,
        balance_cash: botInstance.balance_cash,
        expires_at: botInstance.expires_at,
        created_at: botInstance.created_at,
        is_active: botInstance.is_active
      },
      system_stats: {
        total_bots: stats.total,
        active_bots: stats.active,
        bots_by_table: Object.fromEntries(stats.byTable)
      },
      blueprint_info: {
        bot_blueprint_id: blueprint.bot_blueprint_id,
        behavior_profile: {
          aggressiveness: blueprint.behavior_profile.aggressiveness,
          risk_tolerance: blueprint.behavior_profile.risk_tolerance,
          reaction_delay_ms: blueprint.behavior_profile.reaction_delay_ms,
          error_rate: blueprint.behavior_profile.error_rate,
          skill_level: blueprint.behavior_profile.skill_level
        },
        default_level: blueprint.default_level
      },
      server_info: {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime_seconds: process.uptime(),
        node_version: process.version
      }
    });
  } catch (error: any) {
    console.error('❌ Bot system test failed:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Bot system test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /test/bot-system/stats
 * Get current bot system statistics
 * NO AUTHENTICATION REQUIRED
 */
router.get('/bot-system/stats', async (req: Request, res: Response) => {
  try {
    const stats = await BotInstanceRepository.getStats();
    const allBlueprints = await BotBlueprintRepository.findAll();

    return res.status(200).json({
      status: 'success',
      statistics: {
        blueprints: {
          total: allBlueprints.length,
          active: allBlueprints.filter(b => b.is_active).length
        },
        instances: {
          total: stats.total,
          active: stats.active,
          by_table: Object.fromEntries(stats.byTable)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

/**
 * GET /test/bot-system/health
 * Simple health check for bot system
 */
router.get('/bot-system/health', async (req: Request, res: Response) => {
  try {
    // Quick health check - just try to count documents
    const stats = await BotInstanceRepository.getStats();
    
    return res.status(200).json({
      status: 'healthy',
      message: 'Bot Management System is operational',
      checks: {
        database: 'connected',
        repositories: 'operational',
        total_bots: stats.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Bot system is not operational',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

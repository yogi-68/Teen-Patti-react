import express from 'express';
import { BotInstanceRepository } from '../repositories/BotInstanceRepository.js';
import { BotBlueprintRepository } from '../repositories/BotBlueprintRepository.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();
const botInstanceRepo = new BotInstanceRepository();
const botBlueprintRepo = new BotBlueprintRepository();

// Apply authentication and admin verification to all routes
router.use(authenticate);
router.use(verifyAdmin);

/**
 * Get analytics for a specific bot
 * GET /api/admin/bot-analytics/:instanceId
 */
router.get('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    const analytics = await botInstanceRepo.getAnalytics(instanceId);
    
    if (!analytics) {
      return res.status(404).json({
        error: 'Bot instance not found'
      });
    }

    // Get blueprint info for additional context
    const instance = await botInstanceRepo.findById(instanceId);
    if (instance) {
      const blueprint = await botBlueprintRepo.findById(instance.bot_blueprint_id);
      if (blueprint) {
        analytics.behavior_profile_summary = {
          aggressiveness: blueprint.behavior_profile.aggressiveness,
          risk_tolerance: blueprint.behavior_profile.risk_tolerance,
          skill_level: blueprint.behavior_profile.skill_level
        };
      }
    }

    res.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    console.error('Error fetching bot analytics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get analytics for all bots
 * GET /api/admin/bot-analytics?sortBy=win_rate&limit=10&onlyActive=true
 */
router.get('/', async (req, res) => {
  try {
    const { sortBy, limit, onlyActive } = req.query;

    const options: any = {};
    if (sortBy) options.sortBy = sortBy as string;
    if (limit) options.limit = parseInt(limit as string);
    if (onlyActive === 'true') options.onlyActive = true;

    const analytics = await botInstanceRepo.getAllAnalytics(options);

    res.json({
      success: true,
      count: analytics.length,
      analytics
    });
  } catch (error: any) {
    console.error('Error fetching all bot analytics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get aggregate statistics by blueprint
 * GET /api/admin/bot-analytics/blueprint/:blueprintId
 */
router.get('/blueprint/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;

    const blueprint = await botBlueprintRepo.findById(blueprintId);
    if (!blueprint) {
      return res.status(404).json({
        error: 'Blueprint not found'
      });
    }

    const stats = await botInstanceRepo.getStatsByBlueprint(blueprintId);

    res.json({
      success: true,
      blueprint: {
        id: blueprint.bot_blueprint_id,
        display_name_template: blueprint.display_name_template,
        behavior_profile: blueprint.behavior_profile
      },
      stats
    });
  } catch (error: any) {
    console.error('Error fetching blueprint analytics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get leaderboard (top performing bots)
 * GET /api/admin/bot-analytics/leaderboard?metric=win_rate&limit=10
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const metric = (req.query.metric as string) || 'win_rate';
    const limit = parseInt(req.query.limit as string) || 10;

    const analytics = await botInstanceRepo.getAllAnalytics({
      sortBy: metric as any,
      limit,
      onlyActive: false // Include all bots for leaderboard
    });

    res.json({
      success: true,
      metric,
      limit,
      leaderboard: analytics
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Compare multiple bots
 * POST /api/admin/bot-analytics/compare
 * Body: { bot_instance_ids: ["id1", "id2", "id3"] }
 */
router.post('/compare', async (req, res) => {
  try {
    const { bot_instance_ids } = req.body;

    if (!Array.isArray(bot_instance_ids) || bot_instance_ids.length === 0) {
      return res.status(400).json({
        error: 'bot_instance_ids array is required'
      });
    }

    const comparisons = await Promise.all(
      bot_instance_ids.map(id => botInstanceRepo.getAnalytics(id))
    );

    const validComparisons = comparisons.filter(c => c !== null);

    res.json({
      success: true,
      count: validComparisons.length,
      comparisons: validComparisons
    });
  } catch (error: any) {
    console.error('Error comparing bots:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get overall system analytics
 * GET /api/admin/bot-analytics/system/overview
 */
router.get('/system/overview', async (req, res) => {
  try {
    const allBots = await botInstanceRepo.findAllActive();
    const allAnalytics = await botInstanceRepo.getAllAnalytics();

    const totalGamesPlayed = allAnalytics.reduce((sum, a) => sum + a.games_played, 0);
    const totalGamesWon = allAnalytics.reduce((sum, a) => sum + a.games_won, 0);
    const totalWinnings = allAnalytics.reduce((sum, a) => sum + a.total_winnings, 0);
    const totalBetAmount = allAnalytics.reduce((sum, a) => sum + a.total_bet_amount, 0);

    // Get top performers
    const topByWinRate = await botInstanceRepo.getAllAnalytics({
      sortBy: 'win_rate',
      limit: 5,
      onlyActive: true
    });

    const topByWinnings = await botInstanceRepo.getAllAnalytics({
      sortBy: 'total_winnings',
      limit: 5,
      onlyActive: true
    });

    res.json({
      success: true,
      overview: {
        total_active_bots: allBots.length,
        total_games_played: totalGamesPlayed,
        total_games_won: totalGamesWon,
        overall_win_rate: totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed) * 100 : 0,
        total_winnings: totalWinnings,
        total_bet_amount: totalBetAmount,
        overall_roi: totalBetAmount > 0 ? (totalWinnings / totalBetAmount) * 100 : 0,
        avg_games_per_bot: allBots.length > 0 ? totalGamesPlayed / allBots.length : 0
      },
      top_performers: {
        by_win_rate: topByWinRate,
        by_winnings: topByWinnings
      }
    });
  } catch (error: any) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

export default router;

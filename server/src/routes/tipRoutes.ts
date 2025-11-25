import express, { Request, Response } from 'express';
import tipService from '../services/TipService.js';

const router = express.Router();

/**
 * GET /api/tips/history/:userId
 * Get tip history for a player
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const tips = await tipService.getPlayerTipHistory(userId, limit);

    res.json({
      success: true,
      tips,
      count: tips.length,
    });
  } catch (error) {
    console.error('❌ Error fetching tip history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tip history',
    });
  }
});

/**
 * GET /api/tips/table/:tableId
 * Get tip history for a table
 */
router.get('/table/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const roundNumber = req.query.roundNumber ? parseInt(req.query.roundNumber as string) : undefined;

    const tips = await tipService.getTableTipHistory(parseInt(tableId), roundNumber);

    res.json({
      success: true,
      tips,
      count: tips.length,
    });
  } catch (error) {
    console.error('❌ Error fetching table tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table tips',
    });
  }
});

/**
 * GET /api/tips/stats/:userId
 * Get tip statistics for a player
 */
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await tipService.getPlayerTipStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching tip stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tip statistics',
    });
  }
});

/**
 * POST /api/tips/validate
 * Validate if player can send tip (without processing)
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { userId, amount, gameMode } = req.body;

    if (!userId || !amount || !gameMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, gameMode',
      });
    }

    const validation = await tipService.validateTip(userId, amount, gameMode);

    res.json({
      success: validation.valid,
      valid: validation.valid,
      reason: validation.reason,
      balance: validation.balance,
    });
  } catch (error) {
    console.error('❌ Error validating tip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate tip',
    });
  }
});

/**
 * POST /api/tips/detect-quality
 * Detect card quality for tip suggestion
 */
router.post('/detect-quality', async (req: Request, res: Response) => {
  try {
    const { cards } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cards array. Must provide exactly 3 cards.',
      });
    }

    const cardQuality = tipService.detectCardQuality(cards);

    const shouldSuggestTip = ['pair', 'color', 'sequence', 'pure_sequence', 'trail'].includes(cardQuality);

    res.json({
      success: true,
      cardQuality,
      shouldSuggestTip,
      message: shouldSuggestTip 
        ? `You got a ${cardQuality}! Consider tipping to celebrate your good cards!` 
        : 'Regular cards',
    });
  } catch (error) {
    console.error('❌ Error detecting card quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect card quality',
    });
  }
});

export default router;

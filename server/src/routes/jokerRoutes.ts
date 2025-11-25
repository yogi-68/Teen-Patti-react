import { Router } from 'express';
import { jokerService } from '../services/JokerService.js';
import { GameService } from '../services/GameService.js';

const router = Router();
const gameService = new GameService();

/**
 * Check if user is eligible to use Joker
 * GET /api/joker/eligibility
 */
router.get('/eligibility', async (req, res) => {
  try {
    const { userId, tableId, gameMode } = req.query;

    if (!userId || !tableId || !gameMode) {
      return res.status(400).json({
        error: 'Missing required parameters: userId, tableId, gameMode',
      });
    }

    const eligibility = await jokerService.checkEligibility(
      userId as string,
      parseInt(tableId as string),
      gameMode as string
    );

    return res.json(eligibility);
  } catch (error: any) {
    console.error('❌ Error checking Joker eligibility:', error);
    return res.status(500).json({
      error: 'Failed to check eligibility',
      message: error.message,
    });
  }
});

/**
 * Get Joker status for a table
 * GET /api/joker/status/:tableId
 */
router.get('/status/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const { userId } = req.query;

    if (!tableId) {
      return res.status(400).json({
        error: 'Missing required parameter: tableId',
      });
    }

    const status = jokerService.getTableJokerStatus(parseInt(tableId));

    if (userId) {
      const hasUsed = jokerService.hasUsedJoker(parseInt(tableId), userId as string);
      const assignedTier = jokerService.getUserTier(parseInt(tableId), userId as string);

      return res.json({
        ...status,
        hasUsedJoker: hasUsed,
        assignedTier,
      });
    }

    return res.json(status);
  } catch (error: any) {
    console.error('❌ Error getting Joker status:', error);
    return res.status(500).json({
      error: 'Failed to get Joker status',
      message: error.message,
    });
  }
});

export default router;

import express, { Request, Response } from 'express';
import JokerService from '../services/JokerService.js';
import { authenticate } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * Check if user meets Joker requirements
 * GET /api/joker/requirements
 */
router.get('/requirements', async (req: Request, res: Response) => {
  try {
    // Accept both JWT token (from authenticate middleware) and x-user-id header
    const userId = req.userId || (req.headers['x-user-id'] as string);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // If database is not connected, return default requirements (not met)
    try {
      const requirements = await JokerService.meetsJokerRequirements(userId);
      
      return res.status(200).json({
        success: true,
        data: requirements
      });
    } catch (dbError) {
      // Database timeout or connection error - return safe defaults
      console.warn('Database error in Joker requirements, returning defaults:', (dbError as Error).message);
      return res.status(200).json({
        success: true,
        data: {
          meetsRequirements: false,
          hasMadeDeposit: false,
          currentBalance: 0,
          needsBalance: 500
        }
      });
    }
  } catch (error) {
    console.error('Error checking Joker requirements:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check Joker requirements'
    });
  }
});

/**
 * Check if user can use Joker in specific game
 * POST /api/joker/validate
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    // Accept both JWT token (from authenticate middleware) and x-user-id header
    const userId = req.userId || (req.headers['x-user-id'] as string);
    const { tableType, hasUsedJokerInCurrentGame } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!tableType || typeof hasUsedJokerInCurrentGame !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tableType, hasUsedJokerInCurrentGame'
      });
    }

    const validation = await JokerService.canUseJoker(
      userId,
      tableType,
      hasUsedJokerInCurrentGame
    );

    return res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating Joker:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate Joker'
    });
  }
});

/**
 * Get Joker tutorial/info
 * GET /api/joker/info
 */
router.get('/info', async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      name: 'Joker Button',
      description: 'Activate the Joker to see ALL players\' cards for the entire game!',
      requirements: {
        deposit: 'Must make at least one real deposit (buy/earn coins)',
        balance: 'Minimum 500 real coins required in wallet',
        tableType: 'Only available in cash tables',
        limit: 'One use per game'
      },
      benefits: [
        'See ALL players\' cards for entire game',
        'Cards get gold glowing background (visual indicator)',
        'Strategic advantage to make better decisions'
      ],
      cost: {
        description: '30% fee applies ONLY if you win the table AND are the highest Joker winner',
        example: 'Win 1000 coins with top Joker hand → Pay 300 fee → Keep 700 coins',
        multipleJokers: 'If multiple players use Joker, only the one with highest winning hand pays the 30% fee'
      },
      strategy: {
        tips: [
          'Use when you have a strong hand to maximize advantage',
          'Cards get gold border - everyone sees you used Joker',
          'Only top Joker winner among winners pays the fee',
          'Other Joker users pay no fee if they don\'t win'
        ]
      },
      visual: {
        effect: 'Gold glowing border with animated Joker icon on cards',
        notification: 'All players see your cards got special background'
      }
    }
  });
});

export default router;

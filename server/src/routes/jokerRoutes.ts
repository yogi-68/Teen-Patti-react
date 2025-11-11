import express, { Request, Response } from 'express';
import JokerService from '../services/JokerService.js';
import { authenticate } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * Check if user meets Joker requirements
 * GET /api/joker/requirements
 */
router.get('/requirements', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId; // From authenticateUser middleware
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const requirements = await JokerService.meetsJokerRequirements(userId);

    return res.status(200).json({
      success: true,
      data: requirements
    });
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
router.post('/validate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
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
      description: 'Activate the Joker to see other Joker users\' cards and compete for the top spot!',
      requirements: {
        deposit: 'Must make at least one real deposit',
        balance: 'Minimum 500 real coins required',
        tableType: 'Only available in cash tables',
        limit: 'One use per game'
      },
      benefits: [
        'See cards of all other Joker users',
        'Compete in mini-competition among Joker users',
        'Top Joker hand gets revealed to others'
      ],
      cost: {
        description: '30% fee applies only if you win the table AND are the top Joker',
        example: 'Win 1000 coins with top Joker → Pay 300 fee → Keep 700 coins'
      },
      strategy: {
        tips: [
          'Use when you have a strong hand',
          'More Joker users = more cards visible',
          'Only top Joker winner pays the fee',
          'Other Joker users pay no fee'
        ]
      },
      visual: {
        effect: 'Gold/glowing border on cards',
        notification: 'Other Joker users see your cards too'
      }
    }
  });
});

export default router;

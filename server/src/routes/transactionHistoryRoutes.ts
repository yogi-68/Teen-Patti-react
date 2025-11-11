import express, { Request, Response } from 'express';
import TransactionHistoryService from '../services/TransactionHistoryService.js';
import { TransactionHistoryType } from '../models/TransactionHistory.model.js';
import { authenticate } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * Get user's transaction history with filters
 * GET /api/history?page=1&limit=20&type=DEPOSIT&startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const options = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      type: req.query.type as TransactionHistoryType | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const history = await TransactionHistoryService.getUserHistory(userId, options);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get transaction history'
    });
  }
});

/**
 * Get user's transaction statistics
 * GET /api/history/stats
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const stats = await TransactionHistoryService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get transaction stats'
    });
  }
});

/**
 * Get available transaction types for filtering
 * GET /api/history/types
 */
router.get('/types', async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      types: Object.values(TransactionHistoryType),
      descriptions: {
        DEPOSIT: 'Money added to account',
        WITHDRAWAL: 'Money withdrawn from account',
        REFERRAL_BONUS: 'Bonus earned from referrals',
        JOKER_DEDUCTION: '30% fee from Joker wins',
        TRANSFER_SENT: 'Coins sent to another player',
        TRANSFER_RECEIVED: 'Coins received from another player',
        GAME_WIN: 'Coins won in game',
        GAME_LOSS: 'Coins lost in game',
        ADMIN_ADJUSTMENT: 'Manual adjustment by admin'
      }
    }
  });
});

export default router;

import express, { Request, Response } from 'express';
import ReferralService from '../services/ReferralService.js';
import { authenticate } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * Get user's referral code and stats
 * GET /api/referral/my-stats
 */
router.get('/my-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const stats = await ReferralService.getReferralStats(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get referral stats'
    });
  }
});

/**
 * Apply referral code during registration
 * POST /api/referral/apply
 * Body: { referralCode: string }
 */
router.post('/apply', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { referralCode } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Referral code is required'
      });
    }

    const result = await ReferralService.registerWithReferral(userId, referralCode);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply referral code'
    });
  }
});

/**
 * Get referral bonus structure info
 * GET /api/referral/info
 */
router.get('/info', async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      title: 'Referral Bonus Program',
      description: 'Earn coins when your friends make deposits!',
      bonusStructure: [
        {
          deposit: '1st Deposit',
          bonus: '5%',
          example: 'Friend deposits ₹1000 → You get 50 coins'
        },
        {
          deposit: '2nd Deposit',
          bonus: '2%',
          example: 'Friend deposits ₹2000 → You get 40 coins'
        },
        {
          deposit: '3rd Deposit',
          bonus: '1%',
          example: 'Friend deposits ₹3000 → You get 30 coins'
        }
      ],
      howItWorks: [
        'Share your unique referral code with friends',
        'Friends sign up using your code',
        'When they make deposits, you earn bonuses automatically',
        'Bonuses are credited to your real balance instantly',
        'Track all your referral earnings in History'
      ],
      terms: [
        'Bonuses apply only to first 3 deposits per referred user',
        'Minimum deposit amount may apply',
        'Bonuses are added to real coins balance',
        'Cannot use your own referral code'
      ]
    }
  });
});

export default router;

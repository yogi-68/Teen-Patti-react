import express, { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { User } from '../models/User.model';

const router = express.Router();

/**
 * POST /api/transactions/request
 * User requests a deposit or withdrawal
 */
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, type, amount, paymentMethod, upiId, accountNumber, remarks } = req.body;

    if (!userId || !type || !amount) {
      res.status(400).json({ error: 'User ID, transaction type, and amount are required' });
      return;
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      res.status(400).json({ error: 'Invalid transaction type' });
      return;
    }

    if (amount < 10) {
      res.status(400).json({ error: 'Minimum transaction amount is ₹10' });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user is subscribed
    if (!user.isSubscribed) {
      res.status(403).json({ 
        error: 'Wallet transactions are only available for subscribed users',
        message: 'Please request a subscription to access wallet features'
      });
      return;
    }

    // For withdrawals, check if user has sufficient balance
    if (type === 'withdrawal') {
      if (user.realCoins < amount) {
        res.status(400).json({ 
          error: 'Insufficient real coins balance',
          currentBalance: user.realCoins,
          requested: amount
        });
        return;
      }
    }

    // Create transaction request
    const transaction = new Transaction({
      userId: user._id,
      username: user.username,
      type,
      amount,
      status: 'pending',
      paymentMethod,
      upiId,
      accountNumber,
      remarks: remarks || '',
    });

    await transaction.save();

    res.status(201).json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} request submitted successfully`,
      transaction,
    });
  } catch (error: any) {
    console.error('Error creating transaction request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/transactions/user/:userId
 * Get user's transaction history
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const status = req.query.status as string;

    const filter: any = { userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

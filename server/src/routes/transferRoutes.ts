import { Router, Request, Response } from 'express';
import { User } from '../models/User.model.js';
import TransactionHistoryService from '../services/TransactionHistoryService.js';

const router = Router();

/**
 * POST /api/transfer
 * Transfer trial to another user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fromUserId, toUsername, amount } = req.body;

    // Validate inputs
    if (!fromUserId || !toUsername || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: fromUserId, toUsername, amount' 
      });
    }

    // Round amount to 2 decimal places
    const transferAmount = Math.round(parseFloat(amount) * 100) / 100;

    if (transferAmount <= 0) {
      return res.status(400).json({ 
        error: 'Transfer amount must be greater than 0' 
      });
    }

    // Get sender
    const sender = await User.findById(fromUserId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Check if sender has made first deposit
    if (!sender.hasMadeFirstDeposit) {
      return res.status(403).json({ 
        error: 'Transfer service is only available after your first deposit',
        requiresDeposit: true
      });
    }

    // Round balances to 2 decimal places for comparison
    const senderBalance = Math.round(sender.realToken * 100) / 100;

    // Check if sender has sufficient balance
    if (senderBalance < transferAmount) {
      return res.status(400).json({ 
        error: `Insufficient balance. You have ₹${senderBalance.toFixed(2)} but tried to transfer ₹${transferAmount.toFixed(2)}`,
        currentBalance: senderBalance
      });
    }

    // Get receiver by username
    const receiver = await User.findOne({ username: toUsername });
    if (!receiver) {
      return res.status(404).json({ 
        error: `User '${toUsername}' not found` 
      });
    }

    // Prevent self-transfer
    if (sender._id.toString() === receiver._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot transfer trial to yourself' 
      });
    }

    console.log(`\n💸 Processing transfer:`);
    console.log(`   From: ${sender.username} (₹${senderBalance.toFixed(2)})`);
    console.log(`   To: ${receiver.username} (₹${Math.round(receiver.realToken * 100) / 100})`);
    console.log(`   Amount: ₹${transferAmount.toFixed(2)}`);

    // Deduct from sender with decimal precision
    sender.realToken = Math.round((senderBalance - transferAmount) * 100) / 100;
    await sender.save();

    // Add to receiver with decimal precision
    const receiverBalance = Math.round(receiver.realToken * 100) / 100;
    receiver.realToken = Math.round((receiverBalance + transferAmount) * 100) / 100;
    await receiver.save(); // Fixed: was saving sender instead of receiver

    // Log transfer for sender (SENT)
    await TransactionHistoryService.logTransferSent(
      sender._id.toString(),
      receiver._id.toString(),
      transferAmount
    );

    // Log transfer for receiver (RECEIVED)
    await TransactionHistoryService.logTransferReceived(
      receiver._id.toString(),
      sender._id.toString(),
      transferAmount
    );

    console.log(`   ✅ Transfer complete!`);
    console.log(`   Sender new balance: ₹${sender.realToken.toFixed(2)}`);
    console.log(`   Receiver new balance: ₹${receiver.realToken.toFixed(2)}\n`);

    res.json({
      success: true,
      message: `Successfully transferred ₹${transferAmount.toFixed(2)} to ${receiver.username}`,
      newBalance: sender.realToken,
      transfer: {
        amount,
        to: receiver.username,
        from: sender.username,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({ 
      error: 'Failed to process transfer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/transfer/check/:userId
 * Check if user can transfer (has made first deposit)
 */
router.get('/check/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      canTransfer: user.hasMadeFirstDeposit,
      hasMadeFirstDeposit: user.hasMadeFirstDeposit,
      realToken: user.realToken,
      message: user.hasMadeFirstDeposit 
        ? 'Transfer service is available'
        : 'Transfer service requires at least one deposit'
    });

  } catch (error) {
    console.error('Error checking transfer eligibility:', error);
    res.status(500).json({ error: 'Failed to check transfer eligibility' });
  }
});

export default router;

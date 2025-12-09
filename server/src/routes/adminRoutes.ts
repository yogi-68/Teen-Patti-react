import express from 'express';
import { User } from '../models/User.model.js';
import { Transaction } from '../models/Transaction.model.js';
import { SubscriptionRequest } from '../models/SubscriptionRequest.model.js';
import { Settings } from '../models/Settings.model.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';
import AnalyticsService from '../services/AnalyticsService.js';
import ReferralService from '../services/ReferralService.js';
import TransactionHistoryService from '../services/TransactionHistoryService.js';
import tipService from '../services/TipService.js';

const router = express.Router();

// Apply authentication and admin verification to all routes
router.use(authenticate);
router.use(verifyAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeGames = 0; // TODO: Implement from game service
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      activeGames,
      pendingTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalWithdrawals: totalWithdrawals[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
/**
 * GET /api/admin/users
 * Get all users with pagination and search (excludes deleted users)
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    
    const query: any = { isDeleted: { $ne: true } }; // Exclude deleted users
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get single user details
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's transaction history
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, transactions });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * PATCH /api/admin/users/:userId
 * Update user details (coins, token balance, admin status)
 */
router.patch('/users/:userId', async (req, res) => {
  try {
    const { coins, tokenBalance, isAdmin } = req.body;
    const updates: any = {};

    if (typeof coins === 'number') updates.coins = Math.max(0, Math.min(100, coins));
    if (typeof tokenBalance === 'number') updates.tokenBalance = Math.max(0, tokenBalance);
    if (typeof isAdmin === 'boolean') updates.isAdmin = isAdmin;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account
 */
/**
 * DELETE /api/admin/users/:userId
 * Soft delete a user (marks as deleted but keeps all historical data)
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isDeleted: true, isBlocked: true }, // Also block the user
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully (data retained)', user });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * PUT /api/admin/users/:userId/block
 * Block a user from accessing the system
 */
router.put('/users/:userId/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

/**
 * PUT /api/admin/users/:userId/unblock
 * Unblock a user to restore access
 */
router.put('/users/:userId/unblock', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

/**
 * GET /api/admin/users/blocked/list
 * Get all blocked users
 */
router.get('/users/blocked/list', async (req, res) => {
  try {
    const blockedUsers = await User.find({ 
      isBlocked: true,
      isDeleted: { $ne: true } // Exclude deleted users
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users: blockedUsers, total: blockedUsers.length });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

/**
 * GET /api/admin/transactions
 * Get all transactions with filters
 */
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * PATCH /api/admin/transactions/:transactionId/approve
 * Approve a transaction
 */
router.patch('/transactions/:transactionId/approve', async (req, res) => {
  try {
    console.log(`[TRANSACTION APPROVE] Starting approval for transaction ID: ${req.params.transactionId}`);
    
    const transaction = await Transaction.findById(req.params.transactionId);
    
    if (!transaction) {
      console.error(`[TRANSACTION APPROVE] Transaction not found: ${req.params.transactionId}`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log(`[TRANSACTION APPROVE] Transaction found. Status: ${transaction.status}, Type: ${transaction.type}`);

    if (transaction.status !== 'pending') {
      console.warn(`[TRANSACTION APPROVE] Transaction already processed with status: ${transaction.status}`);
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Update transaction status
    transaction.status = 'approved';
    transaction.adminId = req.userId;
    
    const admin = await User.findById(req.userId);
    transaction.adminUsername = admin?.username || 'Unknown';

    // Update user's real trial balance
    console.log(`[TRANSACTION APPROVE] Looking up user with ID: ${transaction.userId}`);
    const user = await User.findById(transaction.userId);
    if (!user) {
      console.error(`[TRANSACTION APPROVE] User not found: ${transaction.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`[TRANSACTION APPROVE] User found: ${user.username}, Current balance: ₹${user.realToken}`);

    if (transaction.type === 'deposit') {
      console.log(`[TRANSACTION APPROVE] Processing DEPOSIT`);
      // Round amounts to 2 decimal places
      const depositAmount = Math.round(transaction.amount * 100) / 100;
      const balanceBefore = Math.round((user.realToken || 0) * 100) / 100; // Save balance BEFORE deposit
      
      user.realToken = balanceBefore + depositAmount;
      user.totalDeposited = Math.round((user.totalDeposited || 0) * 100) / 100 + depositAmount;
      
      // Set first deposit flag
      if (!user.hasMadeFirstDeposit) {
        user.hasMadeFirstDeposit = true;
      }
      
      console.log(`[TRANSACTION APPROVE] Saving transaction and user...`);
      transaction.processedDate = new Date();
      await transaction.save();
      console.log(`[TRANSACTION APPROVE] Transaction saved successfully`);
      await user.save();
      console.log(`[TRANSACTION APPROVE] User saved successfully`);

      const balanceAfter = user.realToken; // Get balance AFTER deposit

      // Log deposit in transaction history with correct balances
      console.log(`[TRANSACTION APPROVE] Logging transaction history...`);
      try {
        await TransactionHistoryService.logDepositWithBalances(
          user._id.toString(),
          depositAmount,
          transaction.mobile || 'unknown',
          transaction._id.toString(),
          balanceBefore,
          balanceAfter
        );
        console.log(`[TRANSACTION APPROVE] Transaction history logged successfully`);
      } catch (historyError: any) {
        console.error(`[TRANSACTION APPROVE] Failed to log transaction history:`, historyError.message);
        // Continue even if history logging fails
      }
      
      console.log(`\n💰 Deposit approved for ${user.username}:`);
      console.log(`   - Amount: ₹${depositAmount.toFixed(2)}`);
      console.log(`   - New balance: ₹${user.realToken.toFixed(2)}`);

      // Process referral bonus if user was referred
      try {
        console.log(`   - Checking for referral bonus...`);
        const result = await ReferralService.processDepositBonus(user._id.toString(), depositAmount);
        if (result.bonusProcessed) {
          console.log(`   ✅ Referral bonus of ₹${result.bonusAmount} awarded to referrer ${result.referrerId}`);
        } else {
          console.log(`   ℹ️  No referral bonus processed (user not referred or bonus limit reached)`);
        }
      } catch (referralError) {
        console.error('❌ Error processing referral bonus:', referralError);
        // Don't fail the deposit if referral processing fails
      }

      res.json({ message: 'Deposit approved successfully', transaction });
    } else if (transaction.type === 'withdrawal') {
      // Fetch withdrawal commission setting
      const commissionSetting = await Settings.findOne({ key: 'withdrawalCommission' });
      const commissionPercentage = commissionSetting?.value || 0; // Default 0% if not set
      
      // Round amounts to 2 decimal places
      const withdrawalAmount = Math.round(transaction.amount * 100) / 100;
      const currentBalance = Math.round((user.realToken || 0) * 100) / 100;
      
      // Check if user has sufficient balance
      if (currentBalance < withdrawalAmount) {
        transaction.status = 'rejected';
        transaction.adminRemarks = 'Insufficient balance - Transaction failed';
        transaction.processedDate = new Date();
        await transaction.save();
        return res.status(400).json({ 
          error: 'Transaction failed: Insufficient balance',
          message: 'User does not have enough real trial for this withdrawal',
          transaction 
        });
      }
      
      // Calculate commission
      const commissionAmount = Math.round(withdrawalAmount * (commissionPercentage / 100) * 100) / 100;
      const userReceivesAmount = Math.round((withdrawalAmount - commissionAmount) * 100) / 100;
      
      // Deduct full amount from user (what they requested)
      user.realToken = Math.round((currentBalance - withdrawalAmount) * 100) / 100;
      
      // Store commission info in transaction
      transaction.adminRemarks = commissionPercentage > 0 
        ? `Approved. User receives ₹${userReceivesAmount} (Commission: ₹${commissionAmount}, ${commissionPercentage}%)`
        : 'Approved';
      
      transaction.processedDate = new Date();
      await transaction.save();
      await user.save();

      // Log withdrawal in transaction history
      await TransactionHistoryService.logWithdrawal(
        user._id.toString(),
        withdrawalAmount,
        transaction.mobile || 'unknown',
        transaction._id.toString()
      );
      
      console.log(`💸 Withdrawal approved for ${user.username}:`);
      console.log(`   Requested: ₹${withdrawalAmount}`);
      console.log(`   Commission (${commissionPercentage}%): ₹${commissionAmount}`);
      console.log(`   User receives: ₹${userReceivesAmount}`);
      console.log(`   Balance after: ₹${user.realToken}`);

      res.json({ 
        message: 'Withdrawal approved successfully', 
        transaction,
        details: {
          requestedAmount: withdrawalAmount,
          commissionPercentage,
          commissionAmount,
          userReceivesAmount
        }
      });
    }
  } catch (error: any) {
    console.error('[TRANSACTION APPROVE ERROR] Full error details:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    console.error('  Error object:', error);
    res.status(500).json({ 
      error: 'Failed to approve transaction',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * PATCH /api/admin/transactions/:transactionId/reject
 * Reject a transaction
 */
router.patch('/transactions/:transactionId/reject', async (req, res) => {
  try {
    const { remarks } = req.body;
    
    const transaction = await Transaction.findById(req.params.transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    transaction.status = 'rejected';
    transaction.adminId = req.userId;
    
    const admin = await User.findById(req.userId);
    transaction.adminUsername = admin?.username || 'Unknown';
    transaction.remarks = remarks || 'Rejected by admin';
    
    await transaction.save();

    res.json({ message: 'Transaction rejected successfully', transaction });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

/**
 * GET /api/admin/subscription-requests
 * Get all subscription requests with optional status filter
 */
router.get('/subscription-requests', async (req, res) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await SubscriptionRequest.find(filter)
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SubscriptionRequest.countDocuments(filter);
    const pendingCount = await SubscriptionRequest.countDocuments({ status: 'pending' });

    res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching subscription requests:', error);
    res.status(500).json({ error: 'Failed to fetch subscription requests' });
  }
});

/**
 * PATCH /api/admin/subscription-requests/:id/approve
 * Approve a subscription request
 */
router.patch('/subscription-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { initialRealToken, adminNote } = req.body;

    const request = await SubscriptionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Subscription request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update user to subscribed status
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isSubscribed = true;
    user.subscriptionDate = new Date();
    
    // Generate 4-digit PIN for token transfers if not already set
    if (!user.transferPin) {
      user.transferPin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    
    // Credit initial real trial if provided
    if (initialRealToken && initialRealToken > 0) {
      user.realToken = initialRealToken;
    }

    await user.save();

    // Update request status
    request.status = 'approved';
    request.processedDate = new Date();
    request.processedBy = req.userId;
    request.adminNote = adminNote || 'Approved';

    await request.save();

    console.log(`✅ Subscription approved for ${user.username}`);
    console.log(`🔐 Transfer PIN generated: ${user.transferPin}`);

    res.json({
      message: 'Subscription request approved successfully',
      request,
      user: {
        id: user._id,
        username: user.username,
        isSubscribed: user.isSubscribed,
        realToken: user.realToken,
        transferPin: user.transferPin, // Send PIN to admin to inform user
      },
    });
  } catch (error) {
    console.error('Error approving subscription request:', error);
    res.status(500).json({ error: 'Failed to approve subscription request' });
  }
});

/**
 * PATCH /api/admin/subscription-requests/:id/reject
 * Reject a subscription request
 */
router.patch('/subscription-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const request = await SubscriptionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Subscription request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    request.status = 'rejected';
    request.processedDate = new Date();
    request.processedBy = req.userId;
    request.adminNote = adminNote || 'Rejected';

    await request.save();

    res.json({
      message: 'Subscription request rejected successfully',
      request,
    });
  } catch (error) {
    console.error('Error rejecting subscription request:', error);
    res.status(500).json({ error: 'Failed to reject subscription request' });
  }
});

/**
 * DELETE /api/admin/subscription-requests/:userId/clear-pending
 * Clear phantom pending subscription requests for a user
 */
router.delete('/subscription-requests/:userId/clear-pending', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and delete all pending requests for this user
    const result = await SubscriptionRequest.deleteMany({
      userId,
      status: 'pending',
    });


    res.json({
      message: `Cleared ${result.deletedCount} pending request(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing pending requests:', error);
    res.status(500).json({ error: 'Failed to clear pending requests' });
  }
});

/**
 * GET /api/admin/analytics/system
 * Get system-wide bot analytics
 */
router.get('/analytics/system', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getSystemAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({ error: 'Failed to fetch system analytics' });
  }
});

/**
 * GET /api/admin/analytics/table/:tableId
 * Get analytics for a specific table
 */
router.get('/analytics/table/:tableId', async (req, res) => {
  try {
    const tableId = parseInt(req.params.tableId);
    if (isNaN(tableId)) {
      return res.status(400).json({ error: 'Invalid table ID' });
    }

    const analytics = await AnalyticsService.getTableAnalytics(tableId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching table analytics:', error);
    res.status(500).json({ error: 'Failed to fetch table analytics' });
  }
});

/**
 * GET /api/admin/analytics/win-rates
 * Get win rate analysis for all bots
 */
router.get('/analytics/win-rates', async (req, res) => {
  try {
    const analysis = await AnalyticsService.getWinRateAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching win rate analysis:', error);
    res.status(500).json({ error: 'Failed to fetch win rate analysis' });
  }
});

/**
 * GET /api/admin/analytics/anomalies
 * Get bots with suspicious activity
 */
router.get('/analytics/anomalies', async (req, res) => {
  try {
    const anomalies = await AnalyticsService.detectAnomalies();
    res.json(anomalies);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

/**
 * GET /api/admin/analytics/suspicious
 * Get suspicious bots requiring review
 */
router.get('/analytics/suspicious', async (req, res) => {
  try {
    const suspicious = await AnalyticsService.getSuspiciousBots();
    res.json(suspicious);
  } catch (error) {
    console.error('Error fetching suspicious bots:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious bots' });
  }
});

/**
 * GET /api/admin/analytics/performance
 * Get performance metrics for monitoring
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

/**
 * GET /api/admin/tips
 * Get all tips for admin panel
 */
router.get('/tips', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const tips = await tipService.getAllTips(limit);
    res.json(tips);
  } catch (error) {
    console.error('Error fetching tips:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

/**
 * GET /api/admin/earnings
 * Get admin earnings from tips and commissions
 */
router.get('/earnings', async (req, res) => {
  try {
    const earnings = await tipService.getAdminEarnings();
    res.json(earnings);
  } catch (error) {
    console.error('Error fetching admin earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

export default router;

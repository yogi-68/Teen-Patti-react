import express from 'express';
import { User } from '../models/User.model.js';
import { Transaction } from '../models/Transaction.model.js';
import { SubscriptionRequest } from '../models/SubscriptionRequest.model.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';
import AnalyticsService from '../services/AnalyticsService.js';
import ReferralService from '../services/ReferralService.js';
import TransactionHistoryService from '../services/TransactionHistoryService.js';

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
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    
    const query = search 
      ? { 
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

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
 * Update user details (coins, cash balance, admin status)
 */
router.patch('/users/:userId', async (req, res) => {
  try {
    const { coins, cashBalance, isAdmin } = req.body;
    const updates: any = {};

    if (typeof coins === 'number') updates.coins = Math.max(0, Math.min(100, coins));
    if (typeof cashBalance === 'number') updates.cashBalance = Math.max(0, cashBalance);
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
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
    const transaction = await Transaction.findById(req.params.transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Update transaction status
    transaction.status = 'approved';
    transaction.adminId = req.userId;
    
    const admin = await User.findById(req.userId);
    transaction.adminUsername = admin?.username || 'Unknown';

    // Update user's real coin balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (transaction.type === 'deposit') {
      user.realCoins = (user.realCoins || 0) + transaction.amount;
      user.totalDeposited = (user.totalDeposited || 0) + transaction.amount;
      
      // Set first deposit flag
      if (!user.hasMadeFirstDeposit) {
        user.hasMadeFirstDeposit = true;
      }
      
      transaction.processedDate = new Date();
      await transaction.save();
      await user.save();

      // Log deposit in transaction history
      await TransactionHistoryService.logDeposit(
        user._id.toString(),
        transaction.amount,
        transaction.paymentMethod || 'unknown',
        transaction._id.toString()
      );

      // Process referral bonus if user was referred
      try {
        await ReferralService.processDepositBonus(user._id.toString(), transaction.amount);
      } catch (referralError) {
        console.error('Error processing referral bonus:', referralError);
        // Don't fail the deposit if referral processing fails
      }

      res.json({ message: 'Deposit approved successfully', transaction });
    } else if (transaction.type === 'withdrawal') {
      // Check if user has sufficient balance
      if ((user.realCoins || 0) < transaction.amount) {
        transaction.status = 'rejected';
        transaction.adminRemarks = 'Insufficient balance - Transaction failed';
        transaction.processedDate = new Date();
        await transaction.save();
        return res.status(400).json({ 
          error: 'Transaction failed: Insufficient balance',
          message: 'User does not have enough real coins for this withdrawal',
          transaction 
        });
      }
      
      user.realCoins = (user.realCoins || 0) - transaction.amount;
      transaction.processedDate = new Date();
      await transaction.save();
      await user.save();

      // Log withdrawal in transaction history
      await TransactionHistoryService.logWithdrawal(
        user._id.toString(),
        transaction.amount,
        transaction.paymentMethod || 'unknown',
        transaction._id.toString()
      );

      res.json({ message: 'Withdrawal approved successfully', transaction });
    }
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({ error: 'Failed to approve transaction' });
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
    const { initialRealCoins, adminNote } = req.body;

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
    
    // Credit initial real coins if provided
    if (initialRealCoins && initialRealCoins > 0) {
      user.realCoins = initialRealCoins;
    }

    await user.save();

    // Update request status
    request.status = 'approved';
    request.processedDate = new Date();
    request.processedBy = req.userId;
    request.adminNote = adminNote || 'Approved';

    await request.save();

    res.json({
      message: 'Subscription request approved successfully',
      request,
      user: {
        id: user._id,
        username: user.username,
        isSubscribed: user.isSubscribed,
        realCoins: user.realCoins,
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

export default router;

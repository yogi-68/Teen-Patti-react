import express from 'express';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { authenticate, verifyAdmin } from '../middleware/adminAuth';

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
    
    await transaction.save();

    // Update user's cash balance
    const user = await User.findById(transaction.userId);
    if (user) {
      if (transaction.type === 'deposit') {
        user.cashBalance += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        user.cashBalance -= transaction.amount;
      }
      await user.save();
    }

    res.json({ message: 'Transaction approved successfully', transaction });
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

export default router;

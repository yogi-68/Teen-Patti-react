import { Router, Request, Response } from 'express';
import { userRepository } from '../repositories/UserRepository.js';

const router = Router();

/**
 * GET /api/users/:userId
 * Get user by ID
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users/login
 * Login or create user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    
    console.log('🔄 Login/Register request received:', { username, email });
    
    if (!username) {
      console.log('❌ Username missing');
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log('📦 Finding or creating user in database...');
    const user = await userRepository.findOrCreate(username, email);
    
    console.log('✅ User created/found:', {
      id: user._id,
      username: user.username,
      coins: user.coins,
      cashBalance: user.cashBalance
    });
    
    res.json({ 
      user,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('❌ Error logging in:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/users/:userId/stats
 * Get user stats
 */
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await userRepository.getUserStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/users/:userId/cash/add
 * Add cash to user balance
 */
router.post('/:userId/cash/add', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const result = await userRepository.addCash(userId, amount);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      user: result.user,
      message: `₹${amount} added successfully` 
    });
  } catch (error) {
    console.error('Error adding cash:', error);
    res.status(500).json({ error: 'Failed to add cash' });
  }
});

/**
 * POST /api/users/:userId/coins/update
 * Update coins (for game wins/losses)
 */
router.post('/:userId/coins/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updateCoins(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error updating coins:', error);
    res.status(500).json({ error: 'Failed to update coins' });
  }
});

/**
 * POST /api/users/:userId/cash/update
 * Update cash balance (for game wins/losses)
 */
router.post('/:userId/cash/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updateCashBalance(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error updating cash:', error);
    res.status(500).json({ error: 'Failed to update cash' });
  }
});

export default router;

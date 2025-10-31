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
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('🔄 Register request received:', { username, email });
    
    if (!username || !password || !email) {
      console.log('❌ Required fields missing');
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    console.log('📦 Creating new user in database...');
    const user = await userRepository.register(username, email, password);
    
    console.log('✅ User registered:', {
      id: user._id,
      username: user.username,
      coins: user.coins,
      cashBalance: user.cashBalance
    });
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      cashBalance: user.cashBalance,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({ 
      user: userResponse,
      message: 'Registration successful' 
    });
  } catch (error: any) {
    console.error('❌ Error registering:', error);
    if (error.message === 'Username already exists' || error.message === 'Email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/users/login
 * Login with username/email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔄 Login request received:', { username });
    
    if (!username || !password) {
      console.log('❌ Username/email or password missing');
      return res.status(400).json({ error: 'Username/email and password are required' });
    }
    
    console.log('📦 Verifying user credentials...');
    const user = await userRepository.login(username, password);
    
    if (!user) {
      console.log('❌ Invalid credentials');
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }
    
    console.log('✅ User logged in:', {
      id: user._id,
      username: user.username,
      coins: user.coins,
      cashBalance: user.cashBalance
    });
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      cashBalance: user.cashBalance,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ 
      user: userResponse,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('❌ Error logging in:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/users/guest
 * Guest login (no password required) - for quick play
 */
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    console.log('🔄 Guest login request received:', { username });
    
    if (!username) {
      console.log('❌ Username missing');
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log('📦 Finding or creating guest user...');
    const user = await userRepository.findOrCreate(username);
    
    console.log('✅ Guest user created/found:', {
      id: user._id,
      username: user.username,
      coins: user.coins,
      cashBalance: user.cashBalance
    });
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      cashBalance: user.cashBalance,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ 
      user: userResponse,
      message: 'Guest login successful' 
    });
  } catch (error) {
    console.error('❌ Error with guest login:', error);
    res.status(500).json({ error: 'Guest login failed' });
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

import { Router, Request, Response } from 'express';
import { userRepository } from '../repositories/UserRepository.js';
import { AppError, ErrorMessages, ErrorCodes, validate, asyncHandler } from '../middleware/errorHandler.js';

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
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins,
      hasSeenTour: user.hasSeenTour,
      referralCode: user.referralCode // Include referral code in response
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  
  // Validate required fields
  const validationError = validate.required({ username, email, password });
  if (validationError) {
    throw new AppError(ErrorMessages.REQUIRED_FIELDS, 400);
  }
  
  // Validate password length
  if (!validate.passwordLength(password, 6)) {
    throw new AppError(ErrorMessages.PASSWORD_TOO_SHORT, 400);
  }
  
  // Validate email format
  if (!validate.email(email)) {
    throw new AppError(ErrorMessages.INVALID_EMAIL, 400);
  }
  
  
  try {
    const user = await userRepository.register(username, email, password);
    
      id: user._id,
      username: user.username,
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins
    });
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins,
      hasSeenTour: user.hasSeenTour
    };
    
    res.status(201).json({ 
      user: userResponse,
      message: 'Registration successful' 
    });
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      throw new AppError(ErrorMessages.USERNAME_EXISTS, 409);
    }
    if (error.message === 'Email already exists') {
      throw new AppError(ErrorMessages.EMAIL_EXISTS, 409);
    }
    throw error;
  }
}));

/**
 * POST /api/users/login
 * Login with username/email and password
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  
  // Validate required fields
  const validationError = validate.required({ username, password });
  if (validationError) {
    throw new AppError(ErrorMessages.REQUIRED_FIELDS, 400);
  }
  
  const user = await userRepository.login(username, password);
  
  if (!user) {
    throw new AppError(ErrorMessages.INVALID_CREDENTIALS, 401);
  }
  
    id: user._id,
    username: user.username,
    practiceCoins: user.practiceCoins,
    realCoins: user.realCoins
  });
  
  // Don't send password in response
  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    isSubscribed: user.isSubscribed,
    practiceCoins: user.practiceCoins,
    realCoins: user.realCoins,
    hasSeenTour: user.hasSeenTour
  };
  
  res.json({ 
    user: userResponse,
    message: 'Login successful' 
  });
}));

/**
 * POST /api/users/guest
 * Guest login (no password required) - for quick play
 */
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const user = await userRepository.findOrCreate(username);
    
      id: user._id,
      username: user.username,
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins
    });
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins,
      hasSeenTour: user.hasSeenTour
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
 * PATCH /api/users/:userId/tour-completed
 * Mark that user has completed the tour
 */
router.patch('/:userId/tour-completed', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  user.hasSeenTour = true;
  await user.save();
  
  res.json({ 
    success: true, 
    message: 'Tour completed' 
  });
}));

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
 * POST /api/users/:userId/practice-coins/update
 * Update practice coins (for game wins/losses in practice mode)
 */
router.post('/:userId/practice-coins/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updatePracticeCoins(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins
    });
  } catch (error) {
    console.error('Error updating practice coins:', error);
    res.status(500).json({ error: 'Failed to update practice coins' });
  }
});

/**
 * POST /api/users/:userId/real-coins/update
 * Update real coins (for game wins/losses in real mode)
 */
router.post('/:userId/real-coins/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updateRealCoins(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins
    });
  } catch (error) {
    console.error('Error updating real coins:', error);
    res.status(500).json({ error: 'Failed to update real coins' });
  }
});

/**
 * POST /api/users/change-email
 * Change user email address
 */
router.post('/change-email', asyncHandler(async (req: Request, res: Response) => {
  const { userId, newEmail, currentPassword } = req.body;
  
  // Validate required fields
  const validationError = validate.required({ userId, newEmail, currentPassword });
  if (validationError) {
    throw new AppError(ErrorMessages.REQUIRED_FIELDS, 400);
  }
  
  // Validate email format
  if (!validate.email(newEmail)) {
    throw new AppError(ErrorMessages.INVALID_EMAIL, 400);
  }
  
  // Verify current password
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError(ErrorMessages.INCORRECT_PASSWORD, 401);
  }
  
  // Check if email already exists
  const existingUser = await userRepository.findByEmail(newEmail);
  if (existingUser && existingUser._id.toString() !== userId) {
    throw new AppError(ErrorMessages.EMAIL_EXISTS, 409);
  }
  
  // Update email
  const updatedUser = await userRepository.updateProfile(userId, { email: newEmail });
  
  if (!updatedUser) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  
  res.json({
    message: 'Email updated successfully',
    user: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
    },
  });
}));

/**
 * POST /api/users/change-password
 * Change user password
 */
router.post('/change-password', asyncHandler(async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  // Validate required fields
  const validationError = validate.required({ userId, currentPassword, newPassword });
  if (validationError) {
    throw new AppError(ErrorMessages.REQUIRED_FIELDS, 400);
  }
  
  // Validate password length
  if (!validate.passwordLength(newPassword, 6)) {
    throw new AppError(ErrorMessages.PASSWORD_TOO_SHORT, 400);
  }
  
  // Verify current password
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError(ErrorMessages.INCORRECT_PASSWORD, 401);
  }
  
  // Update password
  await userRepository.updatePassword(userId, newPassword);
  
  
  res.json({
    message: 'Password updated successfully',
  });
}));

export default router;


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
      practiceTrial: user.practiceTrial,
      realToken: user.realToken,
      hasSeenTour: user.hasSeenTour,
      tutorialCompleted: user.tutorialCompleted,
      hasMadeFirstDeposit: user.hasMadeFirstDeposit || false,
      createdAt: user.createdAt,
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
  const { username, email, password, referralCode } = req.body;
  
  
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
    const user = await userRepository.register(username, email, password, referralCode);
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
      practiceTrial: user.practiceTrial,
      realToken: user.realToken,
      hasSeenTour: user.hasSeenTour,
      tutorialCompleted: user.tutorialCompleted
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
  
  // Check if user is blocked
  if (user.isBlocked) {
    throw new AppError('Your account has been blocked by the administrator.', 403);
  }
  
  // Don't send password in response
  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    isSubscribed: user.isSubscribed,
    practiceTrial: user.practiceTrial,
    realToken: user.realToken,
    hasSeenTour: user.hasSeenTour,
    tutorialCompleted: user.tutorialCompleted,
    createdAt: user.createdAt
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
    
    // Don't send password in response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
      practiceTrial: user.practiceTrial,
      realToken: user.realToken,
      hasSeenTour: user.hasSeenTour,
      tutorialCompleted: user.tutorialCompleted
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
 * PATCH /api/users/:userId/tutorial-completed
 * Mark that user has completed the mobile app tutorial
 */
router.patch('/:userId/tutorial-completed', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  user.tutorialCompleted = true;
  await user.save();
  
  res.json({ 
    success: true, 
    message: 'Tutorial completed' 
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
 * POST /api/users/:userId/practice-trial/update
 * Update practice trial (for game wins/losses in practice mode)
 */
router.post('/:userId/practice-trial/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updatePracticeTrial(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      practiceTrial: user.practiceTrial,
      realToken: user.realToken
    });
  } catch (error) {
    console.error('Error updating practice trial:', error);
    res.status(500).json({ error: 'Failed to update practice trial' });
  }
});

/**
 * POST /api/users/:userId/real-token/update
 * Update real trial (for game wins/losses in real mode)
 */
router.post('/:userId/real-token/update', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const user = await userRepository.updateRealToken(userId, amount);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      practiceTrial: user.practiceTrial,
      realToken: user.realToken
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

/**
 * POST /api/users/:userId/generate-referral-code
 * Generate or retrieve referral code for a user
 */
router.post('/:userId/generate-referral-code', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  // If user already has a referral code, return it
  if (user.referralCode) {
    return res.json({
      referralCode: user.referralCode,
      message: 'Referral code already exists'
    });
  }
  
  // Generate new referral code
  // The code will be auto-generated by the model's pre-save hook
  // We just need to trigger a save
  await user.save();
  
  res.json({
    referralCode: user.referralCode,
    message: 'Referral code generated successfully'
  });
}));

export default router;


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
  const { username, email, mobile, password, referralCode } = req.body;
  
  
  // Validate required fields
  const validationError = validate.required({ username, email, mobile, password });
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
  
  // Validate mobile format (10 digits)
  if (!/^[0-9]{10}$/.test(mobile)) {
    throw new AppError('Mobile number must be 10 digits', 400);
  }
  
  
  try {
    const user = await userRepository.register(username, email, mobile, password, referralCode);
    
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
    if (error.message === 'Mobile number already exists') {
      throw new AppError('Mobile number is already registered', 409);
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

/**
 * GET /api/users/:userId/transfer-pin-status
 * Check if user has a transfer PIN
 */
router.get('/:userId/transfer-pin-status', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  res.json({
    hasPin: !!user.transferPin,
    isSubscribed: user.isSubscribed
  });
}));

/**
 * POST /api/users/transfer-tokens
 * Transfer tokens between users
 */
router.post('/transfer-tokens', asyncHandler(async (req: Request, res: Response) => {
  const { fromUserId, toUsername, amount, pin } = req.body;
  
  // Validate inputs
  if (!fromUserId || !toUsername || !amount || !pin) {
    throw new AppError('Missing required fields', 400);
  }
  
  if (amount <= 0) {
    throw new AppError('Transfer amount must be greater than 0', 400);
  }
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new AppError('PIN must be 4 digits', 400);
  }
  
  // Get sender
  const sender = await userRepository.findById(fromUserId);
  if (!sender) {
    throw new AppError('Sender not found', 404);
  }
  
  // Check if sender is subscribed
  if (!sender.isSubscribed) {
    throw new AppError('Token transfers require an active subscription', 403);
  }
  
  // Check if sender has PIN set
  if (!sender.transferPin) {
    throw new AppError('Transfer PIN not set. Please contact support.', 400);
  }
  
  // Verify PIN
  if (sender.transferPin !== pin) {
    throw new AppError('Incorrect PIN', 401);
  }
  
  // Check sender balance
  if (sender.realToken < amount) {
    throw new AppError('Insufficient balance', 400);
  }
  
  // Get recipient by username
  const recipient = await userRepository.findByUsername(toUsername);
  if (!recipient) {
    throw new AppError('Recipient not found', 404);
  }
  
  // Prevent self-transfer
  if (sender._id.toString() === recipient._id.toString()) {
    throw new AppError('Cannot transfer to yourself', 400);
  }
  
  // Perform transfer
  sender.realToken -= amount;
  recipient.realToken += amount;
  
  // Save transfer history
  if (!sender.transferHistory) sender.transferHistory = [];
  if (!recipient.transferHistory) recipient.transferHistory = [];
  
  const timestamp = new Date();
  
  sender.transferHistory.push({
    type: 'sent',
    toUserId: recipient._id.toString(),
    toUsername: recipient.username,
    amount,
    timestamp
  });
  
  recipient.transferHistory.push({
    type: 'received',
    fromUserId: sender._id.toString(),
    fromUsername: sender.username,
    amount,
    timestamp
  });
  
  await sender.save();
  await recipient.save();
  
  res.json({
    success: true,
    message: `Successfully transferred ₹${amount} to ${toUsername}`,
    newBalance: sender.realToken
  });
}));

/**
 * GET /api/users/:userId/transfer-history
 * Get token transfer history for a user
 */
router.get('/:userId/transfer-history', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  const history = user.transferHistory || [];
  
  // Sort by timestamp descending (newest first)
  const sortedHistory = history.sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  res.json({
    success: true,
    history: sortedHistory
  });
}));

/**
 * GET /api/users/:userId/transfer-pin
 * Get transfer PIN (admin only or user verification)
 */
router.get('/:userId/transfer-pin', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  if (!user.isSubscribed) {
    throw new AppError('Transfer PIN is only available for subscribed users', 403);
  }
  
  res.json({
    success: true,
    pin: user.transferPin,
    hasPin: !!user.transferPin
  });
}));

/**
 * POST /api/users/:userId/reset-transfer-pin
 * Reset transfer PIN (generates new 4-digit PIN)
 */
router.post('/:userId/reset-transfer-pin', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currentPin } = req.body;
  
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  if (!user.isSubscribed) {
    throw new AppError('PIN reset is only available for subscribed users', 403);
  }
  
  // Verify current PIN before resetting
  if (user.transferPin && user.transferPin !== currentPin) {
    throw new AppError('Current PIN is incorrect', 401);
  }
  
  // Generate new 4-digit PIN
  user.transferPin = Math.floor(1000 + Math.random() * 9000).toString();
  await user.save();
  
  res.json({
    success: true,
    message: 'Transfer PIN has been reset successfully',
    newPin: user.transferPin
  });
}));

/**
 * POST /api/users/:userId/create-transfer-pin
 * Create transfer PIN for user
 */
router.post('/:userId/create-transfer-pin', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { pin } = req.body;
  
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError(ErrorMessages.USER_NOT_FOUND, 404);
  }
  
  if (!user.isSubscribed) {
    throw new AppError('PIN creation is only available for subscribed users', 403);
  }
  
  if (user.transferPin) {
    throw new AppError('PIN already exists. Use reset-transfer-pin to change it.', 400);
  }
  
  // Validate PIN format (4 digits)
  if (!/^\d{4}$/.test(pin)) {
    throw new AppError('PIN must be exactly 4 digits', 400);
  }
  
  user.transferPin = pin;
  await user.save();
  
  res.json({
    success: true,
    message: 'Transfer PIN created successfully',
    hasPin: true
  });
}));

export default router;


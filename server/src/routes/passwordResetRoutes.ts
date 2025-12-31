import express, { Request, Response } from 'express';
import { PasswordResetRequest } from '../models/PasswordResetRequest.model.js';
import { User } from '../models/User.model.js';

const router = express.Router();

/**
 * POST /api/password-reset/request
 * User submits a password reset request
 */
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIdentifier, requestType = 'login' } = req.body;

    if (!userIdentifier) {
      res.status(400).json({ error: 'Email or username is required' });
      return;
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: userIdentifier.toLowerCase() },
        { username: userIdentifier }
      ]
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if there's already a pending request of the same type
    const existingRequest = await PasswordResetRequest.findOne({
      userId: user._id.toString(),
      requestType: requestType,
      status: 'pending'
    });

    if (existingRequest) {
      res.status(400).json({ error: `You already have a pending ${requestType} reset request` });
      return;
    }

    // Create new password reset request
    const resetRequest = new PasswordResetRequest({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      userIdentifier: userIdentifier,
      requestType: requestType,
      status: 'pending',
      requestDate: new Date(),
    });

    await resetRequest.save();

    res.status(200).json({
      success: true,
      message: 'Password reset request submitted successfully. Admin will review your request in the admin panel.',
      request: resetRequest
    });
  } catch (error) {
    console.error('Error creating password reset request:', error);
    res.status(500).json({ error: 'Failed to submit password reset request' });
  }
});

/**
 * GET /api/password-reset/requests
 * Admin: Get all password reset requests
 */
router.get('/requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await PasswordResetRequest.find(filter)
      .sort({ requestDate: -1 })
      .limit(100);

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({ error: 'Failed to fetch password reset requests' });
  }
});

/**
 * POST /api/password-reset/process
 * Admin: Process a password reset request (set new password)
 */
router.post('/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, newPassword, adminId, adminNote } = req.body;

    if (!requestId || !newPassword) {
      res.status(400).json({ error: 'Request ID and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Find the password reset request
    const resetRequest = await PasswordResetRequest.findById(requestId);

    if (!resetRequest) {
      res.status(404).json({ error: 'Password reset request not found' });
      return;
    }

    if (resetRequest.status !== 'pending') {
      res.status(400).json({ error: 'This request has already been processed' });
      return;
    }

    // Find the user
    const user = await User.findById(resetRequest.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user's password (User model will hash it automatically in pre-save hook)
    user.password = newPassword;
    await user.save();

    // Update the reset request
    resetRequest.status = 'completed';
    resetRequest.processedDate = new Date();
    resetRequest.processedBy = adminId || 'admin';
    resetRequest.adminNote = adminNote || '';
    await resetRequest.save();

    console.log(`✅ Password reset completed for user: ${user.username} (${user.email})`);
    console.log(`⚠️  Admin must manually email the new password to: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `Password has been reset successfully. Please manually email the new password to ${user.email}`,
      userEmail: user.email
    });
  } catch (error) {
    console.error('Error processing password reset:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/password-reset/reject
 * Admin: Reject a password reset request
 */
router.post('/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, adminId, adminNote } = req.body;

    if (!requestId) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const resetRequest = await PasswordResetRequest.findById(requestId);

    if (!resetRequest) {
      res.status(404).json({ error: 'Password reset request not found' });
      return;
    }

    if (resetRequest.status !== 'pending') {
      res.status(400).json({ error: 'This request has already been processed' });
      return;
    }

    resetRequest.status = 'rejected';
    resetRequest.processedDate = new Date();
    resetRequest.processedBy = adminId || 'admin';
    resetRequest.adminNote = adminNote || 'Request rejected';
    await resetRequest.save();

    res.status(200).json({
      success: true,
      message: 'Password reset request has been rejected'
    });
  } catch (error) {
    console.error('Error rejecting password reset:', error);
    res.status(500).json({ error: 'Failed to reject password reset request' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import { SubscriptionRequest } from '../models/SubscriptionRequest.model.js';
import { User } from '../models/User.model.js';

const router = express.Router();

/**
 * POST /api/subscription/request
 * User submits a subscription request
 */
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, message } = req.body;

    console.log('📩 Subscription request received:', { userId, message: message?.substring(0, 50) });

    if (!userId || !message) {
      console.log('❌ Missing userId or message');
      res.status(400).json({ error: 'User ID and message are required' });
      return;
    }

    // Get user details - handle both ObjectId and string userId
    let user;
    try {
      user = await User.findById(userId);
    } catch (error) {
      console.log('⚠️ Invalid userId format, trying to find by username:', userId);
      // If userId is not a valid ObjectId, try finding by username
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      console.log('❌ User not found:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('✅ User found:', { id: user._id, username: user.username, email: user.email });

    // Check if user is already subscribed
    if (user.isSubscribed) {
      console.log('⚠️ User is already subscribed');
      res.status(400).json({ error: 'User is already subscribed' });
      return;
    }

    // Check if there's already a pending request
    const existingRequest = await SubscriptionRequest.findOne({
      userId: user._id,
      status: 'pending',
    });

    if (existingRequest) {
      console.log('⚠️ User already has a pending request');
      res.status(400).json({ 
        error: 'You already have a pending subscription request',
        request: existingRequest 
      });
      return;
    }

    // Create new subscription request
    const subscriptionRequest = new SubscriptionRequest({
      userId: user._id,
      username: user.username,
      email: user.email,
      message: message.trim(),
      status: 'pending',
      requestDate: new Date(),
    });

    await subscriptionRequest.save();

    console.log('✅ Subscription request created:', subscriptionRequest._id);

    res.status(201).json({
      message: 'Subscription request submitted successfully',
      request: subscriptionRequest,
    });
  } catch (error: any) {
    console.error('❌ Error creating subscription request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/subscription/status/:userId
 * Get user's subscription request status
 */
router.get('/status/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get the latest request for this user
    const latestRequest = await SubscriptionRequest.findOne({ userId })
      .sort({ requestDate: -1 })
      .limit(1);

    res.json({
      isSubscribed: user.isSubscribed,
      subscriptionDate: user.subscriptionDate,
      latestRequest: latestRequest || null,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

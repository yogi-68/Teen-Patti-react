import express, { Request, Response } from 'express';
import { OTP } from '../models/OTP.model.js';
import { User } from '../models/User.model.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/otp/send-transfer-pin-reset
 * Send OTP for transfer PIN reset
 */
router.post('/send-transfer-pin-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIdentifier } = req.body;

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

    if (!user.isSubscribed) {
      res.status(403).json({ error: 'Transfer PIN is only available for subscribed users' });
      return;
    }

    // Delete any existing OTPs for this user and type
    await OTP.deleteMany({ userId: user._id.toString(), type: 'transfer-pin-reset' });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await OTP.create({
      userId: user._id.toString(),
      email: user.email,
      otp,
      type: 'transfer-pin-reset',
      expiresAt,
      verified: false,
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Transfer PIN Reset - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ffd700;">🔐 Transfer PIN Reset Request</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>You have requested to reset your transfer PIN. Use the following OTP to verify your identity:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent to ${user.email} for user ${user.username}`);

    res.status(200).json({
      success: true,
      message: `OTP has been sent to ${user.email}. Please check your email.`,
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

/**
 * POST /api/otp/verify-and-reset-pin
 * Verify OTP and reset transfer PIN
 */
router.post('/verify-and-reset-pin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIdentifier, otp, newPin } = req.body;

    if (!userIdentifier || !otp || !newPin) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      return;
    }

    // Find user
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

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      userId: user._id.toString(),
      type: 'transfer-pin-reset',
      otp: otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Check if new PIN is same as current PIN
    if (user.transferPin === newPin) {
      res.status(400).json({ error: 'New PIN must be different from current PIN' });
      return;
    }

    // Update user's transfer PIN
    user.transferPin = newPin;
    await user.save();

    // Mark OTP as verified and delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Transfer PIN reset successful for user: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Transfer PIN has been reset successfully!',
    });
  } catch (error) {
    console.error('Error verifying OTP and resetting PIN:', error);
    res.status(500).json({ error: 'Failed to reset PIN. Please try again.' });
  }
});

/**
 * POST /api/otp/resend-transfer-pin-reset
 * Resend OTP for transfer PIN reset
 */
router.post('/resend-transfer-pin-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIdentifier } = req.body;

    if (!userIdentifier) {
      res.status(400).json({ error: 'Email or username is required' });
      return;
    }

    // Find user
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

    // Check if there's a recent OTP (within last 1 minute)
    const recentOTP = await OTP.findOne({
      userId: user._id.toString(),
      type: 'transfer-pin-reset',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOTP) {
      res.status(429).json({ error: 'Please wait 1 minute before requesting a new OTP' });
      return;
    }

    // Delete old OTPs
    await OTP.deleteMany({ userId: user._id.toString(), type: 'transfer-pin-reset' });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      userId: user._id.toString(),
      email: user.email,
      otp,
      type: 'transfer-pin-reset',
      expiresAt,
      verified: false,
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Transfer PIN Reset - New OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ffd700;">🔐 New OTP for Transfer PIN Reset</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>Here is your new OTP:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'New OTP has been sent to your email',
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

export default router;

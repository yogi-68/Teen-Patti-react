import express, { Request, Response } from 'express';
import { Settings } from '../models/Settings.model.js';

const router = express.Router();

/**
 * GET /api/settings/:key
 * Get a specific setting by key
 */
router.get('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    
    let setting = await Settings.findOne({ key });
    
    // If setting doesn't exist, create default for withdrawal commission
    if (!setting && key === 'withdrawalCommission') {
      setting = new Settings({
        key: 'withdrawalCommission',
        value: 3, // Default 3%
        description: 'Platform commission percentage for withdrawals',
        updatedBy: 'system'
      });
      await setting.save();
    }
    
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    res.json({ setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Settings.find();
    
    // Ensure withdrawal commission exists
    const hasCommission = settings.some(s => s.key === 'withdrawalCommission');
    if (!hasCommission) {
      const commissionSetting = new Settings({
        key: 'withdrawalCommission',
        value: 3,
        description: 'Platform commission percentage for withdrawals',
        updatedBy: 'system'
      });
      await commissionSetting.save();
      settings.push(commissionSetting);
    }
    
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/settings/:key
 * Update a setting (admin only)
 */
router.patch('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, updatedBy } = req.body;
    
    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }
    
    // Validate withdrawal commission
    if (key === 'withdrawalCommission') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        res.status(400).json({ error: 'Commission must be between 0 and 100' });
        return;
      }
    }
    
    let setting = await Settings.findOne({ key });
    
    if (!setting) {
      // Create new setting
      setting = new Settings({
        key,
        value,
        description: req.body.description || '',
        updatedBy: updatedBy || 'admin'
      });
    } else {
      // Update existing
      setting.value = value;
      if (req.body.description) setting.description = req.body.description;
      if (updatedBy) setting.updatedBy = updatedBy;
    }
    
    await setting.save();
    
    res.json({ 
      message: 'Setting updated successfully',
      setting 
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

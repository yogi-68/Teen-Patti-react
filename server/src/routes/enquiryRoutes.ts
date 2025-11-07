import { Router, Request, Response } from 'express';
import { enquiryRepository } from '../repositories/EnquiryRepository.js';
import { AppError, ErrorMessages, validate } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/enquiry/submit
 * Submit a new enquiry
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { userId, username, subject, message } = req.body;

    // Validate required fields
    const validationError = validate.required({ userId, username, subject, message });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters long' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message must not exceed 2000 characters' });
    }

    // Validate subject
    const validSubjects = ['account', 'payment', 'game', 'subscription', 'technical', 'feedback', 'other'];
    if (!validSubjects.includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }

    const enquiry = await enquiryRepository.create({
      userId,
      username,
      subject,
      message,
    });

    console.log(`📧 New enquiry submitted by ${username} (${userId})`);

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: {
        _id: enquiry._id,
        subject: enquiry.subject,
        status: enquiry.status,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * GET /api/enquiry/user/:userId
 * Get all enquiries for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const enquiries = await enquiryRepository.findByUserId(userId);

    res.json({ enquiries });
  } catch (error: any) {
    console.error('Error fetching user enquiries:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * GET /api/enquiry/:enquiryId
 * Get a specific enquiry by ID
 */
router.get('/:enquiryId', async (req: Request, res: Response) => {
  try {
    const { enquiryId } = req.params;

    const enquiry = await enquiryRepository.findById(enquiryId);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({ enquiry });
  } catch (error: any) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * GET /api/enquiry/admin/all
 * Get all enquiries (Admin only)
 */
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter = status ? { status: status as string } : undefined;
    const enquiries = await enquiryRepository.findAll(filter);

    res.json({ enquiries, count: enquiries.length });
  } catch (error: any) {
    console.error('Error fetching all enquiries:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * GET /api/enquiry/admin/stats
 * Get enquiry statistics (Admin only)
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await enquiryRepository.getStatusCount();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching enquiry stats:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * PATCH /api/enquiry/:enquiryId/respond
 * Add admin response to enquiry (Admin only)
 */
router.patch('/:enquiryId/respond', async (req: Request, res: Response) => {
  try {
    const { enquiryId } = req.params;
    const { adminResponse, adminId, adminUsername } = req.body;

    // Validate required fields
    const validationError = validate.required({ adminResponse, adminId, adminUsername });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (adminResponse.length < 10) {
      return res.status(400).json({ error: 'Response must be at least 10 characters long' });
    }

    const enquiry = await enquiryRepository.addResponse(
      enquiryId,
      adminResponse,
      adminId,
      adminUsername
    );

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    console.log(`✅ Admin ${adminUsername} responded to enquiry ${enquiryId}`);

    res.json({
      message: 'Response added successfully',
      enquiry,
    });
  } catch (error: any) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * PATCH /api/enquiry/:enquiryId/status
 * Update enquiry status (Admin only)
 */
router.patch('/:enquiryId/status', async (req: Request, res: Response) => {
  try {
    const { enquiryId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'responded', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const enquiry = await enquiryRepository.updateStatus(enquiryId, status);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    console.log(`📝 Enquiry ${enquiryId} status updated to ${status}`);

    res.json({
      message: 'Status updated successfully',
      enquiry,
    });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

/**
 * DELETE /api/enquiry/:enquiryId
 * Delete an enquiry (Admin only)
 */
router.delete('/:enquiryId', async (req: Request, res: Response) => {
  try {
    const { enquiryId } = req.params;

    const deleted = await enquiryRepository.delete(enquiryId);

    if (!deleted) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    console.log(`🗑️ Enquiry ${enquiryId} deleted`);

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: ErrorMessages.INTERNAL_ERROR });
  }
});

export default router;

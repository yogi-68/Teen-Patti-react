import { Router, Request, Response } from 'express';
import AuditLogRepository from '../repositories/AuditLogRepository.js';
import { authenticate, verifyAdmin } from '../middleware/adminAuth.js';
import { adminBotRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply authentication and admin verification to all routes
router.use(authenticate);
router.use(verifyAdmin);
router.use(adminBotRateLimiter);

/**
 * GET /admin/audit-logs
 * Get audit logs with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      admin_user_id,
      action_type,
      entity_type,
      entity_id,
      table_id,
      status,
      limit,
      skip,
    } = req.query;

    const logs = await AuditLogRepository.find({
      admin_user_id: admin_user_id as string,
      action_type: action_type as string,
      entity_type: entity_type as string,
      entity_id: entity_id as string,
      table_id: table_id ? parseInt(table_id as string) : undefined,
      status: status as 'success' | 'failure',
      limit: limit ? parseInt(limit as string) : 100,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /admin/audit-logs/recent
 * Get recent audit logs
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await AuditLogRepository.findRecent(limit);

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching recent audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent audit logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /admin/audit-logs/entity/:entityType/:entityId
 * Get audit logs for a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await AuditLogRepository.findByEntity(entityType, entityId, limit);

    res.json({
      success: true,
      count: logs.length,
      entity_type: entityType,
      entity_id: entityId,
      logs,
    });
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity audit logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const filters: any = {};
    if (start_date) filters.startDate = new Date(start_date as string);
    if (end_date) filters.endDate = new Date(end_date as string);

    const stats = await AuditLogRepository.getStats(filters);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

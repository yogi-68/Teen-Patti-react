import { AuditLog, IAuditLog, AuditActionType, AuditEntityType } from '../models/AuditLog.js';

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
  admin_user_id: string;
  admin_username?: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id?: string;
  table_id?: number;
  seat_index?: number;
  bot_id?: string;
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status?: 'success' | 'failure';
  error_message?: string;
}

/**
 * Query parameters for fetching audit logs
 */
export interface AuditLogQueryParams {
  admin_user_id?: string;
  action_type?: AuditActionType;
  entity_type?: AuditEntityType;
  entity_id?: string;
  table_id?: number;
  status?: 'success' | 'failure';
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  skip?: number;
}

/**
 * Repository for audit log operations
 */
export class AuditLogRepository {
  /**
   * Create a new audit log entry
   */
  async create(input: CreateAuditLogInput): Promise<IAuditLog> {
    try {
      const auditLog = new AuditLog({
        admin_user_id: input.admin_user_id,
        admin_username: input.admin_username,
        action_type: input.action_type,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        table_id: input.table_id,
        seat_index: input.seat_index,
        bot_id: input.bot_id,
        old_value: input.old_value,
        new_value: input.new_value,
        metadata: input.metadata,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        status: input.status || 'success',
        error_message: input.error_message,
      });

      const saved = await auditLog.save();
      return saved;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Find audit logs with query parameters
   */
  async find(params: AuditLogQueryParams): Promise<IAuditLog[]> {
    try {
      const query: any = {};

      if (params.admin_user_id) query.admin_user_id = params.admin_user_id;
      if (params.action_type) query.action_type = params.action_type;
      if (params.entity_type) query.entity_type = params.entity_type;
      if (params.entity_id) query.entity_id = params.entity_id;
      if (params.table_id !== undefined) query.table_id = params.table_id;
      if (params.status) query.status = params.status;

      // Date range filter
      if (params.start_date || params.end_date) {
        query.createdAt = {};
        if (params.start_date) query.createdAt.$gte = params.start_date;
        if (params.end_date) query.createdAt.$lte = params.end_date;
      }

      const limit = params.limit || 50;
      const skip = params.skip || 0;

      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return logs as any;
    } catch (error) {
      console.error('Error finding audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: AuditEntityType, entityId: string, limit = 20): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({
        entity_type: entityType,
        entity_id: entityId,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return logs as any;
    } catch (error) {
      console.error('Error finding audit logs by entity:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific admin user
   */
  async findByAdmin(adminUserId: string, limit = 50): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ admin_user_id: adminUserId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return logs as any;
    } catch (error) {
      console.error('Error finding audit logs by admin:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific table
   */
  async findByTable(tableId: number, limit = 50): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ table_id: tableId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return logs as any;
    } catch (error) {
      console.error('Error finding audit logs by table:', error);
      throw error;
    }
  }

  /**
   * Get recent audit logs
   */
  async findRecent(limit = 100): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return logs as any;
    } catch (error) {
      console.error('Error finding recent audit logs:', error);
      throw error;
    }
  }

  /**
   * Count audit logs matching query
   */
  async count(params: AuditLogQueryParams): Promise<number> {
    try {
      const query: any = {};

      if (params.admin_user_id) query.admin_user_id = params.admin_user_id;
      if (params.action_type) query.action_type = params.action_type;
      if (params.entity_type) query.entity_type = params.entity_type;
      if (params.entity_id) query.entity_id = params.entity_id;
      if (params.table_id !== undefined) query.table_id = params.table_id;
      if (params.status) query.status = params.status;

      if (params.start_date || params.end_date) {
        query.createdAt = {};
        if (params.start_date) query.createdAt.$gte = params.start_date;
        if (params.end_date) query.createdAt.$lte = params.end_date;
      }

      const count = await AuditLog.countDocuments(query);
      return count;
    } catch (error) {
      console.error('Error counting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get statistics about audit logs
   */
  async getStats(): Promise<{
    total_logs: number;
    by_action_type: Record<string, number>;
    by_entity_type: Record<string, number>;
    by_status: Record<string, number>;
    recent_admins: Array<{ admin_user_id: string; admin_username?: string; count: number }>;
  }> {
    try {
      const [total, byActionType, byEntityType, byStatus, recentAdmins] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.aggregate([
          { $group: { _id: '$action_type', count: { $sum: 1 } } },
        ]),
        AuditLog.aggregate([
          { $group: { _id: '$entity_type', count: { $sum: 1 } } },
        ]),
        AuditLog.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        AuditLog.aggregate([
          { $group: { _id: { admin_user_id: '$admin_user_id', admin_username: '$admin_username' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return {
        total_logs: total,
        by_action_type: byActionType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        by_entity_type: byEntityType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        by_status: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        recent_admins: recentAdmins.map((item) => ({
          admin_user_id: item._id.admin_user_id,
          admin_username: item._id.admin_username,
          count: item.count,
        })),
      };
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      throw error;
    }
  }

  /**
   * Delete old audit logs (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error deleting old audit logs:', error);
      throw error;
    }
  }
}

export default new AuditLogRepository();

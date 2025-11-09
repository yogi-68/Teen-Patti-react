import { Collection, Db, ObjectId } from 'mongodb';
import { AuditLog, CreateAuditLogInput } from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * AuditLogRepository - Simple MongoDB operations for audit logs
 */
class AuditLogRepository {
  private collection: Collection<AuditLog> | null = null;
  private db: Db | null = null;

  /**
   * Initialize the repository with database connection
   */
  async initialize(db: Db): Promise<void> {
    this.db = db;
    this.collection = db.collection<AuditLog>('audit_logs');
    
    // Create indexes for better query performance
    await this.collection.createIndex({ admin_user_id: 1, created_at: -1 });
    await this.collection.createIndex({ entity_type: 1, entity_id: 1 });
    await this.collection.createIndex({ table_id: 1, created_at: -1 });
    await this.collection.createIndex({ created_at: -1 });
    
    // TTL index to auto-delete logs after 90 days
    await this.collection.createIndex(
      { created_at: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 }
    );
    
    console.log('✅ AuditLogRepository initialized with indexes');
  }

  /**
   * Create a new audit log entry
   */
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    if (!this.collection) {
      throw new Error('AuditLogRepository not initialized');
    }

    const auditLog: AuditLog = {
      audit_log_id: uuidv4(),
      admin_user_id: input.admin_user_id,
      admin_username: input.admin_username,
      action_type: input.action_type,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      table_id: input.table_id,
      seat_index: input.seat_index,
      description: input.description,
      old_value: input.old_value,
      new_value: input.new_value,
      metadata: input.metadata,
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      status: input.status || 'success',
      error_message: input.error_message,
      created_at: new Date(),
    };

    await this.collection.insertOne(auditLog as any);
    return auditLog;
  }

  /**
   * Find audit logs with filters
   */
  async find(filters: {
    admin_user_id?: string;
    action_type?: string;
    entity_type?: string;
    entity_id?: string;
    table_id?: number;
    status?: 'success' | 'failure';
    limit?: number;
    skip?: number;
  }): Promise<AuditLog[]> {
    if (!this.collection) {
      throw new Error('AuditLogRepository not initialized');
    }

    const query: any = {};
    
    if (filters.admin_user_id) query.admin_user_id = filters.admin_user_id;
    if (filters.action_type) query.action_type = filters.action_type;
    if (filters.entity_type) query.entity_type = filters.entity_type;
    if (filters.entity_id) query.entity_id = filters.entity_id;
    if (filters.table_id !== undefined) query.table_id = filters.table_id;
    if (filters.status) query.status = filters.status;

    const limit = filters.limit || 100;
    const skip = filters.skip || 0;

    const results = await this.collection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return results as AuditLog[];
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.find({
      entity_type: entityType,
      entity_id: entityId,
      limit,
    });
  }

  /**
   * Get recent audit logs
   */
  async findRecent(limit: number = 50): Promise<AuditLog[]> {
    if (!this.collection) {
      throw new Error('AuditLogRepository not initialized');
    }

    const results = await this.collection
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return results as AuditLog[];
  }

  /**
   * Get audit log statistics
   */
  async getStats(filters?: { startDate?: Date; endDate?: Date }): Promise<{
    total_logs: number;
    success_count: number;
    failure_count: number;
    by_action_type: Record<string, number>;
    by_entity_type: Record<string, number>;
  }> {
    if (!this.collection) {
      throw new Error('AuditLogRepository not initialized');
    }

    const query: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      query.created_at = {};
      if (filters.startDate) query.created_at.$gte = filters.startDate;
      if (filters.endDate) query.created_at.$lte = filters.endDate;
    }

    const [totalLogs, successCount, failureCount, actionTypes, entityTypes] = await Promise.all([
      this.collection.countDocuments(query),
      this.collection.countDocuments({ ...query, status: 'success' }),
      this.collection.countDocuments({ ...query, status: 'failure' }),
      this.collection
        .aggregate([
          { $match: query },
          { $group: { _id: '$action_type', count: { $sum: 1 } } },
        ])
        .toArray(),
      this.collection
        .aggregate([
          { $match: query },
          { $group: { _id: '$entity_type', count: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const byActionType: Record<string, number> = {};
    actionTypes.forEach((item: any) => {
      byActionType[item._id] = item.count;
    });

    const byEntityType: Record<string, number> = {};
    entityTypes.forEach((item: any) => {
      byEntityType[item._id] = item.count;
    });

    return {
      total_logs: totalLogs,
      success_count: successCount,
      failure_count: failureCount,
      by_action_type: byActionType,
      by_entity_type: byEntityType,
    };
  }

  /**
   * Delete old audit logs (manual cleanup)
   */
  async deleteOldLogs(daysOld: number = 90): Promise<number> {
    if (!this.collection) {
      throw new Error('AuditLogRepository not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.collection.deleteMany({
      created_at: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }
}

export default new AuditLogRepository();

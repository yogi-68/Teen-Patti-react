import mongoose, { Schema, Document } from 'mongoose';

/**
 * AuditLog Interface - TypeScript type for audit trail
 */
export interface IAuditLog extends Document {
  _id: string;
  admin_user_id: string; // User ID who performed the action
  admin_username?: string; // Username for easier reference
  action_type: AuditActionType; // Type of action performed
  entity_type: AuditEntityType; // What entity was affected
  entity_id?: string; // ID of the affected entity (bot_instance_id, bot_blueprint_id, etc.)
  table_id?: number; // Table ID if action was on a table
  seat_index?: number; // Seat index if action was on a seat
  bot_id?: string; // Bot ID for reference
  old_value?: any; // Previous value (for updates)
  new_value?: any; // New value (for updates/creates)
  metadata?: Record<string, any>; // Additional context
  ip_address?: string; // IP address of admin
  user_agent?: string; // Browser/client info
  status: 'success' | 'failure'; // Action outcome
  error_message?: string; // Error details if failed
  createdAt: Date;
}

/**
 * Audit Action Types
 */
export enum AuditActionType {
  // Bot Instance Actions
  BOT_ASSIGNED = 'bot_assigned',
  BOT_REMOVED = 'bot_removed',
  BOT_IDENTITY_ROTATED = 'bot_identity_rotated',
  BOT_BALANCE_UPDATED = 'bot_balance_updated',
  BOT_STATUS_CHANGED = 'bot_status_changed',
  
  // Bot Blueprint Actions
  BLUEPRINT_CREATED = 'blueprint_created',
  BLUEPRINT_UPDATED = 'blueprint_updated',
  BLUEPRINT_DELETED = 'blueprint_deleted',
  BLUEPRINT_ACTIVATED = 'blueprint_activated',
  BLUEPRINT_DEACTIVATED = 'blueprint_deactivated',
  
  // Configuration Actions
  CONFIG_UPDATED = 'config_updated',
  BEHAVIOR_PROFILE_CHANGED = 'behavior_profile_changed',
  
  // System Actions
  BULK_OPERATION = 'bulk_operation',
  SYSTEM_RESET = 'system_reset',
}

/**
 * Audit Entity Types
 */
export enum AuditEntityType {
  BOT_INSTANCE = 'bot_instance',
  BOT_BLUEPRINT = 'bot_blueprint',
  TABLE = 'table',
  SEAT = 'seat',
  SYSTEM = 'system',
}

/**
 * AuditLog Schema
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin_user_id: {
      type: String,
      required: true,
      index: true, // Index for filtering by admin
    },
    admin_username: {
      type: String,
      default: null,
    },
    action_type: {
      type: String,
      required: true,
      enum: Object.values(AuditActionType),
      index: true, // Index for filtering by action type
    },
    entity_type: {
      type: String,
      required: true,
      enum: Object.values(AuditEntityType),
      index: true,
    },
    entity_id: {
      type: String,
      default: null,
      index: true, // Index for finding all actions on a specific entity
    },
    table_id: {
      type: Number,
      default: null,
      index: true, // Index for filtering by table
    },
    seat_index: {
      type: Number,
      default: null,
    },
    bot_id: {
      type: String,
      default: null,
    },
    old_value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    new_value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure'],
      default: 'success',
    },
    error_message: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for common queries
AuditLogSchema.index({ admin_user_id: 1, createdAt: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1, createdAt: -1 });
AuditLogSchema.index({ table_id: 1, createdAt: -1 });

// TTL index to auto-delete old audit logs after 90 days (configurable)
AuditLogSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    background: true 
  }
);

/**
 * Export the model
 */
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

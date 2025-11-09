/**
 * Simple Audit Log Model
 * Tracks administrative actions on the bot management system
 */

export interface AuditLog {
  audit_log_id: string;
  admin_user_id: string;
  admin_username?: string;
  action_type: string; // 'bot_assigned', 'bot_removed', 'bot_rotated', etc.
  entity_type: string; // 'bot_instance', 'bot_blueprint', 'table'
  entity_id?: string;
  table_id?: number;
  seat_index?: number;
  description: string; // Human-readable description
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  error_message?: string;
  created_at: Date;
}

export interface CreateAuditLogInput {
  admin_user_id: string;
  admin_username?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  table_id?: number;
  seat_index?: number;
  description: string;
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status?: 'success' | 'failure';
  error_message?: string;
}

// Common action types
export const AuditActionType = {
  BOT_ASSIGNED: 'bot_assigned',
  BOT_REMOVED: 'bot_removed',
  BOT_IDENTITY_ROTATED: 'bot_identity_rotated',
  BOT_DEACTIVATED: 'bot_deactivated',
  BOT_AVATAR_UPDATED: 'bot_avatar_updated',
  BLUEPRINT_CREATED: 'blueprint_created',
  BLUEPRINT_UPDATED: 'blueprint_updated',
  BLUEPRINT_DELETED: 'blueprint_deleted',
  CONFIG_UPDATED: 'config_updated',
  BULK_OPERATION: 'bulk_operation',
} as const;

// Common entity types
export const AuditEntityType = {
  BOT_INSTANCE: 'bot_instance',
  BOT_BLUEPRINT: 'bot_blueprint',
  TABLE: 'table',
  SYSTEM: 'system',
} as const;

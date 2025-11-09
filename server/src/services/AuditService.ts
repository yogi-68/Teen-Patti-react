import { Request } from 'express';
import AuditLogRepository from '../repositories/AuditLogRepository.js';
import { AuditActionType, AuditEntityType, CreateAuditLogInput } from '../models/AuditLog.js';

/**
 * AuditService - Simple service for logging administrative actions
 */
class AuditService {
  /**
   * Log an action
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await AuditLogRepository.create(input);
    } catch (error) {
      // Don't throw errors for audit logging failures
      // Just log them to console to avoid disrupting main operations
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Helper: Log from Express request
   */
  async logFromRequest(
    req: Request,
    actionType: string,
    entityType: string,
    description: string,
    options?: {
      entity_id?: string;
      table_id?: number;
      seat_index?: number;
      old_value?: any;
      new_value?: any;
      metadata?: Record<string, any>;
      status?: 'success' | 'failure';
      error_message?: string;
    }
  ): Promise<void> {
    const input: CreateAuditLogInput = {
      admin_user_id: (req as any).user?.userId || 'system',
      admin_username: (req as any).user?.username || 'system',
      action_type: actionType,
      entity_type: entityType,
      description,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.get('user-agent'),
      ...options,
    };

    await this.log(input);
  }

  /**
   * Log bot assignment
   */
  async logBotAssignment(
    adminUserId: string,
    adminUsername: string,
    botInstance: any,
    tableId: number,
    seatIndex: number
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BOT_ASSIGNED,
      entity_type: AuditEntityType.BOT_INSTANCE,
      entity_id: botInstance.bot_instance_id,
      table_id: tableId,
      seat_index: seatIndex,
      description: `Assigned bot ${botInstance.display_name} to Table ${tableId}, Seat ${seatIndex}`,
      new_value: {
        bot_id: botInstance.bot_id,
        display_name: botInstance.display_name,
        behavior: botInstance.behavior_profile,
      },
    });
  }

  /**
   * Log bot removal
   */
  async logBotRemoval(
    adminUserId: string,
    adminUsername: string,
    botInstance: any,
    tableId: number,
    seatIndex: number
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BOT_REMOVED,
      entity_type: AuditEntityType.BOT_INSTANCE,
      entity_id: botInstance.bot_instance_id,
      table_id: tableId,
      seat_index: seatIndex,
      description: `Removed bot ${botInstance.display_name} from Table ${tableId}, Seat ${seatIndex}`,
      old_value: {
        bot_id: botInstance.bot_id,
        display_name: botInstance.display_name,
      },
    });
  }

  /**
   * Log identity rotation
   */
  async logIdentityRotation(
    adminUserId: string,
    adminUsername: string,
    botInstance: any,
    oldIdentity: { display_name: string; bot_id: string; avatar_url?: string }
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BOT_IDENTITY_ROTATED,
      entity_type: AuditEntityType.BOT_INSTANCE,
      entity_id: botInstance.bot_instance_id,
      description: `Rotated identity: ${oldIdentity.display_name} → ${botInstance.display_name}`,
      old_value: oldIdentity,
      new_value: {
        display_name: botInstance.display_name,
        bot_id: botInstance.bot_id,
        avatar_url: botInstance.avatar_url,
      },
    });
  }

  /**
   * Log bot deactivation
   */
  async logBotDeactivation(
    adminUserId: string,
    adminUsername: string,
    botInstanceId: string,
    displayName: string
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BOT_DEACTIVATED,
      entity_type: AuditEntityType.BOT_INSTANCE,
      entity_id: botInstanceId,
      description: `Deactivated bot ${displayName}`,
      old_value: { is_active: true },
      new_value: { is_active: false },
    });
  }

  /**
   * Log avatar update
   */
  async logAvatarUpdate(
    adminUserId: string,
    adminUsername: string,
    botInstanceId: string,
    oldAvatarUrl: string | undefined,
    newAvatarUrl: string
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BOT_AVATAR_UPDATED,
      entity_type: AuditEntityType.BOT_INSTANCE,
      entity_id: botInstanceId,
      description: `Updated bot avatar`,
      old_value: { avatar_url: oldAvatarUrl },
      new_value: { avatar_url: newAvatarUrl },
    });
  }

  /**
   * Log blueprint creation
   */
  async logBlueprintCreation(
    adminUserId: string,
    adminUsername: string,
    blueprint: any
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BLUEPRINT_CREATED,
      entity_type: AuditEntityType.BOT_BLUEPRINT,
      entity_id: blueprint.bot_blueprint_id,
      description: `Created bot blueprint: ${blueprint.name}`,
      new_value: {
        name: blueprint.name,
        behavior_profile: blueprint.behavior_profile_name,
      },
    });
  }

  /**
   * Log blueprint update
   */
  async logBlueprintUpdate(
    adminUserId: string,
    adminUsername: string,
    blueprintId: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.log({
      admin_user_id: adminUserId,
      admin_username: adminUsername,
      action_type: AuditActionType.BLUEPRINT_UPDATED,
      entity_type: AuditEntityType.BOT_BLUEPRINT,
      entity_id: blueprintId,
      description: `Updated bot blueprint`,
      old_value: oldValue,
      new_value: newValue,
    });
  }
}

export default new AuditService();

import AuditLogRepository, { CreateAuditLogInput } from '../repositories/AuditLogRepository.js';
import { AuditActionType, AuditEntityType } from '../models/AuditLog.js';
import { Request } from 'express';

/**
 * Audit Service - Helper for creating audit logs
 */
class AuditService {
  /**
   * Log bot assignment
   */
  async logBotAssigned(
    adminUserId: string,
    adminUsername: string | undefined,
    tableId: number,
    seatIndex: number,
    botInstanceId: string,
    botId: string,
    botData: any,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BOT_ASSIGNED,
        entity_type: AuditEntityType.BOT_INSTANCE,
        entity_id: botInstanceId,
        table_id: tableId,
        seat_index: seatIndex,
        bot_id: botId,
        new_value: botData,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging bot assignment:', error);
    }
  }

  /**
   * Log bot removal
   */
  async logBotRemoved(
    adminUserId: string,
    adminUsername: string | undefined,
    tableId: number,
    seatIndex: number,
    botInstanceId: string,
    botId: string,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BOT_REMOVED,
        entity_type: AuditEntityType.BOT_INSTANCE,
        entity_id: botInstanceId,
        table_id: tableId,
        seat_index: seatIndex,
        bot_id: botId,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging bot removal:', error);
    }
  }

  /**
   * Log bot identity rotation
   */
  async logBotIdentityRotated(
    adminUserId: string,
    adminUsername: string | undefined,
    botInstanceId: string,
    tableId: number | undefined,
    seatIndex: number | undefined,
    oldIdentity: { display_name: string; bot_id: string },
    newIdentity: { display_name: string; bot_id: string },
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BOT_IDENTITY_ROTATED,
        entity_type: AuditEntityType.BOT_INSTANCE,
        entity_id: botInstanceId,
        table_id: tableId,
        seat_index: seatIndex,
        bot_id: newIdentity.bot_id,
        old_value: oldIdentity,
        new_value: newIdentity,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging bot identity rotation:', error);
    }
  }

  /**
   * Log blueprint creation
   */
  async logBlueprintCreated(
    adminUserId: string,
    adminUsername: string | undefined,
    blueprintId: string,
    blueprintData: any,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BLUEPRINT_CREATED,
        entity_type: AuditEntityType.BOT_BLUEPRINT,
        entity_id: blueprintId,
        new_value: blueprintData,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging blueprint creation:', error);
    }
  }

  /**
   * Log blueprint update
   */
  async logBlueprintUpdated(
    adminUserId: string,
    adminUsername: string | undefined,
    blueprintId: string,
    oldData: any,
    newData: any,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BLUEPRINT_UPDATED,
        entity_type: AuditEntityType.BOT_BLUEPRINT,
        entity_id: blueprintId,
        old_value: oldData,
        new_value: newData,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging blueprint update:', error);
    }
  }

  /**
   * Log blueprint deletion
   */
  async logBlueprintDeleted(
    adminUserId: string,
    adminUsername: string | undefined,
    blueprintId: string,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BLUEPRINT_DELETED,
        entity_type: AuditEntityType.BOT_BLUEPRINT,
        entity_id: blueprintId,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging blueprint deletion:', error);
    }
  }

  /**
   * Log balance update
   */
  async logBalanceUpdated(
    adminUserId: string,
    adminUsername: string | undefined,
    botInstanceId: string,
    botId: string,
    oldBalance: { coins: number; cash: number },
    newBalance: { coins: number; cash: number },
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: AuditActionType.BOT_BALANCE_UPDATED,
        entity_type: AuditEntityType.BOT_INSTANCE,
        entity_id: botInstanceId,
        bot_id: botId,
        old_value: oldBalance,
        new_value: newBalance,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging balance update:', error);
    }
  }

  /**
   * Log failed action
   */
  async logFailedAction(
    adminUserId: string,
    adminUsername: string | undefined,
    actionType: AuditActionType,
    entityType: AuditEntityType,
    errorMessage: string,
    metadata?: any,
    req?: Request
  ): Promise<void> {
    try {
      await AuditLogRepository.create({
        admin_user_id: adminUserId,
        admin_username: adminUsername,
        action_type: actionType,
        entity_type: entityType,
        metadata: metadata,
        ip_address: req?.ip,
        user_agent: req?.get('user-agent'),
        status: 'failure',
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Error logging failed action:', error);
    }
  }

  /**
   * Log generic action
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await AuditLogRepository.create(input);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

export default new AuditService();

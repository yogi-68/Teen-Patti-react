import { generateBotIdentity } from './BotIdentityService.js';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import { BotBlueprint } from '../models/BotBlueprint.js';
import { IdentityMode } from '../models/BotInstance.js';

/**
 * Resolve bot identity based on blueprint and identity mode
 * @param blueprint - Bot blueprint with template and settings
 * @param identityMode - 'persistent' | 'ephemeral' | 'randomize'
 * @param sessionDurationHours - Hours until bot expires (for ephemeral mode)
 * @returns Resolved display name, bot ID, avatar, and expiry
 */
export async function resolveIdentity(
  blueprint: BotBlueprint,
  identityMode: IdentityMode = 'randomize',
  sessionDurationHours: number = 24
): Promise<{
  displayName: string;
  botId: string;
  avatarUrl: string | undefined;
  expiresAt: Date | undefined;
}> {
  let displayName: string;
  let botId: string;
  let expiresAt: Date | undefined;

  // Handle persistent mode - reuse existing identity if available
  if (identityMode === 'persistent') {
    const existingInstances = await BotInstanceRepository.findByBlueprintId(
      blueprint.bot_blueprint_id
    );
    
    // Find the most recent persistent instance
    const persistentInstance = existingInstances
      .filter(inst => !inst.randomized && inst.is_active)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];

    if (persistentInstance) {
      // Reuse existing persistent identity
      return {
        displayName: persistentInstance.display_name,
        botId: persistentInstance.bot_id,
        avatarUrl: persistentInstance.avatar_url || blueprint.avatar_url,
        expiresAt: undefined // Persistent = no expiry
      };
    }
  }

  // Generate new identity with collision checking
  const checkCollision = async (name: string, bId: string): Promise<boolean> => {
    const nameExists = await BotInstanceRepository.displayNameExists(name);
    const idExists = await BotInstanceRepository.botIdExists(bId);
    return nameExists || idExists;
  };

  const identity = await generateBotIdentity(
    blueprint.display_name_template,
    undefined, // random gender
    'initials',
    checkCollision
  );

  displayName = identity.displayName;
  botId = identity.botId;

  // Set expiry based on mode
  if (identityMode === 'ephemeral' || identityMode === 'randomize') {
    expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + sessionDurationHours);
  } else {
    expiresAt = undefined; // Persistent = no expiry
  }

  return {
    displayName,
    botId,
    avatarUrl: blueprint.avatar_url,
    expiresAt
  };
}

/**
 * Rotate bot identity - generate completely new name and ID
 * @param currentInstanceId - Current bot instance ID
 * @returns New display name and bot ID
 */
export async function rotateIdentity(currentInstanceId: string): Promise<{
  displayName: string;
  botId: string;
}> {
  const currentInstance = await BotInstanceRepository.findById(currentInstanceId);
  if (!currentInstance) {
    throw new Error('Bot instance not found');
  }

  const blueprint = await BotBlueprintRepository.findById(currentInstance.bot_blueprint_id);
  if (!blueprint) {
    throw new Error('Bot blueprint not found');
  }

  // Generate new identity with collision checking
  const checkCollision = async (name: string, bId: string): Promise<boolean> => {
    const nameExists = await BotInstanceRepository.displayNameExists(name);
    const idExists = await BotInstanceRepository.botIdExists(bId);
    return nameExists || idExists;
  };

  const identity = await generateBotIdentity(
    blueprint.display_name_template,
    undefined,
    'initials',
    checkCollision
  );

  return {
    displayName: identity.displayName,
    botId: identity.botId
  };
}

/**
 * Check if a name or bot ID collides with existing users or bots
 * @param displayName - Name to check
 * @param botId - Bot ID to check
 * @returns true if collision exists
 */
export async function checkNameCollision(
  displayName: string,
  botId?: string
): Promise<boolean> {
  const nameExists = await BotInstanceRepository.displayNameExists(displayName);
  
  if (botId) {
    const idExists = await BotInstanceRepository.botIdExists(botId);
    return nameExists || idExists;
  }
  
  return nameExists;
}

/**
 * Get default session duration based on identity mode
 */
export function getSessionDuration(mode: IdentityMode): number {
  switch (mode) {
    case 'persistent':
      return 0; // No expiry
    case 'ephemeral':
      return 24; // 24 hours
    case 'randomize':
      return 4; // 4 hours
    default:
      return 24;
  }
}

export default {
  resolveIdentity,
  rotateIdentity,
  checkNameCollision,
  getSessionDuration
};

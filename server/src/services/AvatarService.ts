/**
 * AvatarService - Manages bot avatar selection and prevents repetition
 * Provides human-looking avatars with collision avoidance
 */

/**
 * Avatar pool - categorized by style/type
 */
const AVATAR_POOLS = {
  male: [
    '/avatars/male_01.png',
    '/avatars/male_02.png',
    '/avatars/male_03.png',
    '/avatars/male_04.png',
    '/avatars/male_05.png',
    '/avatars/male_06.png',
    '/avatars/male_07.png',
    '/avatars/male_08.png',
    '/avatars/male_09.png',
    '/avatars/male_10.png',
    '/avatars/male_11.png',
    '/avatars/male_12.png'
  ],
  female: [
    '/avatars/female_01.png',
    '/avatars/female_02.png',
    '/avatars/female_03.png',
    '/avatars/female_04.png',
    '/avatars/female_05.png',
    '/avatars/female_06.png',
    '/avatars/female_07.png',
    '/avatars/female_08.png',
    '/avatars/female_09.png',
    '/avatars/female_10.png',
    '/avatars/female_11.png',
    '/avatars/female_12.png'
  ],
  neutral: [
    '/avatars/neutral_01.png',
    '/avatars/neutral_02.png',
    '/avatars/neutral_03.png',
    '/avatars/neutral_04.png',
    '/avatars/neutral_05.png',
    '/avatars/neutral_06.png',
    '/avatars/neutral_07.png',
    '/avatars/neutral_08.png',
    '/avatars/neutral_09.png',
    '/avatars/neutral_10.png',
    '/avatars/neutral_11.png',
    '/avatars/neutral_12.png'
  ],
  // Fallback generic avatars
  generic: [
    '/avatars/avatar_01.png',
    '/avatars/avatar_02.png',
    '/avatars/avatar_03.png',
    '/avatars/avatar_04.png',
    '/avatars/avatar_05.png'
  ]
};

/**
 * Recently used avatars tracker (LRU-style)
 * Prevents same avatar from being reused too quickly
 */
class AvatarUsageTracker {
  private recentAvatars: Map<string, number>;
  private readonly maxTracked: number;
  private readonly cooldownMs: number;

  constructor(maxTracked: number = 100, cooldownMs: number = 3600000) { // 1 hour default
    this.recentAvatars = new Map();
    this.maxTracked = maxTracked;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Check if avatar was recently used
   */
  isRecentlyUsed(avatarUrl: string): boolean {
    const lastUsed = this.recentAvatars.get(avatarUrl);
    if (!lastUsed) return false;

    const elapsed = Date.now() - lastUsed;
    return elapsed < this.cooldownMs;
  }

  /**
   * Mark avatar as used
   */
  markAsUsed(avatarUrl: string): void {
    this.recentAvatars.set(avatarUrl, Date.now());

    // Cleanup old entries if too many
    if (this.recentAvatars.size > this.maxTracked) {
      const cutoffTime = Date.now() - this.cooldownMs;
      const toDelete: string[] = [];

      for (const [url, timestamp] of this.recentAvatars.entries()) {
        if (timestamp < cutoffTime) {
          toDelete.push(url);
        }
      }

      toDelete.forEach(url => this.recentAvatars.delete(url));
    }
  }

  /**
   * Clear usage tracking
   */
  clear(): void {
    this.recentAvatars.clear();
  }

  /**
   * Get usage statistics
   */
  getStats(): { tracked: number; cooldownMs: number } {
    return {
      tracked: this.recentAvatars.size,
      cooldownMs: this.cooldownMs
    };
  }
}

// Global avatar usage tracker
const avatarTracker = new AvatarUsageTracker();

/**
 * Select a random avatar from a specific pool
 */
export function selectAvatarFromPool(
  pool: 'male' | 'female' | 'neutral' | 'generic',
  avoidRecent: boolean = true
): string {
  const avatarPool = AVATAR_POOLS[pool];
  
  if (!avatarPool || avatarPool.length === 0) {
    return AVATAR_POOLS.generic[0]; // Fallback
  }

  // If avoiding recent, filter out recently used
  let availableAvatars = avatarPool;
  if (avoidRecent) {
    availableAvatars = avatarPool.filter(url => !avatarTracker.isRecentlyUsed(url));
    
    // If all are recently used, use full pool
    if (availableAvatars.length === 0) {
      availableAvatars = avatarPool;
    }
  }

  // Select random
  const selected = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
  
  // Mark as used
  if (avoidRecent) {
    avatarTracker.markAsUsed(selected);
  }

  return selected;
}

/**
 * Select avatar based on gender hint
 */
export function selectAvatar(
  gender?: 'male' | 'female' | 'neutral',
  avoidRecent: boolean = true
): string {
  // Random gender if not specified
  if (!gender) {
    const genders: ('male' | 'female' | 'neutral')[] = ['male', 'female', 'neutral'];
    gender = genders[Math.floor(Math.random() * genders.length)];
  }

  return selectAvatarFromPool(gender, avoidRecent);
}

/**
 * Check if avatar URL is valid
 */
export function isValidAvatarUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's in our pools
  const allAvatars = [
    ...AVATAR_POOLS.male,
    ...AVATAR_POOLS.female,
    ...AVATAR_POOLS.neutral,
    ...AVATAR_POOLS.generic
  ];

  return allAvatars.includes(url);
}

/**
 * Get all available avatars for a gender
 */
export function getAvatarPool(gender: 'male' | 'female' | 'neutral' | 'generic'): string[] {
  return [...(AVATAR_POOLS[gender] || AVATAR_POOLS.generic)];
}

/**
 * Get avatar by index from pool (useful for testing)
 */
export function getAvatarByIndex(
  pool: 'male' | 'female' | 'neutral' | 'generic',
  index: number
): string {
  const avatarPool = AVATAR_POOLS[pool] || AVATAR_POOLS.generic;
  const safeIndex = index % avatarPool.length;
  return avatarPool[safeIndex];
}

/**
 * Select multiple unique avatars
 */
export function selectMultipleAvatars(
  count: number,
  gender?: 'male' | 'female' | 'neutral',
  avoidRecent: boolean = true
): string[] {
  const selected: string[] = [];
  const selectedSet = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loop

  while (selected.length < count && attempts < maxAttempts) {
    const avatar = selectAvatar(gender, avoidRecent);
    
    if (!selectedSet.has(avatar)) {
      selected.push(avatar);
      selectedSet.add(avatar);
    }

    attempts++;
  }

  return selected;
}

/**
 * Check if avatar is currently in use by active bots
 */
export async function isAvatarInUse(
  avatarUrl: string,
  activeBotsGetter: () => Promise<Array<{ avatar_url?: string }>>
): Promise<boolean> {
  try {
    const activeBots = await activeBotsGetter();
    return activeBots.some(bot => bot.avatar_url === avatarUrl);
  } catch (error) {
    console.error('Error checking avatar usage:', error);
    return false;
  }
}

/**
 * Select avatar ensuring it's not in use by another active bot
 */
export async function selectUniqueAvatar(
  gender?: 'male' | 'female' | 'neutral',
  activeBotsGetter?: () => Promise<Array<{ avatar_url?: string }>>
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const avatar = selectAvatar(gender, true);

    // Check if in use by active bot
    if (activeBotsGetter) {
      const inUse = await isAvatarInUse(avatar, activeBotsGetter);
      if (!inUse) {
        return avatar;
      }
    } else {
      return avatar; // No checker provided, return selected
    }

    attempts++;
  }

  // Fallback - just return any avatar
  return selectAvatar(gender, false);
}

/**
 * Clear avatar usage tracker
 */
export function clearAvatarTracker(): void {
  avatarTracker.clear();
}

/**
 * Get avatar tracker statistics
 */
export function getAvatarTrackerStats(): { tracked: number; cooldownMs: number } {
  return avatarTracker.getStats();
}

/**
 * Get total count of available avatars
 */
export function getTotalAvatarCount(): number {
  return (
    AVATAR_POOLS.male.length +
    AVATAR_POOLS.female.length +
    AVATAR_POOLS.neutral.length +
    AVATAR_POOLS.generic.length
  );
}

/**
 * Get avatar statistics
 */
export function getAvatarStats(): {
  male: number;
  female: number;
  neutral: number;
  generic: number;
  total: number;
} {
  return {
    male: AVATAR_POOLS.male.length,
    female: AVATAR_POOLS.female.length,
    neutral: AVATAR_POOLS.neutral.length,
    generic: AVATAR_POOLS.generic.length,
    total: getTotalAvatarCount()
  };
}

export default {
  selectAvatar,
  selectAvatarFromPool,
  selectMultipleAvatars,
  selectUniqueAvatar,
  isValidAvatarUrl,
  isAvatarInUse,
  getAvatarPool,
  getAvatarByIndex,
  getAvatarStats,
  getTotalAvatarCount,
  clearAvatarTracker,
  getAvatarTrackerStats
};

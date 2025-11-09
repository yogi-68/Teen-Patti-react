import avatarData from '../data/bot_avatars.json' with { type: 'json' };

interface Avatar {
  id: string;
  url: string;
  gender: 'male' | 'female' | 'neutral';
  style: string;
}

// Track recently used avatars to avoid repetition
const recentlyUsedAvatars = new Set<string>();
const MAX_RECENT_AVATARS = 20;

/**
 * Get random avatar URL
 * @param gender - Optional gender preference
 * @returns Avatar URL
 */
export function getRandomAvatar(gender?: 'male' | 'female' | 'neutral'): string {
  let availableAvatars = avatarData.avatars as Avatar[];
  
  // Filter by gender if specified
  if (gender) {
    availableAvatars = availableAvatars.filter(a => a.gender === gender || a.gender === 'neutral');
  }
  
  // Filter out recently used avatars
  const unusedAvatars = availableAvatars.filter(a => !recentlyUsedAvatars.has(a.id));
  
  // If all avatars used, clear the recent list and start over
  if (unusedAvatars.length === 0) {
    recentlyUsedAvatars.clear();
    return getRandomAvatar(gender);
  }
  
  // Pick random avatar
  const randomIndex = Math.floor(Math.random() * unusedAvatars.length);
  const selectedAvatar = unusedAvatars[randomIndex];
  
  // Track as used
  recentlyUsedAvatars.add(selectedAvatar.id);
  
  // Keep only last MAX_RECENT_AVATARS
  if (recentlyUsedAvatars.size > MAX_RECENT_AVATARS) {
    const firstItem = Array.from(recentlyUsedAvatars)[0];
    recentlyUsedAvatars.delete(firstItem);
  }
  
  // Return full URL (add CDN base if configured)
  return avatarData.cdn_base_url 
    ? `${avatarData.cdn_base_url}${selectedAvatar.url}`
    : selectedAvatar.url;
}

/**
 * Get avatar by ID
 */
export function getAvatarById(avatarId: string): string | null {
  const avatar = (avatarData.avatars as Avatar[]).find(a => a.id === avatarId);
  if (!avatar) return null;
  
  return avatarData.cdn_base_url 
    ? `${avatarData.cdn_base_url}${avatar.url}`
    : avatar.url;
}

/**
 * Get all available avatars
 */
export function getAllAvatars(): Avatar[] {
  return (avatarData.avatars as Avatar[]).map(avatar => ({
    ...avatar,
    url: avatarData.cdn_base_url 
      ? `${avatarData.cdn_base_url}${avatar.url}`
      : avatar.url
  }));
}

/**
 * Get fallback avatar
 */
export function getFallbackAvatar(): string {
  return avatarData.cdn_base_url 
    ? `${avatarData.cdn_base_url}${avatarData.fallback_avatar}`
    : avatarData.fallback_avatar;
}

/**
 * Clear recently used avatars cache
 */
export function clearAvatarCache(): void {
  recentlyUsedAvatars.clear();
}

export default {
  getRandomAvatar,
  getAvatarById,
  getAllAvatars,
  getFallbackAvatar,
  clearAvatarCache
};

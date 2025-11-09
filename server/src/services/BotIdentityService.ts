import crypto from 'crypto';
import firstNames from '../data/bot_first_names.json' with { type: 'json' };
import lastNames from '../data/bot_last_names.json' with { type: 'json' };

/**
 * LRU Cache for tracking recently used bot names to avoid repetition
 */
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to re-add at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    this.cache.set(key, value);
    
    // Remove oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache for recent bot names (last 1000)
const recentBotNamesCache = new LRUCache<string, boolean>(1000);

/**
 * Generate a random bot display name using templates
 * @param template - Template string like "{{first}} {{last}}" or "{{first}}"
 * @param gender - 'male', 'female', or 'neutral' (default: random)
 * @returns Generated display name
 */
export function generateBotDisplayName(
  template: string = '{{first}} {{last}}',
  gender?: 'male' | 'female' | 'neutral'
): string {
  // Select gender if not provided
  if (!gender) {
    const genders: ('male' | 'female' | 'neutral')[] = ['male', 'female', 'neutral'];
    gender = genders[Math.floor(Math.random() * genders.length)];
  }

  // Get name pools
  const firstNamePool = gender === 'neutral' 
    ? firstNames.neutral 
    : gender === 'male' 
    ? firstNames.male 
    : firstNames.female;
  
  const lastNamePool = lastNames;

  // Generate name from template
  let displayName = template;
  
  if (template.includes('{{first}}')) {
    const firstName = firstNamePool[Math.floor(Math.random() * firstNamePool.length)];
    displayName = displayName.replace('{{first}}', firstName);
  }
  
  if (template.includes('{{last}}')) {
    const lastName = lastNamePool[Math.floor(Math.random() * lastNamePool.length)];
    displayName = displayName.replace('{{last}}', lastName);
  }
  
  if (template.includes('{{random}}')) {
    const randomNum = Math.floor(Math.random() * 10000);
    displayName = displayName.replace('{{random}}', randomNum.toString());
  }

  if (template.includes('{{digit}}')) {
    const digit = Math.floor(Math.random() * 100);
    displayName = displayName.replace('{{digit}}', digit.toString());
  }

  return displayName.trim();
}

/**
 * Generate a unique bot ID with format like "RS-8732" or "pt_4f9a"
 * @param displayName - Bot's display name (used in hash)
 * @param prefix - Optional prefix (default: extracted from name initials)
 * @returns Unique bot ID
 */
export function generateBotId(displayName: string, prefix?: string): string {
  // If no prefix provided, create from initials
  if (!prefix) {
    const nameParts = displayName.split(' ').filter(p => p.length > 0);
    if (nameParts.length >= 2) {
      prefix = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    } else {
      prefix = displayName.substring(0, 2).toUpperCase();
    }
  }

  // Create hash from name + timestamp for uniqueness
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 8);
  const hashInput = `${displayName}-${timestamp}-${randomSalt}`;
  
  const hash = crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
  
  // Take first 4 characters of hash and convert to number
  const hashNum = parseInt(hash.substring(0, 8), 16) % 10000;
  const paddedNum = hashNum.toString().padStart(4, '0');
  
  return `${prefix}-${paddedNum}`;
}

/**
 * Alternative bot ID format: "pt_4f9a" (platform prefix + short hash)
 */
export function generateBotIdAlt(displayName: string): string {
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 8);
  const hashInput = `${displayName}-${timestamp}-${randomSalt}`;
  
  const hash = crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
  
  // Take first 4 chars of hash for short unique ID
  const shortHash = hash.substring(0, 4);
  
  return `pt_${shortHash}`;
}

/**
 * Check if a display name has been used recently (in LRU cache)
 */
export function isNameRecentlyUsed(displayName: string): boolean {
  return recentBotNamesCache.has(displayName.toLowerCase());
}

/**
 * Add a name to the recent names cache
 */
export function markNameAsUsed(displayName: string): void {
  recentBotNamesCache.set(displayName.toLowerCase(), true);
}

/**
 * Generate a unique bot name that hasn't been used recently
 * Tries up to 10 times before giving up and appending a number
 */
export async function generateUniqueBotName(
  template: string = '{{first}} {{last}}',
  gender?: 'male' | 'female' | 'neutral',
  checkCollision?: (name: string) => Promise<boolean>
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const displayName = generateBotDisplayName(template, gender);
    
    // Check if used recently
    if (isNameRecentlyUsed(displayName)) {
      attempts++;
      continue;
    }

    // Check collision with database if function provided
    if (checkCollision) {
      const hasCollision = await checkCollision(displayName);
      if (hasCollision) {
        attempts++;
        continue;
      }
    }

    // Name is unique!
    markNameAsUsed(displayName);
    return displayName;
  }

  // If we couldn't find unique name after max attempts, append a random number
  const baseName = generateBotDisplayName(template, gender);
  const uniqueSuffix = Math.floor(Math.random() * 10000);
  const uniqueName = `${baseName} ${uniqueSuffix}`;
  markNameAsUsed(uniqueName);
  return uniqueName;
}

/**
 * Clear the recent names cache (useful for testing or maintenance)
 */
export function clearRecentNamesCache(): void {
  recentBotNamesCache.clear();
}

/**
 * Generate complete bot identity (name + ID)
 */
export async function generateBotIdentity(
  template: string = '{{first}} {{last}}',
  gender?: 'male' | 'female' | 'neutral',
  idFormat: 'initials' | 'platform' = 'initials',
  checkCollision?: (name: string, botId: string) => Promise<boolean>
): Promise<{ displayName: string; botId: string }> {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const displayName = await generateUniqueBotName(template, gender);
    const botId = idFormat === 'initials' 
      ? generateBotId(displayName) 
      : generateBotIdAlt(displayName);

    // Check collision if function provided
    if (checkCollision) {
      const hasCollision = await checkCollision(displayName, botId);
      if (hasCollision) {
        attempts++;
        continue;
      }
    }

    return { displayName, botId };
  }

  // Fallback with guaranteed unique timestamp suffix
  const timestamp = Date.now();
  const displayName = `${generateBotDisplayName(template, gender)}_${timestamp}`;
  const botId = idFormat === 'initials' 
    ? generateBotId(displayName) 
    : generateBotIdAlt(displayName);
  
  return { displayName, botId };
}

export default {
  generateBotDisplayName,
  generateBotId,
  generateBotIdAlt,
  generateUniqueBotName,
  generateBotIdentity,
  isNameRecentlyUsed,
  markNameAsUsed,
  clearRecentNamesCache
};

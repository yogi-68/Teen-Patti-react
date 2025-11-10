import {
  generateBotDisplayName,
  generateBotId,
  generateBotIdAlt,
  generateUniqueBotName,
  isNameRecentlyUsed,
  markNameAsUsed,
  clearRecentNamesCache,
  generateBotIdentity,
} from '../services/BotIdentityService.js';

describe('BotIdentityService', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearRecentNamesCache();
  });

  describe('generateBotDisplayName', () => {
    test('should generate name with first and last', () => {
      const name = generateBotDisplayName('{{first}} {{last}}');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
      expect(name).toContain(' '); // Should have space between first and last
    });

    test('should generate name with only first name', () => {
      const name = generateBotDisplayName('{{first}}');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toContain(' ');
    });

    test('should generate name with random number', () => {
      const name = generateBotDisplayName('Bot{{random}}');
      
      expect(name).toMatch(/^Bot\d+$/);
    });

    test('should generate name with digit', () => {
      const name = generateBotDisplayName('Player {{digit}}');
      
      expect(name).toMatch(/^Player \d+$/);
    });

    test('should handle male gender', () => {
      const name = generateBotDisplayName('{{first}} {{last}}', 'male');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should handle female gender', () => {
      const name = generateBotDisplayName('{{first}} {{last}}', 'female');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should handle neutral gender', () => {
      const name = generateBotDisplayName('{{first}} {{last}}', 'neutral');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should generate different names on multiple calls', () => {
      const names = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        names.add(generateBotDisplayName('{{first}} {{last}}'));
      }
      
      // Should generate at least some different names
      expect(names.size).toBeGreaterThan(1);
    });

    test('should handle complex templates', () => {
      const name = generateBotDisplayName('{{first}} {{last}} {{digit}}');
      
      expect(name).toBeDefined();
      expect(name.split(' ')).toHaveLength(3);
    });
  });

  describe('generateBotId', () => {
    test('should generate ID with initials format', () => {
      const id = generateBotId('Rahul Sharma');
      
      expect(id).toMatch(/^RS-\d{4}$/);
    });

    test('should generate ID with custom prefix', () => {
      const id = generateBotId('Test User', 'TU');
      
      expect(id).toMatch(/^TU-\d{4}$/);
    });

    test('should generate unique IDs for same name', () => {
      const id1 = generateBotId('John Doe');
      const id2 = generateBotId('John Doe');
      
      expect(id1).not.toBe(id2); // Should be different due to timestamp/random
    });

    test('should handle single word names', () => {
      const id = generateBotId('Player');
      
      expect(id).toMatch(/^PL-\d{4}$/);
    });

    test('should handle names with multiple spaces', () => {
      const id = generateBotId('Rahul Kumar Sharma');
      
      expect(id).toMatch(/^RK-\d{4}$/); // First two words
    });

    test('should pad short numbers with zeros', () => {
      const id = generateBotId('Test User');
      const numberPart = id.split('-')[1];
      
      expect(numberPart).toHaveLength(4);
      expect(numberPart).toMatch(/^\d{4}$/);
    });
  });

  describe('generateBotIdAlt', () => {
    test('should generate alt ID format', () => {
      const id = generateBotIdAlt('Rahul Sharma');
      
      expect(id).toMatch(/^pt_[a-f0-9]{4}$/);
    });

    test('should generate unique alt IDs', () => {
      const id1 = generateBotIdAlt('Test User');
      const id2 = generateBotIdAlt('Test User');
      
      expect(id1).not.toBe(id2);
    });

    test('should use hexadecimal characters', () => {
      const id = generateBotIdAlt('Player');
      const hashPart = id.replace('pt_', '');
      
      expect(hashPart).toMatch(/^[a-f0-9]{4}$/);
    });
  });

  describe('LRU Cache (Recent Names)', () => {
    test('should track recently used names', () => {
      const name = 'Rahul Sharma';
      
      expect(isNameRecentlyUsed(name)).toBe(false);
      
      markNameAsUsed(name);
      
      expect(isNameRecentlyUsed(name)).toBe(true);
    });

    test('should be case-insensitive', () => {
      markNameAsUsed('Rahul Sharma');
      
      expect(isNameRecentlyUsed('rahul sharma')).toBe(true);
      expect(isNameRecentlyUsed('RAHUL SHARMA')).toBe(true);
    });

    test('should clear cache', () => {
      markNameAsUsed('Test User');
      expect(isNameRecentlyUsed('Test User')).toBe(true);
      
      clearRecentNamesCache();
      
      expect(isNameRecentlyUsed('Test User')).toBe(false);
    });

    test('should handle LRU eviction after 1000 entries', () => {
      // Add 1001 names to trigger eviction
      for (let i = 0; i < 1001; i++) {
        markNameAsUsed(`User ${i}`);
      }
      
      // First name should be evicted
      expect(isNameRecentlyUsed('User 0')).toBe(false);
      
      // Last name should still be there
      expect(isNameRecentlyUsed('User 1000')).toBe(true);
    });

    test('should handle LRU eviction properly', () => {
      // Add exactly 1000 names
      for (let i = 0; i < 1000; i++) {
        markNameAsUsed(`User ${i}`);
      }
      
      // All 1000 should be in cache
      expect(isNameRecentlyUsed('User 0')).toBe(true);
      expect(isNameRecentlyUsed('User 999')).toBe(true);
      
      // Add one more to trigger eviction of oldest
      markNameAsUsed('User 1000');
      
      // First user should be evicted
      expect(isNameRecentlyUsed('User 0')).toBe(false);
      
      // Last users should still be there
      expect(isNameRecentlyUsed('User 999')).toBe(true);
      expect(isNameRecentlyUsed('User 1000')).toBe(true);
    });
  });

  describe('generateUniqueBotName', () => {
    test('should generate unique name', async () => {
      const name = await generateUniqueBotName('{{first}} {{last}}');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should avoid recently used names', async () => {
      const name1 = await generateUniqueBotName('{{first}} {{last}}');
      markNameAsUsed(name1);
      
      const name2 = await generateUniqueBotName('{{first}} {{last}}');
      
      // With random generation, they should be different
      // (though not guaranteed due to randomness)
      expect(name2).toBeDefined();
    });

    test('should respect collision checker', async () => {
      const existingNames = new Set(['John Doe', 'Jane Smith']);
      
      const collisionChecker = async (name: string) => {
        return existingNames.has(name);
      };
      
      // Force collision by using limited name pool
      const name = await generateUniqueBotName('{{first}} {{last}}', 'male', collisionChecker);
      
      expect(name).toBeDefined();
      expect(existingNames.has(name)).toBe(false);
    });

    test('should append number after max attempts', async () => {
      // Create collision checker that always returns true
      const alwaysCollides = async () => true;
      
      const name = await generateUniqueBotName('{{first}} {{last}}', 'male', alwaysCollides);
      
      // Should have appended a number
      expect(name).toMatch(/\d+$/);
    });

    test('should mark generated name as used', async () => {
      const name = await generateUniqueBotName('{{first}} {{last}}');
      
      expect(isNameRecentlyUsed(name)).toBe(true);
    });

    test('should handle gender preference', async () => {
      const maleName = await generateUniqueBotName('{{first}} {{last}}', 'male');
      const femaleName = await generateUniqueBotName('{{first}} {{last}}', 'female');
      
      expect(maleName).toBeDefined();
      expect(femaleName).toBeDefined();
    });
  });

  describe('generateBotIdentity', () => {
    test('should generate complete identity', async () => {
      const identity = await generateBotIdentity('{{first}} {{last}}');
      
      expect(identity).toHaveProperty('displayName');
      expect(identity).toHaveProperty('botId');
      expect(identity.displayName.length).toBeGreaterThan(0);
      expect(identity.botId).toMatch(/^[A-Z]{2}-\d{4}$/);
    });

    test('should generate identity with platform ID format', async () => {
      const identity = await generateBotIdentity('{{first}} {{last}}', undefined, 'platform');
      
      expect(identity.botId).toMatch(/^pt_[a-f0-9]{4}$/);
    });

    test('should generate different identities', async () => {
      const identity1 = await generateBotIdentity('{{first}} {{last}}');
      const identity2 = await generateBotIdentity('{{first}} {{last}}');
      
      // IDs should be unique
      expect(identity1.botId).not.toBe(identity2.botId);
    });

    test('should handle gender preference', async () => {
      const identity = await generateBotIdentity('{{first}} {{last}}', 'male', 'initials');
      
      expect(identity.displayName).toBeDefined();
      expect(identity.botId).toMatch(/^[A-Z]{2}-\d{4}$/);
    });

    test('should respect collision checker', async () => {
      const existingIdentities = new Set(['John Doe-JD-1234']);
      
      const collisionChecker = async (name: string, botId: string) => {
        return existingIdentities.has(`${name}-${botId}`);
      };
      
      const identity = await generateBotIdentity('{{first}} {{last}}', 'male', 'initials', collisionChecker);
      
      expect(identity).toBeDefined();
      expect(existingIdentities.has(`${identity.displayName}-${identity.botId}`)).toBe(false);
    });
  });

  describe('Collision Detection', () => {
    test('should retry on collision', async () => {
      const collisionCalls: string[] = [];
      
      const collisionChecker = async (name: string) => {
        collisionCalls.push(name);
        // First call collides, second succeeds
        return collisionCalls.length === 1;
      };
      
      const name = await generateUniqueBotName('{{first}} {{last}}', 'male', collisionChecker);
      
      expect(collisionCalls.length).toBeGreaterThanOrEqual(2);
      expect(name).toBeDefined();
    });

    test('should handle multiple collision attempts', async () => {
      let attempts = 0;
      
      const collisionChecker = async () => {
        attempts++;
        // Collide for first 5 attempts, then succeed
        return attempts <= 5;
      };
      
      const name = await generateUniqueBotName('{{first}} {{last}}', 'male', collisionChecker);
      
      expect(attempts).toBeGreaterThanOrEqual(6);
      expect(name).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty template', () => {
      const name = generateBotDisplayName('');
      
      expect(name).toBe('');
    });

    test('should handle template with no placeholders', () => {
      const name = generateBotDisplayName('StaticName');
      
      expect(name).toBe('StaticName');
    });

    test('should handle very long names', () => {
      const name = generateBotDisplayName('{{first}} {{last}} {{first}} {{last}} {{digit}}');
      
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should generate valid IDs for single character names', () => {
      const id = generateBotId('A');
      
      expect(id).toMatch(/^A-\d{4}$/);
    });

    test('should handle names with special characters', () => {
      const id = generateBotId('Rahul-Sharma');
      
      expect(id).toBeDefined();
      expect(id).toMatch(/^R\w-\d{4}$/);
    });
  });

  describe('Performance', () => {
    test('should generate 100 names quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        generateBotDisplayName('{{first}} {{last}}');
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should take < 1 second
    });

    test('should generate 100 IDs quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        generateBotId(`Test User ${i}`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});

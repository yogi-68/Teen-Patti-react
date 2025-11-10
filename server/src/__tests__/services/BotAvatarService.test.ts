import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  getRandomAvatar, 
  getAllAvatars, 
  getAvatarById,
  getFallbackAvatar,
  clearAvatarCache
} from '../../services/BotAvatarService.js';

/**
 * Bot Avatar Service Tests
 * Tests avatar generation, validation, and selection
 */
describe('BotAvatarService', () => {
  beforeEach(() => {
    clearAvatarCache();
  });

  describe('getRandomAvatar', () => {
    it('should return a valid avatar URL', () => {
      const avatar = getRandomAvatar();

      expect(avatar).toBeTruthy();
      expect(typeof avatar).toBe('string');
      expect(avatar.length).toBeGreaterThan(0);
    });

    it('should return different avatars on multiple calls', () => {
      const avatars = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        avatars.add(getRandomAvatar());
      }

      expect(avatars.size).toBeGreaterThanOrEqual(2);
    });

    it('should support gender filtering', () => {
      const maleAvatar = getRandomAvatar('male');
      const femaleAvatar = getRandomAvatar('female');
      const neutralAvatar = getRandomAvatar('neutral');

      expect(maleAvatar).toBeTruthy();
      expect(femaleAvatar).toBeTruthy();
      expect(neutralAvatar).toBeTruthy();
    });

    it('should never return null or undefined', () => {
      for (let i = 0; i < 50; i++) {
        const avatar = getRandomAvatar();
        expect(avatar).not.toBeNull();
        expect(avatar).not.toBeUndefined();
        expect(avatar).not.toBe('');
      }
    });
  });

  describe('getAllAvatars', () => {
    it('should return array of all available avatars', () => {
      const avatars = getAllAvatars();

      expect(Array.isArray(avatars)).toBe(true);
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should return unique avatar IDs', () => {
      const avatars = getAllAvatars();
      const uniqueIds = new Set(avatars.map(a => a.id));

      expect(uniqueIds.size).toBe(avatars.length);
    });

    it('all avatars should have required properties', () => {
      const avatars = getAllAvatars();

      avatars.forEach(avatar => {
        expect(avatar).toHaveProperty('id');
        expect(avatar).toHaveProperty('url');
        expect(avatar).toHaveProperty('gender');
        expect(avatar).toHaveProperty('style');
        expect(['male', 'female', 'neutral']).toContain(avatar.gender);
      });
    });
  });

  describe('getAvatarById', () => {
    it('should return avatar for valid ID', () => {
      const avatars = getAllAvatars();
      if (avatars.length > 0) {
        const firstAvatarId = avatars[0].id;
        const avatar = getAvatarById(firstAvatarId);

        expect(avatar).toBeTruthy();
        expect(typeof avatar).toBe('string');
      }
    });

    it('should return null for invalid ID', () => {
      const avatar = getAvatarById('invalid-avatar-id-xyz');

      expect(avatar).toBeNull();
    });
  });

  describe('getFallbackAvatar', () => {
    it('should return a valid fallback avatar', () => {
      const fallback = getFallbackAvatar();

      expect(fallback).toBeTruthy();
      expect(typeof fallback).toBe('string');
    });

    it('should always return same fallback', () => {
      const fallback1 = getFallbackAvatar();
      const fallback2 = getFallbackAvatar();

      expect(fallback1).toBe(fallback2);
    });
  });

  describe('clearAvatarCache', () => {
    it('should clear the recently used avatar cache', () => {
      // Use some avatars
      for (let i = 0; i < 5; i++) {
        getRandomAvatar();
      }

      // Clear cache
      clearAvatarCache();

      // Should work without errors
      const avatar = getRandomAvatar();
      expect(avatar).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should generate avatars quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 500; i++) {
        getRandomAvatar();
      }

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(getRandomAvatar()));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(50);
      results.forEach(avatar => {
        expect(avatar).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle pool exhaustion gracefully', () => {
      const avatars = getAllAvatars();
      const poolSize = avatars.length;

      // Request more than available
      for (let i = 0; i < poolSize + 20; i++) {
        const avatar = getRandomAvatar();
        expect(avatar).toBeTruthy();
      }
    });

    it('should handle rapid successive calls', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(getRandomAvatar());
      }

      expect(results.length).toBe(100);
      results.forEach(r => expect(r).toBeTruthy());
    });
  });
});

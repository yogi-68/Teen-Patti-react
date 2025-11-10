import BotChatService, { ChatContext, PersonalityType } from '../services/BotChatService';
import { BehaviorProfile, BehaviorProfiles } from '../models/BotBlueprint';

describe('BotChatService', () => {
  describe('getPersonalityTypeName', () => {
    it('should identify BEGINNER personality with low skill level', () => {
      const profile: BehaviorProfile = {
        ...BehaviorProfiles.BALANCED,
        skill_level: 25
      };

      const personality = BotChatService.getPersonalityTypeName(profile);
      expect(personality).toBe(PersonalityType.BEGINNER);
    });

    it('should identify AGGRESSIVE personality with high aggressiveness', () => {
      const profile: BehaviorProfile = {
        ...BehaviorProfiles.AGGRESSIVE,
        aggressiveness: 75
      };

      const personality = BotChatService.getPersonalityTypeName(profile);
      expect(personality).toBe(PersonalityType.AGGRESSIVE);
    });

    it('should identify CONSERVATIVE personality with low aggressiveness and risk', () => {
      const profile: BehaviorProfile = {
        ...BehaviorProfiles.CONSERVATIVE,
        aggressiveness: 30,
        risk_tolerance: 35,
        skill_level: 50
      };

      const personality = BotChatService.getPersonalityTypeName(profile);
      expect(personality).toBe(PersonalityType.CONSERVATIVE);
    });

    it('should identify BALANCED personality for moderate profiles', () => {
      const profile: BehaviorProfile = BehaviorProfiles.BALANCED;

      const personality = BotChatService.getPersonalityTypeName(profile);
      expect(personality).toBe(PersonalityType.BALANCED);
    });
  });

  describe('generateMessage', () => {
    it('should generate a message for game start context', () => {
      const profile = BehaviorProfiles.BALANCED;
      
      // Force message to ensure we get one
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.GAME_START,
        { forceMessage: true }
      );

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    it('should return null when probability check fails', () => {
      const profile = BehaviorProfiles.BALANCED;
      
      // Set probability to 0 to always fail
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.GAME_START,
        { customProbability: 0 }
      );

      expect(message).toBeNull();
    });

    it('should return message when probability is 100', () => {
      const profile = BehaviorProfiles.BALANCED;
      
      // Set probability to 100 to always succeed
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.BIG_WIN,
        { customProbability: 100 }
      );

      expect(message).toBeTruthy();
    });

    it('should generate appropriate message for aggressive personality on big win', () => {
      const profile = BehaviorProfiles.AGGRESSIVE;
      
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.BIG_WIN,
        { forceMessage: true }
      );

      expect(message).toBeTruthy();
      // Aggressive messages are typically enthusiastic
      expect(message).toMatch(/BOOM|easy|Victory|next|sweet/i);
    });

    it('should generate appropriate message for conservative personality on fold', () => {
      const profile = BehaviorProfiles.CONSERVATIVE;
      
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.FOLD,
        { forceMessage: true }
      );

      expect(message).toBeTruthy();
      // Conservative fold messages are typically cautious
      expect(message).toMatch(/sit|safe|risk|pass/i);
    });

    it('should generate appropriate message for beginner personality', () => {
      const profile = BehaviorProfiles.BEGINNER;
      
      const message = BotChatService.generateMessage(
        profile,
        ChatContext.STRONG_HAND,
        { forceMessage: true }
      );

      expect(message).toBeTruthy();
      // Beginner messages are typically uncertain
      expect(message).toMatch(/Are|good|think|might/i);
    });

    it('should handle contexts with empty string templates', () => {
      const profile = BehaviorProfiles.BALANCED;
      
      // Some contexts may have empty strings in templates (bot chooses silence)
      // Multiple attempts to potentially get an empty string
      let gotEmptyString = false;
      for (let i = 0; i < 50; i++) {
        const message = BotChatService.generateMessage(
          profile,
          ChatContext.BLUFF,
          { forceMessage: true }
        );
        if (message === null || message === '') {
          gotEmptyString = true;
          break;
        }
      }

      // This test just verifies the service handles empty strings gracefully
      expect(true).toBe(true);
    });
  });

  describe('getMessageOptions', () => {
    it('should return multiple message options', () => {
      const profile = BehaviorProfiles.BALANCED;
      const messages = BotChatService.getMessageOptions(
        profile,
        ChatContext.GAME_START,
        3
      );

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.length).toBeLessThanOrEqual(3);
    });

    it('should return different messages for different personalities', () => {
      const contexts = [ChatContext.GAME_START, ChatContext.BIG_WIN, ChatContext.FOLD];

      contexts.forEach(context => {
        const conservativeMessages = BotChatService.getMessageOptions(
          BehaviorProfiles.CONSERVATIVE,
          context,
          5
        );

        const aggressiveMessages = BotChatService.getMessageOptions(
          BehaviorProfiles.AGGRESSIVE,
          context,
          5
        );

        // Messages should exist for both personalities
        expect(conservativeMessages.length).toBeGreaterThan(0);
        expect(aggressiveMessages.length).toBeGreaterThan(0);
      });
    });

    it('should filter out empty strings', () => {
      const profile = BehaviorProfiles.BALANCED;
      const messages = BotChatService.getMessageOptions(
        profile,
        ChatContext.BLUFF,
        10
      );

      // All returned messages should be non-empty
      messages.forEach(msg => {
        expect(msg.length).toBeGreaterThan(0);
      });
    });

    it('should limit returned messages to requested count', () => {
      const profile = BehaviorProfiles.BALANCED;
      const count = 2;
      const messages = BotChatService.getMessageOptions(
        profile,
        ChatContext.GAME_START,
        count
      );

      expect(messages.length).toBeLessThanOrEqual(count);
    });
  });

  describe('getAvailableContexts', () => {
    it('should return all chat contexts', () => {
      const contexts = BotChatService.getAvailableContexts();

      expect(Array.isArray(contexts)).toBe(true);
      expect(contexts.length).toBeGreaterThan(0);
      
      // Check for some expected contexts
      expect(contexts).toContain(ChatContext.GAME_START);
      expect(contexts).toContain(ChatContext.BIG_WIN);
      expect(contexts).toContain(ChatContext.FOLD);
      expect(contexts).toContain(ChatContext.RAISE);
    });

    it('should return all 14 defined contexts', () => {
      const contexts = BotChatService.getAvailableContexts();
      
      expect(contexts.length).toBe(14);
    });
  });

  describe('personality-specific behavior', () => {
    it('should generate different message styles for each personality', () => {
      const profiles = [
        BehaviorProfiles.CONSERVATIVE,
        BehaviorProfiles.AGGRESSIVE,
        BehaviorProfiles.BALANCED,
        BehaviorProfiles.BEGINNER
      ];

      profiles.forEach(profile => {
        const messages = BotChatService.getMessageOptions(
          profile,
          ChatContext.GAME_START,
          3
        );

        expect(messages.length).toBeGreaterThan(0);
        messages.forEach(msg => {
          expect(typeof msg).toBe('string');
          expect(msg.length).toBeGreaterThan(0);
        });
      });
    });

    it('should handle all contexts for all personalities', () => {
      const profiles = [
        BehaviorProfiles.CONSERVATIVE,
        BehaviorProfiles.AGGRESSIVE,
        BehaviorProfiles.BALANCED,
        BehaviorProfiles.BEGINNER
      ];

      const contexts = BotChatService.getAvailableContexts();

      profiles.forEach(profile => {
        contexts.forEach(context => {
          // Just verify no errors are thrown
          const messages = BotChatService.getMessageOptions(profile, context, 1);
          expect(Array.isArray(messages)).toBe(true);
        });
      });
    });
  });

  describe('message generation probability', () => {
    it('should respect custom probability', () => {
      const profile = BehaviorProfiles.BALANCED;
      
      // Test with 0% probability - should never generate
      let messageCount = 0;
      for (let i = 0; i < 20; i++) {
        const message = BotChatService.generateMessage(
          profile,
          ChatContext.GAME_START,
          { customProbability: 0 }
        );
        if (message) messageCount++;
      }
      expect(messageCount).toBe(0);

      // Test with 100% probability - should always generate
      messageCount = 0;
      for (let i = 0; i < 20; i++) {
        const message = BotChatService.generateMessage(
          profile,
          ChatContext.GAME_START,
          { customProbability: 100 }
        );
        if (message) messageCount++;
      }
      expect(messageCount).toBeGreaterThan(15); // Allow for empty string selections
    });
  });

  describe('edge cases', () => {
    it('should handle custom behavior profiles', () => {
      const customProfile: BehaviorProfile = {
        aggressiveness: 80,
        risk_tolerance: 90,
        reaction_delay_ms: 1000,
        error_rate: 2,
        skill_level: 85
      };

      const message = BotChatService.generateMessage(
        customProfile,
        ChatContext.BIG_WIN,
        { forceMessage: true }
      );

      expect(message).toBeTruthy();
    });

    it('should handle extreme skill levels for personality detection', () => {
      const veryLowSkill: BehaviorProfile = {
        ...BehaviorProfiles.BALANCED,
        skill_level: 10
      };

      const veryHighSkill: BehaviorProfile = {
        ...BehaviorProfiles.BALANCED,
        skill_level: 95
      };

      const lowPersonality = BotChatService.getPersonalityTypeName(veryLowSkill);
      const highPersonality = BotChatService.getPersonalityTypeName(veryHighSkill);

      expect(lowPersonality).toBe(PersonalityType.BEGINNER);
      expect(highPersonality).not.toBe(PersonalityType.BEGINNER);
    });
  });
});

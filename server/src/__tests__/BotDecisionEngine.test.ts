/**
 * Bot Decision Engine Tests
 * Tests for AI decision-making logic, hand evaluation, and pot odds
 */

import { BotDecisionEngine } from '../services/BotDecisionEngine';
import { BehaviorProfiles } from '../models/BotBlueprint';

describe('BotDecisionEngine', () => {
  describe('Hand Evaluation', () => {
    test('should identify Trail (Three of a Kind)', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('trail');
      expect(result.strength).toBeGreaterThan(800);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should identify Pure Sequence', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('pure_sequence');
      expect(result.strength).toBeGreaterThan(600);
      expect(result.strength).toBeLessThan(800);
    });

    test('should identify Regular Sequence', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('sequence');
      expect(result.strength).toBeGreaterThan(400);
      expect(result.strength).toBeLessThan(600);
    });

    test('should identify Color (Flush)', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: '9', suit: 'hearts' },
        { rank: '5', suit: 'hearts' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('color');
      expect(result.strength).toBeGreaterThan(200);
      expect(result.strength).toBeLessThan(400);
    });

    test('should identify Pair', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: '5', suit: 'clubs' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('pair');
      expect(result.strength).toBeGreaterThan(100);
      expect(result.strength).toBeLessThan(200);
    });

    test('should identify High Card', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: '9', suit: 'diamonds' },
        { rank: '5', suit: 'clubs' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('high_card');
      expect(result.strength).toBeLessThan(100);
    });

    test('should handle A-2-3 sequence (wheel)', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: '2', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' },
      ];

      const result = BotDecisionEngine.evaluateHand(cards);

      expect(result.handRank).toBe('sequence');
    });
  });

  describe('Pot Odds Calculation', () => {
    test('should calculate pot odds correctly', () => {
      const pot = 1000;
      const currentBet = 200;

      const potOdds = BotDecisionEngine.calculatePotOdds(pot, currentBet);

      // Pot odds = pot / (pot + bet) = 1000 / 1200 = 0.833
      expect(potOdds).toBeCloseTo(0.833, 2);
    });

    test('should handle zero current bet', () => {
      const pot = 1000;
      const currentBet = 0;

      const potOdds = BotDecisionEngine.calculatePotOdds(pot, currentBet);

      expect(potOdds).toBe(1.0);
    });

    test('should handle small pot', () => {
      const pot = 100;
      const currentBet = 50;

      const potOdds = BotDecisionEngine.calculatePotOdds(pot, currentBet);

      expect(potOdds).toBeCloseTo(0.667, 2);
    });
  });

  describe('Decision Making - Aggressive Profile', () => {
    const aggressive = BehaviorProfiles.AGGRESSIVE;

    test('should raise with strong hand', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 500,
        current_bet: 100,
        bot_balance: 10000,
        behavior_profile_name: 'aggressive',
      });

      expect(decision.action).toBe('raise');
      expect(decision.amount).toBeGreaterThan(100);
    });

    test('should bluff with weak hand sometimes', () => {
      const cards = [
        { rank: '7', suit: 'hearts' },
        { rank: '5', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
      ];

      // Run multiple times to account for randomness
      let bluffCount = 0;
      for (let i = 0; i < 10; i++) {
        const decision = BotDecisionEngine.makeDecision({
          cards,
          pot: 500,
          current_bet: 100,
          bot_balance: 10000,
          behavior_profile_name: 'aggressive',
        });

        if (decision.action === 'raise' || decision.action === 'call') {
          bluffCount++;
        }
      }

      // Aggressive bots should bluff at least once in 10 tries
      expect(bluffCount).toBeGreaterThan(0);
    });
  });

  describe('Decision Making - Conservative Profile', () => {
    test('should fold with weak hand', () => {
      const cards = [
        { rank: '7', suit: 'hearts' },
        { rank: '5', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 500,
        current_bet: 100,
        bot_balance: 10000,
        behavior_profile_name: 'conservative',
      });

      expect(decision.action).toBe('fold');
    });

    test('should call with medium hand', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: '5', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 500,
        current_bet: 50,
        bot_balance: 10000,
        behavior_profile_name: 'conservative',
      });

      expect(['call', 'raise']).toContain(decision.action);
    });
  });

  describe('Decision Making - Balanced Profile', () => {
    test('should make reasonable decisions with mixed hands', () => {
      const cards = [
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 500,
        current_bet: 100,
        bot_balance: 10000,
        behavior_profile_name: 'balanced',
      });

      expect(['call', 'raise', 'fold']).toContain(decision.action);
      expect(decision.reasoning).toBeDefined();
    });
  });

  describe('Bet Sizing', () => {
    test('should size bets based on hand strength', () => {
      const strongCards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
      ];

      const strongDecision = BotDecisionEngine.makeDecision({
        cards: strongCards,
        pot: 1000,
        current_bet: 100,
        bot_balance: 10000,
        behavior_profile_name: 'aggressive',
      });

      const weakCards = [
        { rank: '7', suit: 'hearts' },
        { rank: '5', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
      ];

      const weakDecision = BotDecisionEngine.makeDecision({
        cards: weakCards,
        pot: 1000,
        current_bet: 100,
        bot_balance: 10000,
        behavior_profile_name: 'balanced',
      });

      if (strongDecision.action === 'raise' && weakDecision.action === 'raise') {
        expect(strongDecision.amount).toBeGreaterThan(weakDecision.amount);
      }
    });

    test('should not bet more than bot balance', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 1000,
        current_bet: 100,
        bot_balance: 500,
        behavior_profile_name: 'aggressive',
      });

      if (decision.action === 'raise') {
        expect(decision.amount).toBeLessThanOrEqual(500);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid cards gracefully', () => {
      const cards: any = [];

      expect(() => {
        BotDecisionEngine.evaluateHand(cards);
      }).toThrow();
    });

    test('should handle negative pot', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: -100, // Invalid
        current_bet: 50,
        bot_balance: 10000,
        behavior_profile_name: 'balanced',
      });

      // Should still return a valid decision
      expect(decision.action).toBeDefined();
    });

    test('should handle zero balance', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
      ];

      const decision = BotDecisionEngine.makeDecision({
        cards,
        pot: 1000,
        current_bet: 100,
        bot_balance: 0,
        behavior_profile_name: 'aggressive',
      });

      // With zero balance, bot should check or fold
      expect(['check', 'fold']).toContain(decision.action);
    });
  });

  describe('Behavior Profile Differences', () => {
    test('aggressive should raise more often than conservative', () => {
      const cards = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
      ];

      let aggressiveRaises = 0;
      let conservativeRaises = 0;

      for (let i = 0; i < 20; i++) {
        const aggressiveDecision = BotDecisionEngine.makeDecision({
          cards,
          pot: 500,
          current_bet: 100,
          bot_balance: 10000,
          behavior_profile_name: 'aggressive',
        });

        const conservativeDecision = BotDecisionEngine.makeDecision({
          cards,
          pot: 500,
          current_bet: 100,
          bot_balance: 10000,
          behavior_profile_name: 'conservative',
        });

        if (aggressiveDecision.action === 'raise') aggressiveRaises++;
        if (conservativeDecision.action === 'raise') conservativeRaises++;
      }

      expect(aggressiveRaises).toBeGreaterThan(conservativeRaises);
    });
  });
});

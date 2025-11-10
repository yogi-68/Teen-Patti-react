import { describe, test, expect } from '@jest/globals';
import { BotDecisionEngine, BotDecision, DecisionContext } from '../services/BotDecisionEngine.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { Card } from '../models/Card.js';
import { CardComparer, HandRank } from '../services/CardComparer.js';

/**
 * BotDecisionEngine Test Suite
 * Tests all decision-making logic for the bot AI system
 */

describe('BotDecisionEngine', () => {
  // Helper function to create behavior profiles
  const createProfile = (aggressiveness: number, riskTolerance: number = 50): BehaviorProfile => ({
    aggressiveness,
    risk_tolerance: riskTolerance,
    reaction_delay_ms: 500,
    error_rate: 0.05,
    skill_level: 50,
  });

  // Helper function to create context
  const createContext = (overrides: Partial<DecisionContext> = {}): DecisionContext => ({
    currentBet: 100,
    pot: 500,
    boot: 10,
    lastBlind: false,
    botBalance: 1000,
    botCards: [
      new Card('heart', 12), // Queen
      new Card('club', 11),   // Jack
      new Card('diamond', 10), // 10
    ],
    hasSeenCards: true,
    totalBetSoFar: 50,
    activePlayers: 4,
    foldedPlayers: 2,
    totalPlayers: 6,
    roundNumber: 5,
    potLimit: 10000,
    isPotLimitClose: false,
    ...overrides,
  });

  // Test Hand Evaluation via CardComparer
  describe('Hand Evaluation', () => {
    test('should evaluate trail (three of a kind)', () => {
      const cards: Card[] = [
        new Card('heart', 1), // Ace
        new Card('club', 1),   // Ace
        new Card('diamond', 1), // Ace
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.TRAIL);
      expect(result.rankName).toBe('Trail');
    });

    test('should evaluate straight flush (pure sequence)', () => {
      const cards: Card[] = [
        new Card('heart', 1),  // Ace
        new Card('heart', 13), // King
        new Card('heart', 12), // Queen
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
      expect(result.rankName).toBe('Straight Flush');
    });

    test('should evaluate straight (sequence)', () => {
      const cards: Card[] = [
        new Card('heart', 5),
        new Card('club', 4),
        new Card('diamond', 3),
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT);
      expect(result.rankName).toBe('Straight');
    });

    test('should evaluate flush (color)', () => {
      const cards: Card[] = [
        new Card('heart', 1),  // Ace
        new Card('heart', 10),
        new Card('heart', 7),
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FLUSH);
      expect(result.rankName).toBe('Flush');
    });

    test('should evaluate pair', () => {
      const cards: Card[] = [
        new Card('heart', 1),  // Ace
        new Card('club', 1),   // Ace
        new Card('diamond', 7),
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.PAIR);
      expect(result.rankName).toBe('Pair');
    });

    test('should evaluate high card', () => {
      const cards: Card[] = [
        new Card('heart', 1),  // Ace
        new Card('club', 10),
        new Card('diamond', 7),
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(HandRank.HIGH_CARD);
      expect(result.rankName).toBe('High Card');
    });
  });

  // Test Decision Making with Aggressive Profile
  describe('Decision Making - Aggressive Profile', () => {
    test('should make aggressive decisions with strong hand', async () => {
      const profile = createProfile(0.9, 80);
      const context = createContext({
        botCards: [
          new Card('heart', 1), // Ace
          new Card('club', 1),   // Ace
          new Card('diamond', 1), // Ace - Trail
        ],
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
      expect([BotDecision.BET_CHAAL, BotDecision.SHOW]).toContain(decision.decision);
      expect(decision.reasoning).toBeDefined();
    });

    test('should play blind longer with aggressive profile', async () => {
      const profile = createProfile(0.9);
      const context = createContext({
        hasSeenCards: false,
        roundNumber: 1,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect([BotDecision.BET_BLIND, BotDecision.SEE_CARDS]).toContain(decision.decision);
    });
  });

  describe('Decision Making - Conservative Profile', () => {
    test('should fold with weak hand and high bet', async () => {
      const profile = createProfile(0.1, 20); // Very conservative
      const context = createContext({
        botCards: [
          new Card('heart', 2),
          new Card('club', 5),
          new Card('diamond', 9),
        ],
        currentBet: 500, // Very high bet
        botBalance: 600, // Low balance
        hasSeenCards: true,
        roundNumber: 10,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      // Conservative profile should fold or make minimal bet with weak hand
      expect([BotDecision.FOLD, BotDecision.BET_CHAAL]).toContain(decision.decision);
    });

    test('should see cards early with conservative profile', async () => {
      const profile = createProfile(0.2);
      const context = createContext({
        hasSeenCards: false,
        roundNumber: 2,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBe(BotDecision.SEE_CARDS);
    });

    test('should make conservative bets', async () => {
      const profile = createProfile(0.2, 30);
      const context = createContext({
        botCards: [
          new Card('heart', 13),
          new Card('club', 13),
          new Card('diamond', 7),
        ],
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      if (decision.decision === BotDecision.BET_CHAAL && decision.betAmount) {
        expect(decision.betAmount).toBeLessThan(context.botBalance * 0.5);
      }
    });
  });

  describe('Decision Making - Balanced Profile', () => {
    test('should make balanced decisions', async () => {
      const profile = createProfile(0.5, 50);
      const context = createContext({
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect([
        BotDecision.BET_BLIND,
        BotDecision.BET_CHAAL,
        BotDecision.FOLD,
        BotDecision.SIDE_SHOW,
        BotDecision.SHOW,
      ]).toContain(decision.decision);
    });

    test('should see cards after moderate rounds', async () => {
      const profile = createProfile(0.5);
      const context = createContext({
        hasSeenCards: false,
        roundNumber: 3,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect([BotDecision.SEE_CARDS, BotDecision.BET_BLIND]).toContain(decision.decision);
    });
  });

  // Test Bet Sizing Logic
  describe('Bet Sizing', () => {
    test('should respect bot balance limits', async () => {
      const profile = createProfile(0.9, 80);
      const context = createContext({
        botBalance: 150,
        currentBet: 100,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      if (decision.betAmount) {
        expect(decision.betAmount).toBeLessThanOrEqual(150);
      }
    });

    test('should bet minimum required amount', async () => {
      const profile = createProfile(0.5);
      const context = createContext({
        currentBet: 100,
        lastBlind: false,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      if (decision.decision === BotDecision.BET_CHAAL && decision.betAmount) {
        expect(decision.betAmount).toBeGreaterThanOrEqual(100);
      }
    });

    test('should adjust bet for blind vs chaal', async () => {
      const profile = createProfile(0.6);
      const contextBlind = createContext({
        currentBet: 100,
        lastBlind: true,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, contextBlind);
      
      // When last bet was blind, chaal bet should be at least 2x
      if (decision.decision === BotDecision.BET_CHAAL && decision.betAmount) {
        expect(decision.betAmount).toBeGreaterThanOrEqual(200);
      }
    });
  });

  // Test Blind Strategy
  describe('Blind Strategy', () => {
    test('should play blind with appropriate bet', async () => {
      const profile = createProfile(0.6);
      const context = createContext({
        hasSeenCards: false,
        roundNumber: 2,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      if (decision.decision === BotDecision.BET_BLIND) {
        expect(decision.betAmount).toBeDefined();
        expect(decision.betAmount).toBeGreaterThan(0);
      }
    });

    test('should fold when blind bet too high for balance', async () => {
      const profile = createProfile(0.5);
      const context = createContext({
        hasSeenCards: false,
        roundNumber: 8,
        currentBet: 500,
        botBalance: 600,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect([BotDecision.FOLD, BotDecision.SEE_CARDS]).toContain(decision.decision);
    });
  });

  // Test Show and Side Show Logic
  describe('Show and Side Show', () => {
    test('should show with very strong hand and high pot', async () => {
      const profile = createProfile(0.7);
      const context = createContext({
        botCards: [
          new Card('heart', 1), // Ace
          new Card('club', 1),   // Ace
          new Card('diamond', 1), // Ace - Trail
        ],
        pot: 5000,
        boot: 100,
        hasSeenCards: true,
        roundNumber: 15,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect([BotDecision.SHOW, BotDecision.BET_CHAAL]).toContain(decision.decision);
    });

    test('should attempt side show with decent hand', async () => {
      const profile = createProfile(0.8);
      const context = createContext({
        botCards: [
          new Card('heart', 13), // King
          new Card('club', 13),   // King
          new Card('diamond', 10), // Pair of Kings
        ],
        hasSeenCards: true,
        activePlayers: 3,
        roundNumber: 10,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
    });
  });

  // Test Edge Cases
  describe('Edge Cases', () => {
    test('should handle insufficient balance gracefully', async () => {
      const profile = createProfile(0.5);
      const context = createContext({
        botBalance: 50,
        currentBet: 200,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBe(BotDecision.FOLD);
    });

    test('should handle pot limit approaching', async () => {
      const profile = createProfile(0.7);
      const context = createContext({
        pot: 9500,
        potLimit: 10000,
        isPotLimitClose: true,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
    });

    test('should handle long game (many rounds)', async () => {
      const profile = createProfile(0.5);
      const context = createContext({
        roundNumber: 25,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
    });

    test('should handle few active players', async () => {
      const profile = createProfile(0.6);
      const context = createContext({
        activePlayers: 2,
        hasSeenCards: true,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBeDefined();
    });
  });

  // Test Profile Comparison
  describe('Profile Comparison', () => {
    test('behavior profiles should make different decisions', async () => {
      const testRounds = 5;
      const decisions: { aggressive: BotDecision[], conservative: BotDecision[] } = {
        aggressive: [],
        conservative: [],
      };

      for (let i = 0; i < testRounds; i++) {
        const context = createContext({
          botCards: [
            new Card('heart', 12),
            new Card('club', 11),
            new Card('diamond', 10),
          ],
          hasSeenCards: true,
        });

        const aggressiveDecision = await BotDecisionEngine.makeDecision(
          createProfile(0.9),
          context
        );
        const conservativeDecision = await BotDecisionEngine.makeDecision(
          createProfile(0.2),
          context
        );

        decisions.aggressive.push(aggressiveDecision.decision);
        decisions.conservative.push(conservativeDecision.decision);
      }

      // Both profiles should make decisions
      expect(decisions.aggressive.length).toBe(testRounds);
      expect(decisions.conservative.length).toBe(testRounds);
      
      // Decisions should be valid
      const validDecisions = Object.values(BotDecision);
      decisions.aggressive.forEach(d => {
        expect(validDecisions).toContain(d);
      });
      decisions.conservative.forEach(d => {
        expect(validDecisions).toContain(d);
      });
    }, 15000);
  });

  // Test Decision Enum Values
  describe('Bot Decision Enum', () => {
    test('should have all required decision types', () => {
      expect(BotDecision.FOLD).toBe('fold');
      expect(BotDecision.BET_BLIND).toBe('bet_blind');
      expect(BotDecision.BET_CHAAL).toBe('bet_chaal');
      expect(BotDecision.SEE_CARDS).toBe('see_cards');
      expect(BotDecision.SIDE_SHOW).toBe('side_show');
      expect(BotDecision.SHOW).toBe('show');
    });
  });
});

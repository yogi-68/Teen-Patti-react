import { describe, test, expect } from '@jest/globals';
import { BotDecisionEngine, BotDecision, DecisionContext } from '../services/BotDecisionEngine.js';
import { BehaviorProfile } from '../models/BotBlueprint.js';
import { Card } from '../models/Card.js';
import { CardComparer } from '../services/CardComparer.js';

/**
 * BotDecisionEngine Test Suite
 * Tests all decision-making logic for the bot AI system
 */

describe('BotDecisionEngine', () => {
  // Helper function to create behavior profiles
  const createProfile = (aggressiveness: number, riskTolerance: number = 50): BehaviorProfile => ({
    aggressiveness,
    risk_tolerance: riskTolerance,
    bluff_frequency: aggressiveness * 0.3,
    fold_threshold: 0.3 - (aggressiveness * 0.1),
    error_rate: 0.05,
    reaction_delay_ms: 500,
  });

  // Helper function to create context
  const createContext = (overrides: Partial<DecisionContext> = {}): DecisionContext => ({
    currentBet: 100,
    pot: 500,
    boot: 10,
    lastBlind: false,
    botBalance: 1000,
    botCards: [
      { suit: 'Hearts', rank: 'Q', priority: 12 },
      { suit: 'Clubs', rank: 'J', priority: 11 },
      { suit: 'Diamonds', rank: '10', priority: 10 },
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
        { suit: 'Hearts', rank: 'A', priority: 14 },
        { suit: 'Clubs', rank: 'A', priority: 14 },
        { suit: 'Diamonds', rank: 'A', priority: 14 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(6); // Trail is rank 6
      expect(result.description).toContain('Trail');
    });

    test('should evaluate pure sequence', () => {
      const cards: Card[] = [
        { suit: 'Hearts', rank: 'A', priority: 14 },
        { suit: 'Hearts', rank: 'K', priority: 13 },
        { suit: 'Hearts', rank: 'Q', priority: 12 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(5); // Pure Sequence is rank 5
      expect(result.description).toContain('Pure Sequence');
    });

    test('should evaluate sequence', () => {
      const cards: Card[] = [
        { suit: 'Hearts', rank: '5', priority: 5 },
        { suit: 'Clubs', rank: '4', priority: 4 },
        { suit: 'Diamonds', rank: '3', priority: 3 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(4); // Sequence is rank 4
      expect(result.description).toContain('Sequence');
    });

    test('should evaluate color (flush)', () => {
      const cards: Card[] = [
        { suit: 'Hearts', rank: 'A', priority: 14 },
        { suit: 'Hearts', rank: '10', priority: 10 },
        { suit: 'Hearts', rank: '7', priority: 7 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(3); // Color is rank 3
      expect(result.description).toContain('Color');
    });

    test('should evaluate pair', () => {
      const cards: Card[] = [
        { suit: 'Hearts', rank: 'A', priority: 14 },
        { suit: 'Clubs', rank: 'A', priority: 14 },
        { suit: 'Diamonds', rank: '7', priority: 7 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(2); // Pair is rank 2
      expect(result.description).toContain('Pair');
    });

    test('should evaluate high card', () => {
      const cards: Card[] = [
        { suit: 'Hearts', rank: 'A', priority: 14 },
        { suit: 'Clubs', rank: '10', priority: 10 },
        { suit: 'Diamonds', rank: '7', priority: 7 },
      ];
      const result = CardComparer.evaluateHand(cards);
      expect(result.rank).toBe(1); // High Card is rank 1
      expect(result.description).toContain('High Card');
    });
  });

  // Test Decision Making with Aggressive Profile
  describe('Decision Making - Aggressive Profile', () => {
    test('should make aggressive decisions with strong hand', async () => {
      const profile = createProfile(0.9, 80);
      const context = createContext({
        botCards: [
          { suit: 'Hearts', rank: 'A', priority: 14 },
          { suit: 'Clubs', rank: 'A', priority: 14 },
          { suit: 'Diamonds', rank: 'A', priority: 14 },
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
      const profile = createProfile(0.2, 30);
      const context = createContext({
        botCards: [
          { suit: 'Hearts', rank: '2', priority: 2 },
          { suit: 'Clubs', rank: '5', priority: 5 },
          { suit: 'Diamonds', rank: '9', priority: 9 },
        ],
        currentBet: 300,
        hasSeenCards: true,
        roundNumber: 8,
      });

      const decision = await BotDecisionEngine.makeDecision(profile, context);
      
      expect(decision.decision).toBe(BotDecision.FOLD);
      expect(decision.reasoning).toContain('Weak hand');
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
          { suit: 'Hearts', rank: 'K', priority: 13 },
          { suit: 'Clubs', rank: 'K', priority: 13 },
          { suit: 'Diamonds', rank: '7', priority: 7 },
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
          { suit: 'Hearts', rank: 'A', priority: 14 },
          { suit: 'Clubs', rank: 'A', priority: 14 },
          { suit: 'Diamonds', rank: 'A', priority: 14 },
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
          { suit: 'Hearts', rank: 'K', priority: 13 },
          { suit: 'Clubs', rank: 'K', priority: 13 },
          { suit: 'Diamonds', rank: '10', priority: 10 },
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
    test('aggressive should bet more often than conservative', async () => {
      let aggressiveBets = 0;
      let conservativeBets = 0;

      const testRounds = 10;

      for (let i = 0; i < testRounds; i++) {
        const context = createContext({
          botCards: [
            { suit: 'Hearts', rank: 'Q', priority: 12 },
            { suit: 'Clubs', rank: 'J', priority: 11 },
            { suit: 'Diamonds', rank: '10', priority: 10 },
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

        if (
          aggressiveDecision.decision === BotDecision.BET_CHAAL ||
          aggressiveDecision.decision === BotDecision.BET_BLIND
        ) {
          aggressiveBets++;
        }

        if (
          conservativeDecision.decision === BotDecision.BET_CHAAL ||
          conservativeDecision.decision === BotDecision.BET_BLIND
        ) {
          conservativeBets++;
        }
      }

      // Aggressive bots should bet more often
      expect(aggressiveBets).toBeGreaterThanOrEqual(conservativeBets);
    });
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

import { CardComparer } from '../services/CardComparer.js';
import { Card, CardType } from '../models/Card.js';

describe('CardComparer', () => {
  // Helper to create cards
  const createCard = (type: CardType, rank: number): Card => new Card(type, rank as any);

  describe('Hand Evaluation', () => {
    test('should evaluate Trail (Three of a Kind)', () => {
      const cards = [
        createCard('heart', 5),
        createCard('club', 5),
        createCard('diamond', 5),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(6);
      expect(result.rankName).toBe('Trail');
      expect(result.score).toBeGreaterThan(0);
      expect(result.cards).toHaveLength(3);
    });

    test('should evaluate Straight Flush (Pure Sequence)', () => {
      const cards = [
        createCard('heart', 7),
        createCard('heart', 8),
        createCard('heart', 9),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(5);
      expect(result.rankName).toBe('Straight Flush');
      expect(result.cards).toHaveLength(3);
    });

    test('should evaluate Straight Flush with Ace-2-3', () => {
      const cards = [
        createCard('spade', 1), // Ace
        createCard('spade', 2),
        createCard('spade', 3),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(5);
      expect(result.rankName).toBe('Straight Flush');
    });

    test('should evaluate Straight (Sequence)', () => {
      const cards = [
        createCard('heart', 4),
        createCard('club', 5),
        createCard('diamond', 6),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(4);
      expect(result.rankName).toBe('Straight');
    });

    test('should evaluate Flush (Color)', () => {
      const cards = [
        createCard('diamond', 2),
        createCard('diamond', 7),
        createCard('diamond', 11), // Jack
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(3);
      expect(result.rankName).toBe('Flush');
    });

    test('should evaluate Pair', () => {
      const cards = [
        createCard('heart', 10),
        createCard('club', 10),
        createCard('diamond', 3),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(2);
      expect(result.rankName).toBe('Pair');
      expect(result.score).toBeGreaterThan(0);
    });

    test('should evaluate High Card', () => {
      const cards = [
        createCard('heart', 2),
        createCard('club', 7),
        createCard('spade', 13), // King
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(1);
      expect(result.rankName).toBe('High Card');
    });

    test('should handle Ace as high card (priority 14)', () => {
      const cards = [
        createCard('heart', 1), // Ace
        createCard('club', 9),
        createCard('diamond', 5),
      ];

      const result = CardComparer.evaluateHand(cards);

      expect(result.rank).toBe(1);
      expect(result.rankName).toBe('High Card');
      // Ace should have highest priority
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Hand Comparison', () => {
    test('Trail should beat Straight Flush', () => {
      const trail = [
        createCard('heart', 3),
        createCard('club', 3),
        createCard('diamond', 3),
      ];

      const pureSeq = [
        createCard('spade', 7),
        createCard('spade', 8),
        createCard('spade', 9),
      ];

      const result = CardComparer.compareHands(trail, pureSeq);
      expect(result).toBeGreaterThan(0); // trail wins
    });

    test('Straight Flush should beat Straight', () => {
      const pureSeq = [
        createCard('heart', 4),
        createCard('heart', 5),
        createCard('heart', 6),
      ];

      const sequence = [
        createCard('heart', 10),
        createCard('club', 11),
        createCard('diamond', 12),
      ];

      const result = CardComparer.compareHands(pureSeq, sequence);
      expect(result).toBeGreaterThan(0); // straight flush wins
    });

    test('should compare same rank by high card', () => {
      const highPair = [
        createCard('heart', 13), // King pair
        createCard('club', 13),
        createCard('diamond', 2),
      ];

      const lowPair = [
        createCard('heart', 5), // 5 pair
        createCard('club', 5),
        createCard('spade', 10),
      ];

      const result = CardComparer.compareHands(highPair, lowPair);
      expect(result).toBeGreaterThan(0); // king pair wins
    });

    test('should compare identical pairs by kicker', () => {
      const pairWithHighKicker = [
        createCard('heart', 9),
        createCard('club', 9),
        createCard('diamond', 13), // King kicker
      ];

      const pairWithLowKicker = [
        createCard('heart', 9),
        createCard('spade', 9),
        createCard('club', 2), // 2 kicker
      ];

      const result = CardComparer.compareHands(pairWithHighKicker, pairWithLowKicker);
      expect(result).toBeGreaterThan(0); // high kicker wins
    });

    test('should handle identical hands correctly', () => {
      const hand1 = [
        createCard('heart', 7),
        createCard('club', 7),
        createCard('diamond', 3),
      ];

      const hand2 = [
        createCard('heart', 9),
        createCard('club', 9),
        createCard('diamond', 2),
      ];

      const result = CardComparer.compareHands(hand1, hand2);
      expect(result).toBeLessThan(0); // 9-pair beats 7-pair
    });
  });

  describe('Special Sequences', () => {
    test('should recognize A-2-3 as valid straight', () => {
      const aceSequence = [
        createCard('heart', 1),
        createCard('club', 2),
        createCard('diamond', 3),
      ];

      const result = CardComparer.evaluateHand(aceSequence);
      expect(result.rank).toBe(4); // Straight
      expect(result.rankName).toBe('Straight');
    });

    test('should recognize Q-K-A as valid straight', () => {
      const topSequence = [
        createCard('heart', 12), // Queen
        createCard('club', 13),  // King
        createCard('diamond', 1), // Ace
      ];

      const result = CardComparer.evaluateHand(topSequence);
      expect(result.rank).toBe(4); // Straight
      expect(result.rankName).toBe('Straight');
    });

    test('should NOT recognize K-A-2 as straight', () => {
      const invalidSequence = [
        createCard('heart', 13), // King
        createCard('club', 1),   // Ace
        createCard('diamond', 2),
      ];

      const result = CardComparer.evaluateHand(invalidSequence);
      expect(result.rank).not.toBe(4); // Not a straight
      expect(result.rank).toBe(1); // High card (Ace)
    });
  });

  describe('Edge Cases', () => {
    test('should handle unsorted cards', () => {
      const unsortedTrail = [
        createCard('diamond', 7),
        createCard('heart', 7),
        createCard('club', 7),
      ];

      const result = CardComparer.evaluateHand(unsortedTrail);
      expect(result.rank).toBe(6); // Trail
    });

    test('should handle all same suit but not straight (Flush)', () => {
      const color = [
        createCard('spade', 2),
        createCard('spade', 5),
        createCard('spade', 11),
      ];

      const result = CardComparer.evaluateHand(color);
      expect(result.rank).toBe(3); // Flush, not Straight Flush
    });

    test('should compare Trails by their rank', () => {
      const aceTrail = [
        createCard('heart', 1),
        createCard('club', 1),
        createCard('diamond', 1),
      ];

      const kingTrail = [
        createCard('heart', 13),
        createCard('club', 13),
        createCard('spade', 13),
      ];

      const result = CardComparer.compareHands(aceTrail, kingTrail);
      expect(result).toBeGreaterThan(0); // Ace trail wins (priority 14 > 13)
    });

    test('should handle minimum hand (2-3-5 different suits)', () => {
      const minHand = [
        createCard('heart', 2),
        createCard('club', 3),
        createCard('diamond', 5),
      ];

      const result = CardComparer.evaluateHand(minHand);
      expect(result.rank).toBe(1); // High Card
      expect(result.score).toBeGreaterThan(0);
    });

    test('should handle maximum hand (AAA)', () => {
      const maxHand = [
        createCard('heart', 1),
        createCard('club', 1),
        createCard('diamond', 1),
      ];

      const result = CardComparer.evaluateHand(maxHand);
      expect(result.rank).toBe(6); // Trail
      expect(result.score).toBeGreaterThan(0); // Ace trail has highest score
    });
  });

  describe('Ranking Order Verification', () => {
    test('Trail > Straight Flush > Straight > Flush > Pair > High Card', () => {
      const trail = CardComparer.evaluateHand([
        createCard('heart', 2),
        createCard('club', 2),
        createCard('diamond', 2),
      ]);

      const straightFlush = CardComparer.evaluateHand([
        createCard('spade', 4),
        createCard('spade', 5),
        createCard('spade', 6),
      ]);

      const straight = CardComparer.evaluateHand([
        createCard('heart', 7),
        createCard('club', 8),
        createCard('diamond', 9),
      ]);

      const flush = CardComparer.evaluateHand([
        createCard('heart', 2),
        createCard('heart', 5),
        createCard('heart', 10),
      ]);

      const pair = CardComparer.evaluateHand([
        createCard('club', 3),
        createCard('diamond', 3),
        createCard('heart', 9),
      ]);

      const highCard = CardComparer.evaluateHand([
        createCard('heart', 2),
        createCard('club', 7),
        createCard('spade', 11),
      ]);

      expect(trail.rank).toBe(6);
      expect(straightFlush.rank).toBe(5);
      expect(straight.rank).toBe(4);
      expect(flush.rank).toBe(3);
      expect(pair.rank).toBe(2);
      expect(highCard.rank).toBe(1);

      // Verify ordering
      expect(trail.rank).toBeGreaterThan(straightFlush.rank);
      expect(straightFlush.rank).toBeGreaterThan(straight.rank);
      expect(straight.rank).toBeGreaterThan(flush.rank);
      expect(flush.rank).toBeGreaterThan(pair.rank);
      expect(pair.rank).toBeGreaterThan(highCard.rank);
    });
  });
});

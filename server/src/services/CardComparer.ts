import type { Card } from '../models/Card.js';

/**
 * Hand ranking enum
 */
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  FLUSH = 3,
  STRAIGHT = 4,
  TRAIL = 5,
  STRAIGHT_FLUSH = 6,
}

/**
 * Hand evaluation result
 */
export interface HandEvaluation {
  rank: HandRank;
  rankName: string;
  cards: Card[];
  score: number;
}

/**
 * Card comparison service for Teen Patti
 */
export class CardComparer {
  /**
   * Evaluate a hand of 3 cards
   */
  static evaluateHand(cards: Card[]): HandEvaluation {
    if (cards.length !== 3) {
      throw new Error('Teen Patti requires exactly 3 cards');
    }

    // Sort cards by priority (descending)
    const sortedCards = [...cards].sort((a, b) => b.priority - a.priority);

    // Check for Trail (Three of a Kind)
    if (this.isTrail(sortedCards)) {
      return {
        rank: HandRank.TRAIL,
        rankName: 'Trail',
        cards: sortedCards,
        score: this.calculateScore(HandRank.TRAIL, sortedCards),
      };
    }

    // Check for Straight Flush
    if (this.isStraightFlush(sortedCards)) {
      return {
        rank: HandRank.STRAIGHT_FLUSH,
        rankName: 'Straight Flush',
        cards: sortedCards,
        score: this.calculateScore(HandRank.STRAIGHT_FLUSH, sortedCards),
      };
    }

    // Check for Straight
    if (this.isStraight(sortedCards)) {
      return {
        rank: HandRank.STRAIGHT,
        rankName: 'Straight',
        cards: sortedCards,
        score: this.calculateScore(HandRank.STRAIGHT, sortedCards),
      };
    }

    // Check for Flush
    if (this.isFlush(sortedCards)) {
      return {
        rank: HandRank.FLUSH,
        rankName: 'Flush',
        cards: sortedCards,
        score: this.calculateScore(HandRank.FLUSH, sortedCards),
      };
    }

    // Check for Pair
    if (this.isPair(sortedCards)) {
      return {
        rank: HandRank.PAIR,
        rankName: 'Pair',
        cards: sortedCards,
        score: this.calculateScore(HandRank.PAIR, sortedCards),
      };
    }

    // High Card
    return {
      rank: HandRank.HIGH_CARD,
      rankName: 'High Card',
      cards: sortedCards,
      score: this.calculateScore(HandRank.HIGH_CARD, sortedCards),
    };
  }

  /**
   * Check if hand is a Trail (Three of a Kind)
   */
  private static isTrail(cards: Card[]): boolean {
    return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
  }

  /**
   * Check if hand is a Straight Flush
   */
  private static isStraightFlush(cards: Card[]): boolean {
    return this.isStraight(cards) && this.isFlush(cards);
  }

  /**
   * Check if hand is a Straight
   */
  private static isStraight(cards: Card[]): boolean {
    const priorities = cards.map((c) => c.priority).sort((a, b) => a - b);
    
    // Check consecutive
    if (priorities[1] === priorities[0] + 1 && priorities[2] === priorities[1] + 1) {
      return true;
    }
    
    // Special case: A-2-3
    if (priorities[0] === 2 && priorities[1] === 3 && priorities[2] === 14) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if hand is a Flush
   */
  private static isFlush(cards: Card[]): boolean {
    return cards[0].type === cards[1].type && cards[1].type === cards[2].type;
  }

  /**
   * Check if hand is a Pair
   */
  private static isPair(cards: Card[]): boolean {
    return (
      cards[0].rank === cards[1].rank ||
      cards[1].rank === cards[2].rank ||
      cards[0].rank === cards[2].rank
    );
  }

  /**
   * Calculate numeric score for comparison
   */
  private static calculateScore(rank: HandRank, cards: Card[]): number {
    // Base score is rank * 1,000,000
    let score = rank * 1000000;

    if (rank === HandRank.TRAIL) {
      // Trail: Add rank value * 10000
      score += cards[0].priority * 10000;
    } else if (rank === HandRank.PAIR) {
      // Find the pair
      let pairRank = 0;
      let kicker = 0;
      
      if (cards[0].rank === cards[1].rank) {
        pairRank = cards[0].priority;
        kicker = cards[2].priority;
      } else if (cards[1].rank === cards[2].rank) {
        pairRank = cards[1].priority;
        kicker = cards[0].priority;
      } else {
        pairRank = cards[0].priority;
        kicker = Math.max(cards[1].priority, cards[2].priority);
      }
      
      score += pairRank * 10000 + kicker * 100;
    } else {
      // For other hands, add card priorities
      score += cards[0].priority * 10000;
      score += cards[1].priority * 100;
      score += cards[2].priority;
    }

    return score;
  }

  /**
   * Compare two hands and return the winner
   * Returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   */
  static compareHands(cards1: Card[], cards2: Card[]): number {
    const eval1 = this.evaluateHand(cards1);
    const eval2 = this.evaluateHand(cards2);

    if (eval1.score > eval2.score) return 1;
    if (eval1.score < eval2.score) return -1;

    // If scores are equal, compare by highest card type
    for (let i = 0; i < 3; i++) {
      const type1Priority = eval1.cards[i].getTypePriority();
      const type2Priority = eval2.cards[i].getTypePriority();
      
      if (type1Priority > type2Priority) return 1;
      if (type1Priority < type2Priority) return -1;
    }

    return 0; // Complete tie
  }

  /**
   * Find the winner among multiple players
   */
  static findWinner(playerHands: Map<string, Card[]>): {
    winnerId: string;
    winnerHand: HandEvaluation;
    allEvaluations: Map<string, HandEvaluation>;
  } {
    const evaluations = new Map<string, HandEvaluation>();
    
    // Evaluate all hands
    playerHands.forEach((cards, playerId) => {
      evaluations.set(playerId, this.evaluateHand(cards));
    });

    // Find the best hand
    let winnerId = '';
    let bestScore = -1;

    evaluations.forEach((evaluation, playerId) => {
      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        winnerId = playerId;
      }
    });

    return {
      winnerId,
      winnerHand: evaluations.get(winnerId)!,
      allEvaluations: evaluations,
    };
  }
}

import { Card, CardType, CardRank } from '../models/Card.js';

/**
 * Joker Card Generator - Generates 5 deterministic tier hands
 * 
 * Uses actual Card model: CardType ('heart' | 'spade' | 'diamond' | 'club')
 * CardRank (1-13 where 1=Ace, 11=Jack, 12=Queen, 13=King)
 */

export interface TierHands {
  tier5: Card[]; // Best - AAA Trail
  tier4: Card[]; // AKQ Pure Sequence
  tier3: Card[]; // QQQ Trail or QJT Pure Sequence
  tier2: Card[]; // AKQ Sequence or Color
  tier1: Card[]; // AA+K Pair
}

class JokerCardGenerator {
  // Track used cards to avoid duplicates
  private usedCards: Set<string> = new Set();

  // All available card types
  private readonly allTypes: CardType[] = ['heart', 'diamond', 'club', 'spade'];

  /**
   * Generate all 5 tier hands avoiding dealt cards
   */
  public generateTierHands(dealtCards: Map<string, Card[]>): TierHands {
    this.usedCards.clear();

    // Mark all dealt cards as used
    for (const hand of dealtCards.values()) {
      for (const card of hand) {
        const cardKey = `${card.rank}_${card.type}`;
        this.usedCards.add(cardKey);
      }
    }

    // Generate tiers in order
    let tier5 = this.generateTrail(1, dealtCards); // AAA
    if (!tier5) tier5 = this.generateTrail(13, dealtCards); // KKK fallback

    let tier4 = this.generatePureSequence(1, 'heart', dealtCards); // AKQ hearts
    if (!tier4) tier4 = this.generatePureSequence(11, 'spade', dealtCards); // AKQ spades fallback

    let tier3 = this.generateTrail(12, dealtCards); // QQQ
    if (!tier3) tier3 = this.generatePureSequence(10, 'diamond', dealtCards); // QJT diamonds

    let tier2 = this.generateSequence(1, dealtCards); // AKQ mixed suits
    if (!tier2) tier2 = this.generateColor('club', [1, 13, 12], dealtCards); // AKQ clubs

    let tier1 = this.generatePair(1, 13, dealtCards); // AA+K
    if (!tier1) tier1 = this.generatePair(13, 12, dealtCards); // KK+Q fallback

    // Ensure all tiers exist (fallback to safe defaults)
    if (!tier5) tier5 = [new Card('heart', 1), new Card('diamond', 1), new Card('club', 1)];
    if (!tier4) tier4 = [new Card('heart', 13), new Card('heart', 12), new Card('heart', 11)];
    if (!tier3) tier3 = [new Card('diamond', 12), new Card('club', 12), new Card('spade', 12)];
    if (!tier2) tier2 = [new Card('club', 1), new Card('diamond', 13), new Card('spade', 12)];
    if (!tier1) tier1 = [new Card('spade', 1), new Card('club', 1), new Card('heart', 13)];

    return { tier5, tier4, tier3, tier2, tier1 };
  }

  /**
   * Check if a card is already used
   */
  private isCardUsed(rank: CardRank, type: CardType, dealtCards: Map<string, Card[]>): boolean {
    const cardKey = `${rank}_${type}`;
    return this.usedCards.has(cardKey);
  }

  /**
   * Mark card as used
   */
  private markUsed(card: Card): void {
    const cardKey = `${card.rank}_${card.type}`;
    this.usedCards.add(cardKey);
  }

  /**
   * Generate a Trail (three of a kind)
   */
  private generateTrail(rank: CardRank, dealtCards: Map<string, Card[]>): Card[] | null {
    const availableTypes: CardType[] = [];
    
    for (const type of this.allTypes) {
      if (!this.isCardUsed(rank, type, dealtCards)) {
        availableTypes.push(type);
      }
    }

    if (availableTypes.length < 3) {
      return null;
    }

    const trail: Card[] = availableTypes.slice(0, 3).map(type => new Card(type, rank));
    trail.forEach(card => this.markUsed(card));
    
    return trail;
  }

  /**
   * Generate a Pure Sequence (consecutive same suit)
   */
  private generatePureSequence(startRank: CardRank, type: CardType, dealtCards: Map<string, Card[]>): Card[] | null {
    const sequence: Card[] = [];
    
    // For Ace-high sequence: A=14, K=13, Q=12
    let ranks: CardRank[];
    if (startRank === 1) {
      ranks = [1, 13, 12] as CardRank[]; // A-K-Q
    } else {
      ranks = [startRank, (startRank + 1) as CardRank, (startRank + 2) as CardRank];
    }

    for (const rank of ranks) {
      if (this.isCardUsed(rank, type, dealtCards)) {
        return null;
      }
      const card = new Card(type, rank);
      sequence.push(card);
    }

    sequence.forEach(card => this.markUsed(card));
    return sequence;
  }

  /**
   * Generate a Sequence (consecutive mixed suits)
   */
  private generateSequence(startRank: CardRank, dealtCards: Map<string, Card[]>): Card[] | null {
    const sequence: Card[] = [];
    
    let ranks: CardRank[];
    if (startRank === 1) {
      ranks = [1, 13, 12] as CardRank[]; // A-K-Q
    } else {
      ranks = [startRank, (startRank + 1) as CardRank, (startRank + 2) as CardRank];
    }

    for (const rank of ranks) {
      let foundType: CardType | null = null;
      
      for (const type of this.allTypes) {
        if (!this.isCardUsed(rank, type, dealtCards)) {
          foundType = type;
          break;
        }
      }

      if (!foundType) {
        return null;
      }

      const card = new Card(foundType, rank);
      sequence.push(card);
    }

    sequence.forEach(card => this.markUsed(card));
    return sequence;
  }

  /**
   * Generate a Color (same suit, non-consecutive)
   */
  private generateColor(type: CardType, ranks: CardRank[], dealtCards: Map<string, Card[]>): Card[] | null {
    const color: Card[] = [];

    for (const rank of ranks) {
      if (this.isCardUsed(rank, type, dealtCards)) {
        return null;
      }
      const card = new Card(type, rank);
      color.push(card);
    }

    color.forEach(card => this.markUsed(card));
    return color;
  }

  /**
   * Generate a Pair with kicker
   */
  private generatePair(pairRank: CardRank, kickerRank: CardRank, dealtCards: Map<string, Card[]>): Card[] | null {
    const pair: Card[] = [];
    const pairTypes: CardType[] = [];

    // Find 2 available types for the pair
    for (const type of this.allTypes) {
      if (!this.isCardUsed(pairRank, type, dealtCards)) {
        pairTypes.push(type);
      }
      if (pairTypes.length === 2) break;
    }

    if (pairTypes.length < 2) {
      return null;
    }

    // Add pair cards
    for (const type of pairTypes) {
      const card = new Card(type, pairRank);
      pair.push(card);
    }

    // Find kicker
    let kickerType: CardType | null = null;
    for (const type of this.allTypes) {
      if (!this.isCardUsed(kickerRank, type, dealtCards)) {
        kickerType = type;
        break;
      }
    }

    if (!kickerType) {
      return null;
    }

    const card = new Card(kickerType, kickerRank);
    pair.push(card);

    pair.forEach(card => this.markUsed(card));
    return pair;
  }

  /**
   * Validate no duplicates between tier hands and dealt cards
   */
  public validateNoDuplicates(tierHands: TierHands, dealtCards: Map<string, Card[]>): boolean {
    const allTierCards = [
      ...tierHands.tier5,
      ...tierHands.tier4,
      ...tierHands.tier3,
      ...tierHands.tier2,
      ...tierHands.tier1,
    ];

    const cardSet = new Set<string>();

    // Check tier cards for internal duplicates
    for (const card of allTierCards) {
      const key = `${card.rank}_${card.type}`;
      if (cardSet.has(key)) {
        console.error(`❌ Duplicate in tier hands: ${key}`);
        return false;
      }
      cardSet.add(key);
    }

    // Check against dealt cards
    for (const hand of dealtCards.values()) {
      for (const card of hand) {
        const key = `${card.rank}_${card.type}`;
        if (cardSet.has(key)) {
          console.error(`❌ Tier card conflicts with dealt card: ${key}`);
          return false;
        }
      }
    }

    return true;
  }
}

export const jokerCardGenerator = new JokerCardGenerator();

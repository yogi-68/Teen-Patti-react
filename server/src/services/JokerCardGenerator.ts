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
   * Generate all 5 tier hands that progressively beat existing table hands
   * Strategy: Analyze current hands, generate cards slightly better than the best hand
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

    console.log('🃏 Analyzing existing hands at table...');
    
    // Analyze the strength of existing hands (simplified)
    const existingHands = Array.from(dealtCards.values());
    const hasTrail = existingHands.some(hand => this.isTrail(hand));
    const hasPureSeq = existingHands.some(hand => this.isPureSequence(hand));
    const hasSequence = existingHands.some(hand => this.isSequence(hand));
    const hasColor = existingHands.some(hand => this.isColor(hand));
    const hasPair = existingHands.some(hand => this.isPair(hand));
    
    const bestHandType = hasTrail ? 'trail' : hasPureSeq ? 'pureseq' : hasSequence ? 'sequence' : hasColor ? 'color' : hasPair ? 'pair' : 'highcard';
    console.log(`  Best hand type on table: ${bestHandType}`);

    // Generate tiers based on table strength
    let tier5: Card[] | null = null;
    let tier4: Card[] | null = null;
    let tier3: Card[] | null = null;
    let tier2: Card[] | null = null;
    let tier1: Card[] | null = null;

    // If table has trails, Tier 5 should be a better trail or pure sequence
    if (hasTrail) {
      tier5 = this.findBestTrail(dealtCards);
      if (!tier5) tier5 = this.findBestPureSequence(dealtCards);
      tier4 = this.findBestPureSequence(dealtCards) || this.findBestTrail(dealtCards);
      tier3 = this.findBestSequence(dealtCards) || this.findBestColor(dealtCards);
      tier2 = this.findBestColor(dealtCards) || this.findBestPair(dealtCards);
      tier1 = this.findBestPair(dealtCards) || this.findBestHighCard(dealtCards);
    }
    // If table has pure sequences, generate slightly better hands
    else if (hasPureSeq) {
      tier5 = this.findBestPureSequence(dealtCards) || this.findBestTrail(dealtCards);
      tier4 = this.findBestSequence(dealtCards) || this.findBestPureSequence(dealtCards);
      tier3 = this.findBestColor(dealtCards) || this.findBestSequence(dealtCards);
      tier2 = this.findBestPair(dealtCards) || this.findBestColor(dealtCards);
      tier1 = this.findBestHighCard(dealtCards) || this.findBestPair(dealtCards);
    }
    // If table has sequences
    else if (hasSequence) {
      tier5 = this.findBestSequence(dealtCards) || this.findBestPureSequence(dealtCards);
      tier4 = this.findBestColor(dealtCards) || this.findBestSequence(dealtCards);
      tier3 = this.findBestPair(dealtCards) || this.findBestColor(dealtCards);
      tier2 = this.findBestHighCard(dealtCards, 1) || this.findBestPair(dealtCards); // High Ace
      tier1 = this.findBestHighCard(dealtCards, 13) || this.findBestHighCard(dealtCards, 12); // King or Queen high
    }
    // If table has colors
    else if (hasColor) {
      tier5 = this.findBestColor(dealtCards) || this.findBestSequence(dealtCards);
      tier4 = this.findBestPair(dealtCards) || this.findBestColor(dealtCards);
      tier3 = this.findBestHighCard(dealtCards, 1) || this.findBestPair(dealtCards);
      tier2 = this.findBestHighCard(dealtCards, 13);
      tier1 = this.findBestHighCard(dealtCards, 12);
    }
    // If table has pairs
    else if (hasPair) {
      tier5 = this.findBestPair(dealtCards) || this.findBestColor(dealtCards);
      tier4 = this.findBestHighCard(dealtCards, 1); // Ace high
      tier3 = this.findBestHighCard(dealtCards, 13); // King high
      tier2 = this.findBestHighCard(dealtCards, 12); // Queen high
      tier1 = this.findBestHighCard(dealtCards, 11); // Jack high
    }
    // Table has only high cards - give progressively better high cards
    else {
      tier5 = this.findBestHighCard(dealtCards, 1); // Ace high
      tier4 = this.findBestHighCard(dealtCards, 13); // King high
      tier3 = this.findBestHighCard(dealtCards, 12); // Queen high
      tier2 = this.findBestHighCard(dealtCards, 11); // Jack high
      tier1 = this.findBestHighCard(dealtCards, 10); // 10 high
    }

    // Fallback to ensure all tiers exist
    if (!tier5) tier5 = this.findBestHighCard(dealtCards, 1) || [new Card('heart', 1), new Card('diamond', 13), new Card('club', 12)];
    if (!tier4) tier4 = this.findBestHighCard(dealtCards, 13) || [new Card('spade', 13), new Card('heart', 12), new Card('diamond', 11)];
    if (!tier3) tier3 = this.findBestHighCard(dealtCards, 12) || [new Card('club', 12), new Card('spade', 11), new Card('heart', 10)];
    if (!tier2) tier2 = this.findBestHighCard(dealtCards, 11) || [new Card('diamond', 11), new Card('club', 10), new Card('spade', 9)];
    if (!tier1) tier1 = this.findBestHighCard(dealtCards, 10) || [new Card('heart', 10), new Card('diamond', 9), new Card('club', 8)];

    console.log('🃏 Generated Tier Hands (relative to table):');
    console.log('  Tier 5 (Best):', tier5.map(c => `${c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : c.rank}${c.type[0].toUpperCase()}`).join('-'));
    console.log('  Tier 4:', tier4.map(c => `${c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : c.rank}${c.type[0].toUpperCase()}`).join('-'));
    console.log('  Tier 3:', tier3.map(c => `${c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : c.rank}${c.type[0].toUpperCase()}`).join('-'));
    console.log('  Tier 2:', tier2.map(c => `${c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : c.rank}${c.type[0].toUpperCase()}`).join('-'));
    console.log('  Tier 1:', tier1.map(c => `${c.rank === 1 ? 'A' : c.rank === 11 ? 'J' : c.rank === 12 ? 'Q' : c.rank === 13 ? 'K' : c.rank}${c.type[0].toUpperCase()}`).join('-'));

    return { tier5, tier4, tier3, tier2, tier1 };
  }

  /**
   * Helper: Check if hand is a trail (three of a kind)
   */
  private isTrail(hand: Card[]): boolean {
    return hand.length === 3 && hand[0].rank === hand[1].rank && hand[1].rank === hand[2].rank;
  }

  /**
   * Helper: Check if hand is a pure sequence
   */
  private isPureSequence(hand: Card[]): boolean {
    if (hand.length !== 3) return false;
    const sorted = [...hand].sort((a, b) => a.rank - b.rank);
    const samesuit = sorted[0].type === sorted[1].type && sorted[1].type === sorted[2].type;
    const consecutive = (sorted[0].rank + 1 === sorted[1].rank && sorted[1].rank + 1 === sorted[2].rank) ||
                       (sorted[0].rank === 1 && sorted[1].rank === 12 && sorted[2].rank === 13); // A-Q-K
    return samesuit && consecutive;
  }

  /**
   * Helper: Check if hand is a sequence
   */
  private isSequence(hand: Card[]): boolean {
    if (hand.length !== 3) return false;
    const sorted = [...hand].sort((a, b) => a.rank - b.rank);
    return (sorted[0].rank + 1 === sorted[1].rank && sorted[1].rank + 1 === sorted[2].rank) ||
           (sorted[0].rank === 1 && sorted[1].rank === 12 && sorted[2].rank === 13);
  }

  /**
   * Helper: Check if hand is a color
   */
  private isColor(hand: Card[]): boolean {
    return hand.length === 3 && hand[0].type === hand[1].type && hand[1].type === hand[2].type && !this.isPureSequence(hand);
  }

  /**
   * Helper: Check if hand is a pair
   */
  private isPair(hand: Card[]): boolean {
    if (hand.length !== 3) return false;
    return hand[0].rank === hand[1].rank || hand[1].rank === hand[2].rank || hand[0].rank === hand[2].rank;
  }

  /**
   * Find best available trail
   */
  private findBestTrail(dealtCards: Map<string, Card[]>): Card[] | null {
    for (let rank = 1; rank <= 13; rank++) {
      const testRank = rank === 1 ? 1 : 14 - rank as CardRank; // Start with Ace, then K, Q, etc
      const trail = this.generateTrail(testRank, dealtCards);
      if (trail) return trail;
    }
    return null;
  }

  /**
   * Find best available pure sequence
   */
  private findBestPureSequence(dealtCards: Map<string, Card[]>): Card[] | null {
    for (const suit of this.allTypes) {
      for (let rank = 1; rank <= 11; rank++) {
        const testRank = rank === 1 ? 1 : 14 - rank as CardRank;
        const seq = this.generatePureSequence(testRank, suit, dealtCards);
        if (seq) return seq;
      }
    }
    return null;
  }

  /**
   * Find best available sequence
   */
  private findBestSequence(dealtCards: Map<string, Card[]>): Card[] | null {
    for (let rank = 1; rank <= 11; rank++) {
      const testRank = rank === 1 ? 1 : 14 - rank as CardRank;
      const seq = this.generateSequence(testRank, dealtCards);
      if (seq) return seq;
    }
    return null;
  }

  /**
   * Find best available color
   */
  private findBestColor(dealtCards: Map<string, Card[]>): Card[] | null {
    for (const suit of this.allTypes) {
      const color = this.generateColor(suit, [1, 13, 12], dealtCards);
      if (color) return color;
    }
    return null;
  }

  /**
   * Find best available pair
   */
  private findBestPair(dealtCards: Map<string, Card[]>): Card[] | null {
    for (let rank = 1; rank <= 13; rank++) {
      const pairRank = rank === 1 ? 1 : 14 - rank as CardRank;
      const kickerRank = pairRank === 1 ? 13 : (pairRank - 1) as CardRank;
      const pair = this.generatePair(pairRank, kickerRank, dealtCards);
      if (pair) return pair;
    }
    return null;
  }

  /**
   * Find best available high card combination
   */
  private findBestHighCard(dealtCards: Map<string, Card[]>, highRank?: CardRank): Card[] | null {
    const targetRank = highRank || 1;
    const cards: Card[] = [];
    
    // Try to get the high card
    for (const type of this.allTypes) {
      if (!this.isCardUsed(targetRank, type, dealtCards)) {
        cards.push(new Card(type, targetRank));
        this.markUsed(cards[0]);
        break;
      }
    }
    
    if (cards.length === 0) return null;

    // Add two more high cards
    const remainingRanks = [13, 12, 11, 10, 9, 8, 7].filter(r => r !== targetRank) as CardRank[];
    for (const rank of remainingRanks) {
      for (const type of this.allTypes) {
        if (!this.isCardUsed(rank, type, dealtCards)) {
          cards.push(new Card(type, rank));
          this.markUsed(cards[cards.length - 1]);
          break;
        }
      }
      if (cards.length === 3) break;
    }

    return cards.length === 3 ? cards : null;
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

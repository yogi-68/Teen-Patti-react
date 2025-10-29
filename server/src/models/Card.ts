/**
 * Card Type Definitions
 */
export type CardType = 'heart' | 'spade' | 'diamond' | 'club';

export type CardRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/**
 * Card class representing a single playing card
 */
export class Card {
  type: CardType;
  rank: CardRank;
  name: string;
  priority: number;
  id?: string;

  constructor(type: CardType, rank: CardRank) {
    this.type = type;
    this.rank = rank;
    this.name = this.getName();
    this.priority = this.getPriority();
  }

  /**
   * Get display name for card rank
   */
  private getName(): string {
    switch (this.rank) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return this.rank.toString();
    }
  }

  /**
   * Get priority for card rank (Ace is highest)
   */
  private getPriority(): number {
    return this.rank === 1 ? 14 : this.rank;
  }

  /**
   * Get type priority for tie-breaking
   */
  getTypePriority(): number {
    const typePriorities: Record<CardType, number> = {
      club: 1,
      diamond: 2,
      heart: 3,
      spade: 4,
    };
    return typePriorities[this.type];
  }
}

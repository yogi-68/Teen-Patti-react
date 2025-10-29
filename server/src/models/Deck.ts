import { Card, type CardType, type CardRank } from './Card.js';

/**
 * Deck class for managing a standard 52-card deck
 */
export class Deck {
  private deck: Card[] = [];
  private readonly types: CardType[] = ['heart', 'spade', 'diamond', 'club'];

  constructor() {
    this.makeCards();
  }

  /**
   * Create all 52 cards in the deck
   */
  private makeCards(): void {
    this.deck = [];
    for (const type of this.types) {
      for (let rank = 1; rank <= 13; rank++) {
        this.deck.push(new Card(type, rank as CardRank));
      }
    }
  }

  /**
   * Get all cards in the deck
   */
  getCards(): Card[] {
    return this.deck;
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    let len = this.deck.length;
    while (len !== 0) {
      const randIdx = Math.floor(Math.random() * len);
      len--;
      
      // Assign unique IDs
      this.deck[len].id = Math.random().toString(36).substr(2, 9);
      this.deck[randIdx].id = Math.random().toString(36).substr(2, 9);
      
      // Swap cards
      const tempVal = this.deck[len];
      this.deck[len] = this.deck[randIdx];
      this.deck[randIdx] = tempVal;
    }
  }

  /**
   * Get random cards from the deck
   */
  getRandomCards(num: number): Card[] {
    const randCards: Card[] = [];
    const cardInserted: Record<number, boolean> = {};

    let count = 0;
    while (count < num) {
      const nCard = this.getRandomArbitrary(1, 52);
      if (!cardInserted[nCard]) {
        const originalCard = this.deck[nCard - 1];
        const card = new Card(originalCard.type, originalCard.rank);
        card.id = Math.random().toString(36).substr(2, 9);
        randCards.push(card);
        cardInserted[nCard] = true;
        count++;
      }
    }
    return randCards;
  }

  /**
   * Get random integer between min and max
   */
  private getRandomArbitrary(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  /**
   * Reset and shuffle the deck
   */
  reset(): void {
    this.makeCards();
    this.shuffle();
  }
}

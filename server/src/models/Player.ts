import type { Card } from './Card.js';

/**
 * Player information interface
 */
export interface PlayerInfo {
  userName: string;
  userId?: string;
  chips: number;
  avatar?: string;
  isBot?: boolean; // Flag to identify bot players
}

/**
 * Card set for a player
 */
export interface CardSet {
  cards: Card[];
  closed: boolean; // true = blind (not seen), false = chaal (seen)
}

/**
 * Player class representing a game player
 */
export class Player {
  id: string;
  playerInfo: PlayerInfo;
  cardSet: CardSet | null = null;
  bet: number = 0;
  totalBet: number = 0;
  folded: boolean = false;
  turn: boolean = false;
  connected: boolean = true;
  socketId: string;
  waitingForNextRound: boolean = false; // True if player joined mid-game

  constructor(id: string, playerInfo: PlayerInfo, socketId: string) {
    this.id = id;
    this.playerInfo = playerInfo;
    this.socketId = socketId;
  }

  /**
   * Deal cards to the player
   */
  dealCards(cards: Card[], blind: boolean = true): void {
    this.cardSet = {
      cards,
      closed: blind,
    };
    console.log(`🃏 Dealt cards to ${this.playerInfo.userName}: blind=${blind}, closed=${this.cardSet.closed}`);
  }

  /**
   * Player sees their cards (blind -> chaal)
   */
  seeCards(): void {
    if (this.cardSet) {
      console.log(`👁️ ${this.playerInfo.userName} seeing cards: closed=${this.cardSet.closed} -> false`);
      this.cardSet.closed = false;
    }
  }

  /**
   * Player makes a bet
   */
  makeBet(amount: number): void {
    if (this.playerInfo.chips >= amount) {
      this.playerInfo.chips -= amount;
      this.bet = amount;
      this.totalBet += amount;
    } else {
      throw new Error('Insufficient chips');
    }
  }

  /**
   * Player folds
   */
  fold(): void {
    this.folded = true;
    this.turn = false;
  }

  /**
   * Check if player is blind
   */
  isBlind(): boolean {
    return this.cardSet?.closed ?? true;
  }

  /**
   * Get sanitized player data (hide cards if needed)
   */
  getPublicData(hideCards: boolean = true): any {
    let cardSetData: any = this.cardSet;
    
    // If hiding cards from other players, show they have cards but hide the actual cards
    if (hideCards && this.cardSet) {
      cardSetData = {
        cards: this.cardSet.cards.map(() => ({ type: 'hidden', rank: 'hidden', name: 'hidden', priority: 0 } as any)),
        closed: this.cardSet.closed, // Preserve the actual closed state (whether player has seen their cards)
        hasCards: true // Flag to indicate player has cards
      };
    }
    
    return {
      id: this.id,
      playerInfo: this.playerInfo,
      cardSet: cardSetData,
      bet: this.bet,
      totalBet: this.totalBet,
      folded: this.folded,
      turn: this.turn,
      connected: this.connected,
      waitingForNextRound: this.waitingForNextRound,
      isBlind: this.cardSet?.closed ?? true, // Send actual blind status (whether player has seen their own cards)
    };
  }
}

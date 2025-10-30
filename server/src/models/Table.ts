import { Deck } from './Deck.js';
import { Player, type PlayerInfo } from './Player.js';
import type { Card } from './Card.js';

/**
 * Game state enum
 */
export enum GameState {
  WAITING = 'waiting',
  DEALING = 'dealing',
  BETTING = 'betting',
  SHOWDOWN = 'showdown',
  FINISHED = 'finished',
}

/**
 * Table configuration
 */
export interface TableConfig {
  bootAmount: number;
  minBet: number;
  maxBet: number;      // bootAmount * 2^7 (128)
  potLimit: number;    // bootAmount * 2^11 (2048) - triggers auto-show
  maxPlayers: number;
}

/**
 * Table class representing a game table
 */
export class Table {
  id: number;
  config: TableConfig;
  players: Map<string, Player> = new Map();
  deck: Deck;
  pot: number = 0;
  currentTurn: string | null = null;
  gameState: GameState = GameState.WAITING;
  lastBet: number;
  lastBlind: boolean = true;
  roundCount: number = 0;
  
  constructor(
    id: number,
    config: TableConfig = {
      bootAmount: 1,
      minBet: 1,
      maxBet: 1 * Math.pow(2, 7),   // boot * 128 = 128
      potLimit: 1 * Math.pow(2, 11), // boot * 2048 = 2048
      maxPlayers: 5,
    }
  ) {
    this.id = id;
    this.config = config;
    this.deck = new Deck();
    this.lastBet = config.bootAmount;
  }

  /**
   * Add a player to the table
   */
  addPlayer(playerId: string, playerInfo: PlayerInfo, socketId: string): Player | null {
    if (this.players.size >= this.config.maxPlayers) {
      return null;
    }

    const player = new Player(playerId, playerInfo, socketId);
    this.players.set(playerId, player);
    return player;
  }

  /**
   * Remove a player from the table
   */
  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  /**
   * Get a player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Get active (non-folded, not waiting) players
   */
  getActivePlayers(): Player[] {
    return this.getPlayers().filter((p) => !p.folded && !p.waitingForNextRound);
  }

  /**
   * Start a new game
   */
  startGame(): void {
    if (this.players.size < 2) {
      throw new Error('Need at least 2 players to start');
    }

    this.gameState = GameState.DEALING;
    this.deck.reset();
    this.pot = 0;
    this.roundCount = 0;
    this.lastBet = this.config.bootAmount;
    this.lastBlind = true;

    // Reset all players and activate waiting players
    this.players.forEach((player) => {
      player.folded = false;
      player.bet = 0;
      player.totalBet = 0;
      player.cardSet = null;
      player.turn = false;
      // Activate players who were waiting for next round
      player.waitingForNextRound = false;
    });

    // Collect boot amount from all players
    this.players.forEach((player) => {
      player.makeBet(this.config.bootAmount);
      this.pot += this.config.bootAmount;
    });

    // Deal 3 cards to each player
    this.dealCards();

    // Set first player's turn
    const firstPlayer = this.getActivePlayers()[0];
    if (firstPlayer) {
      firstPlayer.turn = true;
      this.currentTurn = firstPlayer.id;
    }

    this.gameState = GameState.BETTING;
  }

  /**
   * Deal cards to all players
   */
  private dealCards(): void {
    this.players.forEach((player) => {
      const cards = this.deck.getRandomCards(3);
      player.dealCards(cards, true); // Start as blind
    });
  }

  /**
   * Move to next player's turn
   */
  nextTurn(): Player | null {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      return null;
    }

    const currentIndex = activePlayers.findIndex((p) => p.id === this.currentTurn);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextIndex];

    // Clear current player's turn
    if (this.currentTurn) {
      const currentPlayer = this.getPlayer(this.currentTurn);
      if (currentPlayer) {
        currentPlayer.turn = false;
      }
    }

    // Set next player's turn
    nextPlayer.turn = true;
    this.currentTurn = nextPlayer.id;
    this.roundCount++;

    return nextPlayer;
  }

  /**
   * Get previous active player (for side show)
   * Searches backwards from current player for active, non-folded player
   */
  getPreviousActivePlayer(playerId: string): Player | null {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      return null;
    }

    const currentIndex = activePlayers.findIndex((p) => p.id === playerId);
    if (currentIndex === -1) {
      return null;
    }

    // Search backwards for previous active player
    const prevIndex = (currentIndex - 1 + activePlayers.length) % activePlayers.length;
    return activePlayers[prevIndex];
  }

  /**
   * Check if pot limit is exceeded (triggers auto-show)
   */
  isPotLimitExceeded(): boolean {
    return this.pot >= this.config.potLimit;
  }

  /**
   * Get table state for clients
   */
  getTableState(playerId?: string): any {
    const players = this.getPlayers().map((p) => {
      // Show cards only to the player themselves
      const hideCards = playerId !== p.id;
      return p.getPublicData(hideCards);
    });

    return {
      id: this.id,
      config: this.config,
      players,
      pot: this.pot,
      currentTurn: this.currentTurn,
      gameState: this.gameState,
      lastBet: this.lastBet,
      lastBlind: this.lastBlind,
      roundCount: this.roundCount,
      playerCount: this.players.size,
    };
  }
}

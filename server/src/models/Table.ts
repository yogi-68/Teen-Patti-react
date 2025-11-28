import { Deck } from './Deck.js';
import { Player, type PlayerInfo } from './Player.js';
import type { Card } from './Card.js';
import { gameResetService } from '../services/GameResetService.js';

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
 * Game mode enum
 */
export enum GameMode {
  PRACTICE = 'practice',
  REAL = 'real',
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
  gameMode: GameMode;  // practice or real mode
  isPrivate?: boolean; // whether this is a private table
  tableCode?: string;  // unique code for joining private tables
  creatorId?: string;  // userId of the player who created the table
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
  
  // Joker premium feature state
  jokerUsers: string[] = []; // Activation order (oldest -> newest)
  jokerTiers: Map<string, number> = new Map(); // userId -> assigned tier (1-5)
  jokerUsedBy: Set<string> = new Set(); // Track who has used Joker (prevent reuse)
  
  constructor(
    id: number,
    config: TableConfig = {
      bootAmount: 1,
      minBet: 1,
      maxBet: 1 * Math.pow(2, 7),   // boot * 128 = 128
      potLimit: 1 * Math.pow(2, 11), // boot * 2048 = 2048
      maxPlayers: 5,
      gameMode: GameMode.PRACTICE,  // Default to practice mode
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
   * Uses GameResetService for consistent state cleanup
   */
  startGame(): void {
    // Perform complete reset using centralized service
    const resetResult = gameResetService.performCompleteReset(this);
    
    if (!resetResult.success) {
      throw new Error(resetResult.message || 'Failed to reset game state');
    }

    console.log(`🎮 Starting new game on table ${this.id}`);

    // Deal 3 cards to each player
    this.dealCards();

    // Set first player's turn
    const firstPlayer = this.getActivePlayers()[0];
    if (firstPlayer) {
      firstPlayer.turn = true;
      this.currentTurn = firstPlayer.id;
    }

    this.gameState = GameState.BETTING;
    console.log(`✅ Game started - State: BETTING, First turn: ${this.currentTurn}`);
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
      // Show cards only to the player themselves (unless they are a Joker user)
      const isJokerUser = playerId && this.jokerUsedBy.has(playerId);
      const hideCards = !isJokerUser && playerId !== p.id;
      return p.getPublicData(hideCards, playerId);
    });

    // Convert jokerTiers Map to plain object
    const jokerTiersObj: Record<string, number> = {};
    this.jokerTiers.forEach((tier, userId) => {
      jokerTiersObj[userId] = tier;
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
      // Joker state - send jokerUsedBy (who has actually used Joker) not jokerUsers (activation order)
      jokerUsers: [...this.jokerUsedBy], // Convert Set to Array for client
      jokerTiers: jokerTiersObj,
      hasJokerUsers: this.jokerUsedBy.size > 0,
      // Private table info
      isPrivate: this.config.isPrivate || false,
      tableCode: this.config.tableCode || null,
    };
  }
}

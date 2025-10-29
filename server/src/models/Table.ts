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
  maxBet: number;
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
      bootAmount: 2,
      minBet: 1,
      maxBet: 1000,
      maxPlayers: 6,
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
   * Get active (non-folded) players
   */
  getActivePlayers(): Player[] {
    return this.getPlayers().filter((p) => !p.folded);
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

    // Reset all players
    this.players.forEach((player) => {
      player.folded = false;
      player.bet = 0;
      player.totalBet = 0;
      player.cardSet = null;
      player.turn = false;
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

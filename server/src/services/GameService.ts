import { Table, GameState } from '../models/Table.js';
import { CardComparer } from './CardComparer.js';
import type { Player, PlayerInfo } from '../models/Player.js';

/**
 * Game service managing game logic and tables
 */
export class GameService {
  private tables: Map<number, Table> = new Map();

  /**
   * Create a new table
   */
  createTable(tableId: number, bootAmount: number = 2): Table {
    const table = new Table(tableId, {
      bootAmount,
      minBet: 1,
      maxBet: 1000,
      maxPlayers: 6,
    });
    this.tables.set(tableId, table);
    return table;
  }

  /**
   * Get a table by ID
   */
  getTable(tableId: number): Table | undefined {
    return this.tables.get(tableId);
  }

  /**
   * Join a player to a table
   */
  joinTable(
    tableId: number,
    playerId: string,
    playerInfo: PlayerInfo,
    socketId: string
  ): { success: boolean; message?: string; player?: Player } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.addPlayer(playerId, playerInfo, socketId);
    if (!player) {
      return { success: false, message: 'Table is full' };
    }

    return { success: true, player };
  }

  /**
   * Handle player bet
   */
  handleBet(
    tableId: number,
    playerId: string,
    betAmount: number,
    isBlind: boolean
  ): { success: boolean; message?: string } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!player.turn) {
      return { success: false, message: 'Not your turn' };
    }

    try {
      // Make the bet
      player.makeBet(betAmount);
      table.pot += betAmount;

      // Update last bet info
      table.lastBet = betAmount;
      table.lastBlind = isBlind;

      // Move to next player
      table.nextTurn();

      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Handle player seeing cards (blind -> chaal)
   */
  handleSeeCards(
    tableId: number,
    playerId: string
  ): { success: boolean; message?: string } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    player.seeCards();
    return { success: true };
  }

  /**
   * Handle player fold
   */
  handleFold(
    tableId: number,
    playerId: string
  ): { success: boolean; message?: string; gameOver?: boolean; winner?: Player } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    player.fold();

    // Check if only one player left
    const activePlayers = table.getActivePlayers();
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.playerInfo.chips += table.pot;
      table.gameState = GameState.FINISHED;
      return { success: true, gameOver: true, winner };
    }

    // Move to next player
    table.nextTurn();

    return { success: true };
  }

  /**
   * Handle side show (compare cards with previous player)
   */
  handleSideShow(
    tableId: number,
    playerId: string,
    targetPlayerId: string
  ): { success: boolean; message?: string; loser?: Player } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    const targetPlayer = table.getPlayer(targetPlayerId);

    if (!player || !targetPlayer) {
      return { success: false, message: 'Player not found' };
    }

    if (player.isBlind() || targetPlayer.isBlind()) {
      return { success: false, message: 'Both players must have seen their cards' };
    }

    if (!player.cardSet || !targetPlayer.cardSet) {
      return { success: false, message: 'Cards not dealt' };
    }

    // Compare hands
    const result = CardComparer.compareHands(
      player.cardSet.cards,
      targetPlayer.cardSet.cards
    );

    let loser: Player;
    if (result >= 0) {
      // Player wins or tie, target player loses
      loser = targetPlayer;
    } else {
      // Target player wins
      loser = player;
    }

    loser.fold();

    // Check if game over
    const activePlayers = table.getActivePlayers();
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.playerInfo.chips += table.pot;
      table.gameState = GameState.FINISHED;
    }

    return { success: true, loser };
  }

  /**
   * Handle show (reveal all cards)
   */
  handleShow(
    tableId: number,
    playerId: string
  ): {
    success: boolean;
    message?: string;
    winner?: Player;
    results?: Map<string, any>;
  } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const activePlayers = table.getActivePlayers();
    if (activePlayers.length < 2) {
      return { success: false, message: 'Not enough players for show' };
    }

    // Get all player hands
    const playerHands = new Map();
    activePlayers.forEach((p) => {
      if (p.cardSet) {
        playerHands.set(p.id, p.cardSet.cards);
      }
    });

    // Find winner
    const { winnerId, winnerHand, allEvaluations } = CardComparer.findWinner(playerHands);
    const winner = table.getPlayer(winnerId);

    if (winner) {
      winner.playerInfo.chips += table.pot;
      table.gameState = GameState.FINISHED;
    }

    return {
      success: true,
      winner,
      results: allEvaluations,
    };
  }

  /**
   * Start a new game on a table
   */
  startGame(tableId: number): { success: boolean; message?: string } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    try {
      table.startGame();
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Get minimum bet for a player
   */
  getMinimumBet(tableId: number, playerId: string): number {
    const table = this.tables.get(tableId);
    if (!table) return 0;

    const player = table.getPlayer(playerId);
    if (!player) return 0;

    const isBlind = player.isBlind();
    let minBet: number;

    if (isBlind) {
      minBet = table.lastBlind ? table.lastBet : table.lastBet / 2;
    } else {
      minBet = table.lastBlind ? table.lastBet * 2 : table.lastBet;
    }

    return Math.ceil(minBet);
  }
}

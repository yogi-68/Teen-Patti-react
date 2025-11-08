import { Table, GameState, GameMode } from '../models/Table.js';
import { CardComparer } from './CardComparer.js';
import type { Player, PlayerInfo } from '../models/Player.js';

/**
 * Game service managing game logic and tables
 */
export class GameService {
  private tables: Map<number, Table> = new Map();
  private nextTableId: number = 1; // Counter for generating unique table IDs

  /**
   * Create a new table
   */
  createTable(tableId: number, bootAmount: number = 1, gameMode: GameMode = GameMode.PRACTICE): Table {
    const table = new Table(tableId, {
      bootAmount,
      minBet: 1,
      maxBet: bootAmount * Math.pow(2, 7),   // boot * 128
      potLimit: bootAmount * Math.pow(2, 11), // boot * 2048
      maxPlayers: 5,
      gameMode,
    });
    this.tables.set(tableId, table);
    // Update nextTableId if we're creating a table with a higher ID
    if (tableId >= this.nextTableId) {
      this.nextTableId = tableId + 1;
    }
    return table;
  }

  /**
   * Get a table by ID
   */
  getTable(tableId: number): Table | undefined {
    return this.tables.get(tableId);
  }

  /**
   * Find an available table for the given game mode, or create a new one
   */
  findOrCreateAvailableTable(gameMode: GameMode, bootAmount: number = 1): Table {
    // First, try to find an existing table with space
    for (const table of this.tables.values()) {
      if (table.config.gameMode === gameMode && 
          table.config.bootAmount === bootAmount &&
          table.getPlayers().length < table.config.maxPlayers) {
        return table;
      }
    }

    // No available table found, create a new one
    const newTableId = this.nextTableId++;
    console.log(`🆕 Creating new table ${newTableId} for ${gameMode} mode (Boot: ${bootAmount})`);
    return this.createTable(newTableId, bootAmount, gameMode);
  }

  /**
   * Get all tables
   */
  getAllTables(): Table[] {
    return Array.from(this.tables.values());
  }

  /**
   * Get tables by game mode
   */
  getTablesByMode(gameMode: GameMode): Table[] {
    return Array.from(this.tables.values()).filter(
      table => table.config.gameMode === gameMode
    );
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
   * Remove a player from a table with proper cleanup
   * Handles fold logic if game is in progress
   */
  removePlayer(
    tableId: number,
    playerId: string
  ): { 
    success: boolean; 
    message?: string; 
    gameOver?: boolean; 
    winner?: Player;
    playerName?: string;
  } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    const playerName = player.playerInfo.userName;
    let gameOver = false;
    let winner: Player | undefined;

    // If game is in betting phase and player hasn't folded, fold them
    if (table.gameState === GameState.BETTING && !player.folded) {
      player.fold();
      
      // Check if only one player left after fold
      const activePlayers = table.getActivePlayers();
      if (activePlayers.length === 1) {
        winner = activePlayers[0];
        winner.playerInfo.chips += table.pot;
        table.gameState = GameState.FINISHED;
        gameOver = true;
      } else if (activePlayers.length > 1) {
        // Move to next player if game continues
        table.nextTurn();
      }
    }

    // Remove player from table
    const removed = table.removePlayer(playerId);
    
    if (!removed) {
      return { success: false, message: 'Failed to remove player' };
    }

    // Check if table is now empty
    if (table.getPlayers().length === 0) {
      console.log(`📊 Table ${tableId} is now empty, resetting state`);
      table.gameState = GameState.WAITING;
      table.pot = 0;
      table.roundCount = 0;
    }

    return { 
      success: true, 
      gameOver, 
      winner,
      playerName 
    };
  }

  /**
   * Handle player bet
   */
  handleBet(
    tableId: number,
    playerId: string,
    betAmount: number,
    isBlind: boolean
  ): { success: boolean; message?: string; potLimitExceeded?: boolean } {
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

      // Check if pot limit exceeded (triggers auto-show)
      const potLimitExceeded = table.isPotLimitExceeded();

      // Move to next player (unless pot limit exceeded)
      if (!potLimitExceeded) {
        table.nextTurn();
      }

      return { success: true, potLimitExceeded };
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
   * Handle side show (compare cards with PREVIOUS player)
   * Following original Teen Patti rules: current player asks PREVIOUS player
   */
  handleSideShow(
    tableId: number,
    playerId: string
  ): { success: boolean; message?: string; loser?: Player; targetPlayerId?: string } {
    const table = this.tables.get(tableId);
    if (!table) {
      return { success: false, message: 'Table not found' };
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Get PREVIOUS active player (original logic)
    const targetPlayer = table.getPreviousActivePlayer(playerId);
    if (!targetPlayer) {
      return { success: false, message: 'No previous player available for side show' };
    }

    // Both players must have seen their cards
    if (player.isBlind()) {
      return { success: false, message: 'You must see your cards first' };
    }

    if (targetPlayer.isBlind()) {
      return { success: false, message: 'Previous player has not seen their cards yet' };
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
      // Target player wins, current player loses
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

    return { success: true, loser, targetPlayerId: targetPlayer.id };
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

import { Server as SocketIOServer, Socket } from 'socket.io';
import JokerService, { JokerGameState } from '../services/JokerService.js';
import { Card } from '../models/Card.js';

/**
 * Joker Socket Handler - Manages real-time Joker events
 */

export class JokerSocketHandler {
  private io: SocketIOServer;
  // Map gameId to JokerGameState
  private jokerStates: Map<string, JokerGameState> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Initialize Joker state for a new game
   */
  initializeGameJokerState(gameId: string): void {
    const jokerState = JokerService.initializeJokerState();
    this.jokerStates.set(gameId, jokerState);
    console.log(`🃏 Joker state initialized for game ${gameId}`);
  }

  /**
   * Get Joker state for a game
   */
  getJokerState(gameId: string): JokerGameState | undefined {
    return this.jokerStates.get(gameId);
  }

  /**
   * Handle Joker activation request from client
   */
  async handleJokerActivation(
    socket: Socket,
    data: {
      gameId: string;
      userId: string;
      username: string;
      tableType: 'demo' | 'cash';
      cards: Card[];
    }
  ): Promise<void> {
    const { gameId, userId, username, tableType, cards } = data;

    try {
      // Get game's Joker state
      const jokerState = this.jokerStates.get(gameId);
      if (!jokerState) {
        socket.emit('joker:error', {
          message: 'Game not found'
        });
        return;
      }

      // Check if already activated
      const hasActivated = jokerState.jokerUsers.has(userId);

      // Validate eligibility
      const validation = await JokerService.canUseJoker(
        userId,
        tableType,
        hasActivated
      );

      if (!validation.canUse) {
        socket.emit('joker:error', {
          message: validation.reason || 'Cannot use Joker'
        });
        return;
      }

      // Activate Joker
      JokerService.activateJoker(jokerState, userId, username, cards);

      // Emit to all players in the game
      this.io.to(gameId).emit('joker:activated', {
        userId,
        username,
        jokerUserCount: jokerState.jokerUsers.size,
        timestamp: Date.now()
      });

      // Send visible cards to all Joker users
      this.broadcastVisibleCards(gameId, jokerState);

      console.log(`🃏 Joker activated by ${username} in game ${gameId}`);
    } catch (error) {
      console.error('Error handling Joker activation:', error);
      socket.emit('joker:error', {
        message: 'Failed to activate Joker'
      });
    }
  }

  /**
   * Broadcast visible cards to all Joker users
   */
  private broadcastVisibleCards(gameId: string, jokerState: JokerGameState): void {
    // For each Joker user, send them the visible cards
    for (const [userId, jokerUser] of jokerState.jokerUsers.entries()) {
      const visibleCards = JokerService.getVisibleCardsForJokerUser(jokerState, userId);
      
      // Convert Map to object for JSON serialization
      const visibleCardsObj: Record<string, Card[]> = {};
      for (const [uid, cards] of visibleCards.entries()) {
        visibleCardsObj[uid] = cards;
      }

      // Emit to specific user's socket
      this.io.to(gameId).emit('joker:cards-revealed', {
        forUserId: userId,
        visibleCards: visibleCardsObj
      });
    }
  }

  /**
   * Handle game end - calculate Joker winner and apply fees
   */
  async handleGameEnd(
    gameId: string,
    tableWinnerId: string,
    winAmount: number
  ): Promise<{ feeApplied: boolean; feeAmount: number; netWinnings: number }> {
    const jokerState = this.jokerStates.get(gameId);

    if (!jokerState || jokerState.jokerUsers.size === 0) {
      // No Joker users, no fee
      return { feeApplied: false, feeAmount: 0, netWinnings: winAmount };
    }

    try {
      // Calculate Joker group winner
      const jokerGroupWinner = JokerService.calculateJokerGroupWinner(jokerState);

      // Emit Joker winner announcement
      if (jokerGroupWinner) {
        const jokerWinner = jokerState.jokerUsers.get(jokerGroupWinner);
        this.io.to(gameId).emit('joker:winner', {
          userId: jokerGroupWinner,
          username: jokerWinner?.username,
          handRank: jokerWinner?.handEvaluation.rankName,
          timestamp: Date.now()
        });
      }

      // Apply Joker fee if applicable
      const feeResult = await JokerService.applyJokerFee(
        jokerState,
        tableWinnerId,
        winAmount
      );

      // If fee was applied, emit notification
      if (feeResult.feeApplied) {
        this.io.to(gameId).emit('joker:fee-applied', {
          userId: tableWinnerId,
          feeAmount: feeResult.feeAmount,
          feePercent: 30,
          originalAmount: winAmount,
          netWinnings: feeResult.netWinnings,
          timestamp: Date.now()
        });
      }

      return feeResult;
    } catch (error) {
      console.error('Error handling Joker game end:', error);
      return { feeApplied: false, feeAmount: 0, netWinnings: winAmount };
    }
  }

  /**
   * Reset Joker state for a new game (reuse game ID)
   */
  resetGameJokerState(gameId: string): void {
    const jokerState = this.jokerStates.get(gameId);
    if (jokerState) {
      JokerService.resetJokerState(jokerState);
      console.log(`🔄 Joker state reset for game ${gameId}`);
    }
  }

  /**
   * Clean up Joker state when game is destroyed
   */
  destroyGameJokerState(gameId: string): void {
    this.jokerStates.delete(gameId);
    console.log(`🗑️ Joker state destroyed for game ${gameId}`);
  }

  /**
   * Register Joker socket event handlers
   */
  registerHandlers(socket: Socket): void {
    // Handle Joker activation
    socket.on('joker:activate', async (data) => {
      await this.handleJokerActivation(socket, data);
    });

    // Handle Joker status request
    socket.on('joker:get-status', (data: { gameId: string; userId: string }) => {
      const jokerState = this.jokerStates.get(data.gameId);
      if (!jokerState) {
        socket.emit('joker:status', { hasActivated: false, jokerUserCount: 0 });
        return;
      }

      const status = JokerService.getJokerStatus(jokerState, data.userId);
      socket.emit('joker:status', status);
    });
  }
}

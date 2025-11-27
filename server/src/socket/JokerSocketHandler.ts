import { Server as SocketIOServer, Socket } from 'socket.io';
import { jokerService } from '../services/JokerService.js';
import { GameService } from '../services/GameService.js';

/**
 * NEW Joker Socket Handler - Manages tier-based Joker events
 * 
 * Key Features:
 * - Real-time Joker activation with dynamic tier assignment
 * - Broadcasts tier assignments to all players
 * - Reveals all cards to Joker users
 * - Handles Joker deduction at game end
 */

export class JokerSocketHandler {
  private io: SocketIOServer;
  private gameService: GameService;

  constructor(io: SocketIOServer, gameService: GameService) {
    this.io = io;
    this.gameService = gameService;
  }

  /**
   * Initialize Joker state for a new game
   * Call this AFTER cards have been dealt to players
   */
  public initializeGameJokerState(tableId: number): void {
    const table = this.gameService.getTable(tableId);
    if (!table) {
      console.error(`❌ Table ${tableId} not found`);
      return;
    }
    
    jokerService.initializeTableState(tableId);
    jokerService.initializeTableCards(table); // NEW: Store initial table cards
    console.log(`✅ Joker state initialized for table ${tableId}`);
  }

  /**
   * Clear Joker state when game ends
   */
  public clearGameJokerState(tableId: number): void {
    jokerService.clearTableState(tableId);
    console.log(`🗑️ Joker state cleared for table ${tableId}`);
  }

  /**
   * Handle Joker activation request from client
   * 
   * Event: 'joker:use'
   * Data: { tableId: number, userId: string, gameMode: string }
   * 
   * Emits:
   * - 'joker:usage-result' to requesting player
   * - 'joker:activated' to all players in room
   * - 'joker:reveal-cards' to all Joker users
   */
  public async handleJokerActivation(
    socket: Socket,
    data: {
      tableId: number;
      userId: string;
      gameMode: string;
    }
  ): Promise<void> {
    const { tableId, userId, gameMode } = data;

    try {
      // Get table
      const table = this.gameService.getTable(tableId);
      if (!table) {
        socket.emit('joker:error', {
          success: false,
          error: 'Table not found',
        });
        return;
      }

      // Use Joker through service
      const result = await jokerService.useJoker(userId, table, gameMode);

      if (!result.success) {
        socket.emit('joker:usage-result', result);
        return;
      }

      // Success - update table state
      table.jokerUsers = result.jokerUsers;
      table.jokerTiers = new Map(Object.entries(result.jokerTiers));
      table.jokerUsedBy.add(userId);

      // Emit success to requesting player WITH revealed cards immediately
      socket.emit('joker:usage-result', {
        ...result,
        revealedCards: result.revealedCards, // Include revealed cards in the response
      });

      // Send revealed cards to the player who just activated Joker
      socket.emit('joker:reveal-cards', {
        forUserId: userId,
        revealedCards: result.revealedCards,
        jokerUsers: result.jokerUsers,
        timestamp: Date.now(),
      });

      // Broadcast activation to all players in the room (without revealing tier details)
      this.io.to(`table_${tableId}`).emit('joker:activated', {
        userId,
        jokerUsers: result.jokerUsers,
        timestamp: Date.now(),
      });

      // Broadcast card reveal to ALL other Joker users (who activated before)
      this.broadcastRevealedCards(tableId, result.revealedCards, result.jokerUsers);

      // Broadcast updated table state to all players so they get the updated jokerUsedBy list
      // This ensures clients sync their jokerActivePlayers from the server
      table.getPlayers().forEach((player) => {
        const playerSocket = this.io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.emit('tableUpdate', table.getTableState(player.id));
        }
      });

      console.log(`✅ Joker activated by ${userId} on table ${tableId} - Tier ${result.assignedTier}`);
    } catch (error: any) {
      console.error('❌ Error in handleJokerActivation:', error);
      socket.emit('joker:error', {
        success: false,
        error: error.message || 'Failed to activate Joker',
      });
    }
  }

  /**
   * Broadcast revealed cards to all Joker users
   * 
   * Event: 'joker:reveal-cards'
   * Only Joker users receive this event
   */
  private broadcastRevealedCards(
    tableId: number,
    revealedCards: Record<string, any[]>,
    jokerUsers: string[]
  ): void {
    const roomName = `table_${tableId}`;

    // Emit to each Joker user individually
    jokerUsers.forEach((userId) => {
      // Find socket for this user (this is a simplified approach)
      // In production, you'd maintain a userId -> socketId mapping
      this.io.to(roomName).emit('joker:reveal-cards', {
        forUserId: userId,
        revealedCards,
        jokerUsers,
        timestamp: Date.now(),
      });
    });

    console.log(`🃏 Revealed cards broadcasted to ${jokerUsers.length} Joker users on table ${tableId}`);
  }

  /**
   * Handle eligibility check request
   * 
   * Event: 'joker:check-eligibility'
   * Data: { tableId: number, userId: string, gameMode: string }
   * 
   * Emits: 'joker:eligibility-result'
   */
  public async handleEligibilityCheck(
    socket: Socket,
    data: {
      tableId: number;
      userId: string;
      gameMode: string;
    }
  ): Promise<void> {
    const { tableId, userId, gameMode } = data;

    try {
      const eligibility = await jokerService.checkEligibility(userId, tableId, gameMode);
      socket.emit('joker:eligibility-result', eligibility);
    } catch (error: any) {
      console.error('❌ Error checking Joker eligibility:', error);
      socket.emit('joker:eligibility-result', {
        eligible: false,
        reason: 'Error checking eligibility',
      });
    }
  }

  /**
   * Handle Joker status request
   * 
   * Event: 'joker:get-status'
   * Data: { tableId: number, userId: string }
   * 
   * Emits: 'joker:status'
   */
  public handleStatusRequest(
    socket: Socket,
    data: {
      tableId: number;
      userId: string;
    }
  ): void {
    const { tableId, userId } = data;

    try {
      const status = jokerService.getTableJokerStatus(tableId);
      const hasUsed = jokerService.hasUsedJoker(tableId, userId);
      const assignedTier = jokerService.getUserTier(tableId, userId);

      socket.emit('joker:status', {
        ...status,
        hasUsedJoker: hasUsed,
        assignedTier,
      });
    } catch (error: any) {
      console.error('❌ Error getting Joker status:', error);
      socket.emit('joker:status', {
        hasJokerUsers: false,
        jokerUsers: [],
        jokerTiers: {},
        hasTierHands: false,
        hasUsedJoker: false,
        assignedTier: null,
      });
    }
  }

  /**
   * Handle game end - calculate and apply Joker deduction
   * 
   * Called by SocketHandler when game ends
   * Returns deduction info for transaction logging
   */
  public async handleGameEnd(
    tableId: number,
    playerWinnings: Map<string, number>
  ): Promise<{
    feeApplied: boolean;
    userId?: string;
    feeAmount?: number;
    netWinnings?: number;
  }> {
    try {
      // Calculate deduction
      const deduction = jokerService.calculateJokerDeduction(tableId, playerWinnings);

      if (!deduction) {
        return { feeApplied: false };
      }

      // Apply deduction
      const success = await jokerService.applyJokerDeduction(deduction);

      if (success) {
        // Broadcast deduction notification to all players
        this.io.to(`table_${tableId}`).emit('joker:deduction-applied', {
          userId: deduction.userId,
          deductionAmount: deduction.deductionAmount,
          deductionPercentage: deduction.deductionPercentage,
          netWinnings: deduction.netWinnings - deduction.deductionAmount,
          timestamp: Date.now(),
        });

        console.log(`💰 Joker deduction applied: ₹${deduction.deductionAmount} from user ${deduction.userId}`);

        return {
          feeApplied: true,
          userId: deduction.userId,
          feeAmount: deduction.deductionAmount,
          netWinnings: deduction.netWinnings - deduction.deductionAmount,
        };
      }

      return { feeApplied: false };
    } catch (error: any) {
      console.error('❌ Error handling Joker game end:', error);
      return { feeApplied: false };
    }
  }

  /**
   * Register all Joker socket event handlers
   * 
   * Called by SocketHandler.setupEventHandlers()
   */
  public registerHandlers(socket: Socket): void {
    // Joker activation
    socket.on('joker:use', async (data: { tableId: number; userId: string; gameMode: string }) => {
      await this.handleJokerActivation(socket, data);
    });

    // Eligibility check
    socket.on('joker:check-eligibility', async (data: { tableId: number; userId: string; gameMode: string }) => {
      await this.handleEligibilityCheck(socket, data);
    });

    // Status request
    socket.on('joker:get-status', (data: { tableId: number; userId: string }) => {
      this.handleStatusRequest(socket, data);
    });

    console.log('✅ Joker event handlers registered');
  }
}

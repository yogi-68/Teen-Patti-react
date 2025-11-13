/**
 * Bot Socket Manager
 * Manages virtual socket connections for bots to participate in Socket.IO games
 */

import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';
import BotInstanceRepository from '../repositories/BotInstanceRepository.js';
import BotBlueprintRepository from '../repositories/BotBlueprintRepository.js';
import BotGameplayService from './BotGameplayService.js';
import { getRandomAvatar } from './BotAvatarService.js';

interface BotSocket extends EventEmitter {
  id: string;
  botInstanceId: string;
  tableId: number | null;
  connected: boolean;
  data: {
    userId: string;
    userName: string;
    chips: number;
  };
}

class BotSocketManager {
  private static instance: BotSocketManager;
  private io: SocketIOServer | null = null;
  private socketHandler: any = null; // Reference to SocketHandler
  private botSockets: Map<string, BotSocket> = new Map();
  private activeBots: Map<string, NodeJS.Timeout> = new Map(); // Bot decision timers

  private constructor() {}

  static getInstance(): BotSocketManager {
    if (!BotSocketManager.instance) {
      BotSocketManager.instance = new BotSocketManager();
    }
    return BotSocketManager.instance;
  }

  /**
   * Initialize with Socket.IO server instance and SocketHandler
   */
  initialize(io: SocketIOServer, socketHandler?: any): void {
    this.io = io;
    if (socketHandler) {
      this.socketHandler = socketHandler;
    }
  }

  /**
   * Create a virtual bot socket that can join games
   */
  async createBotSocket(botInstanceId: string, tableId: number): Promise<BotSocket | null> {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return null;
    }

    try {
      // Get bot instance
      const botInstance = await BotInstanceRepository.findById(botInstanceId);
      if (!botInstance) {
        console.error(`❌ Bot instance not found: ${botInstanceId}`);
        return null;
      }

      // Get bot blueprint for behavior
      const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
      if (!blueprint) {
        console.error(`❌ Bot blueprint not found: ${botInstance.bot_blueprint_id}`);
        return null;
      }

      // Create virtual socket
      const socketId = `bot_${botInstanceId}_${Date.now()}`;
      const botSocket = new EventEmitter() as BotSocket;
      botSocket.id = socketId;
      botSocket.botInstanceId = botInstanceId;
      botSocket.tableId = tableId;
      botSocket.connected = true;
      botSocket.data = {
        userId: botInstance.bot_instance_id,
        userName: botInstance.display_name,
        chips: botInstance.balance_coins || 1000,
      };

      // Add socket helper methods
      (botSocket as any).join = (room: string) => {
      };

      (botSocket as any).leave = (room: string) => {
      };

      (botSocket as any).to = (room: string) => {
        return {
          emit: (event: string, data: any) => {
            // Bot doesn't need to receive its own emissions
          }
        };
      };

      // Store bot socket
      this.botSockets.set(socketId, botSocket);

      return botSocket;
    } catch (error) {
      console.error('❌ Error creating bot socket:', error);
      return null;
    }
  }

  /**
   * Make bot join a table
   */
  async joinTable(botSocket: BotSocket, tableId: number): Promise<boolean> {
    if (!this.io || !this.socketHandler) {
      console.error('❌ Socket.IO or SocketHandler not initialized');
      return false;
    }

    try {
      const botInstance = await BotInstanceRepository.findById(botSocket.botInstanceId);
      if (!botInstance) return false;

      // Get or use existing avatar
      const avatarUrl = botInstance.avatar_url || getRandomAvatar();

      // Prepare player info
      const playerInfo = {
        userId: botInstance.bot_instance_id,
        userName: botInstance.display_name,
        chips: botInstance.balance_coins || 1000,
        avatarUrl: avatarUrl,
        isBot: true,
      };


      // Use SocketHandler's public method to add bot to table
      const success = await this.socketHandler.addBotToTable(
        botSocket,
        tableId,
        playerInfo
      );

      if (!success) {
        console.error(`❌ Failed to add bot ${botInstance.display_name} to table ${tableId}`);
        return false;
      }

      // Update bot instance
      botInstance.assigned_table_id = tableId;
      await BotInstanceRepository.update(botInstance.bot_instance_id, {
        assigned_table_id: tableId,
      });

      botSocket.tableId = tableId;

      return true;
    } catch (error) {
      console.error('❌ Error making bot join table:', error);
      return false;
    }
  }

  /**
   * Handle bot's turn - make decision and execute action
   */
  async handleBotTurn(
    botSocket: BotSocket,
    gameState: {
      tableId: number;
      currentBet: number;
      minBet: number;
      pot: number;
      hand?: string[];
      hasSeenCards?: boolean; // Track if bot has seen cards
      roundNumber?: number; // Track betting rounds
    }
  ): Promise<void> {
    try {
      const botInstance = await BotInstanceRepository.findById(botSocket.botInstanceId);
      if (!botInstance) return;


      // Get bot decision
      const decision = await BotGameplayService.getBotDecision(
        botSocket.botInstanceId,
        gameState.tableId,
        gameState.currentBet,
        gameState.minBet,
        botSocket.data.chips,
        gameState.pot,
        gameState.hand,
        gameState.hasSeenCards || false // Pass actual card visibility state
      );

      // Add realistic delay based on bot behavior
      const blueprint = await BotBlueprintRepository.findById(botInstance.bot_blueprint_id);
      const reactionDelay = blueprint?.behavior_profile?.reaction_delay_ms || 2000;
      
      await new Promise(resolve => setTimeout(resolve, reactionDelay));

      // Execute bot action

      switch (decision.action) {
        case 'fold':
          botSocket.emit('fold', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
          });
          break;

        case 'see_cards':
          botSocket.emit('seeCards', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
          });
          break;

        case 'show':
          botSocket.emit('show', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
          });
          break;

        case 'side_show':
          botSocket.emit('sideShow', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
          });
          break;

        case 'call':
          botSocket.emit('bet', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
            amount: gameState.currentBet,
          });
          break;

        case 'raise':
          botSocket.emit('bet', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
            amount: decision.amount || gameState.currentBet * 2,
          });
          break;

        case 'check':
          botSocket.emit('bet', {
            tableId: gameState.tableId,
            playerId: botSocket.data.userId,
            amount: 0,
          });
          break;
      }

      // Send chat message if bot decided to chat
      if (decision.chatMessage && this.io) {
        this.io.to(`table-${gameState.tableId}`).emit('botChat', {
          botName: botInstance.display_name,
          message: decision.chatMessage,
        });
      }
    } catch (error) {
      console.error('❌ Error handling bot turn:', error);
    }
  }

  /**
   * Remove bot from table
   */
  async removeBot(botSocketId: string): Promise<boolean> {
    const botSocket = this.botSockets.get(botSocketId);
    if (!botSocket) {
      return false;
    }

    try {
      const botInstance = await BotInstanceRepository.findById(botSocket.botInstanceId);
      const tableId = botSocket.tableId;
      const playerId = botSocket.data.userId;
      

      if (botInstance && tableId && this.socketHandler) {
        const gameService = this.socketHandler.getGameService();
        const table = gameService.getTable(tableId);

        // First, make the bot fold if they're in an active game
        if (table) {
          const player = table.getPlayer(playerId);
          
          // Check if player is in an active game and hasn't folded yet
          if (player && !player.hasFolded && table.gameState !== 0) { // 0 = WAITING state
            console.log(`🃏 Making bot ${botInstance.display_name} fold before removal...`);
            
            const foldResult = gameService.handleFold(tableId, playerId);
            
            if (foldResult.success) {
              // Emit fold event to all players
              this.io?.to(`table_${tableId}`).emit('playerFolded', {
                playerId,
                playerName: botInstance.display_name,
                reason: 'Bot removed by admin'
              });

              // If game ended due to fold, handle game over
              if (foldResult.gameOver && foldResult.winner) {
                this.io?.to(`table_${tableId}`).emit('gameOver', {
                  winner: foldResult.winner.getPublicData(false),
                  reason: 'Bot folded - only one player remaining'
                });
                
                table.gameState = 0; // GameState.WAITING
              }

              // Send table update after fold
              this.io?.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());

              // Wait a moment to ensure fold is processed
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        // Now remove the bot from the table
        const result = gameService.removePlayer(tableId, playerId);
        
        if (result.success) {
          
          // Emit to all players
          this.io?.to(`table_${tableId}`).emit('playerRemoved', {
            playerId,
            playerName: botInstance.display_name,
            reason: 'Bot removed by admin'
          });

          // Check if game ended due to bot removal
          if (result.gameOver && result.winner) {
            
            const table = gameService.getTable(tableId);
            if (table) {
              this.io?.to(`table_${tableId}`).emit('gameOver', {
                winner: result.winner.getPublicData(false),
                reason: 'Bot removed - only one player remaining'
              });
              
              // Reset game state
              table.gameState = 0; // GameState.WAITING
              this.io?.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
            }
          } else {
            // Normal removal - send table update
            const table = gameService.getTable(tableId);
            if (table) {
              this.io?.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
            }
          }
        }

        // Update database
        await BotInstanceRepository.update(botSocket.botInstanceId, {
          assigned_table_id: undefined,
        });
      }

      // Clean up bot socket
      botSocket.connected = false;
      botSocket.removeAllListeners();
      this.botSockets.delete(botSocketId);

      // Clear any active timers
      const timer = this.activeBots.get(botSocketId);
      if (timer) {
        clearTimeout(timer);
        this.activeBots.delete(botSocketId);
      }

      return true;
    } catch (error) {
      console.error('❌ Error removing bot:', error);
      return false;
    }
  }

  /**
   * Get all active bot sockets
   */
  getActiveBots(): BotSocket[] {
    return Array.from(this.botSockets.values());
  }

  /**
   * Get bot socket by ID
   */
  getBotSocket(socketId: string): BotSocket | undefined {
    return this.botSockets.get(socketId);
  }

  /**
   * Check if socket belongs to a bot
   */
  isBot(socketId: string): boolean {
    return this.botSockets.has(socketId) || socketId.startsWith('bot_');
  }

  /**
   * Get bot by player ID
   */
  getBotByPlayerId(playerId: string): BotSocket | undefined {
    for (const botSocket of this.botSockets.values()) {
      if (botSocket.data.userId === playerId) {
        return botSocket;
      }
    }
    return undefined;
  }

  /**
   * Get SocketHandler reference (for accessing GameService)
   */
  getSocketHandler(): any {
    return this.socketHandler;
  }
}

export default BotSocketManager.getInstance();

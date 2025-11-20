import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameService } from '../services/GameService.js';
import { GameState, GameMode, Table } from '../models/Table.js';
import { userRepository } from '../repositories/UserRepository.js';
import type { Player } from '../models/Player.js';
import BotGameplayService from '../services/BotGameplayService.js';
import BotSocketManager from '../services/BotSocketManager.js';
import { JokerSocketHandler } from './JokerSocketHandler.js';
import { initializeLobbyMonitor, lobbyMonitorService } from '../services/LobbyMonitorService.js';
import { botAIController } from '../services/BotAIController.js';
import { autonomousBotService } from '../services/AutonomousBotService.js';
import { Settings } from '../models/Settings.model.js';

/**
 * Socket.IO event handlers for game logic
 */
export class SocketHandler {
  private io: SocketIOServer;
  private gameService: GameService;
  private jokerHandler: JokerSocketHandler;
  private turnTimers: Map<string, NodeJS.Timeout> = new Map();
  private turnCountdowns: Map<string, NodeJS.Timeout> = new Map();
  private gameStartCountdowns: Map<number, NodeJS.Timeout> = new Map(); // Track countdown timers per table
  private playerCurrentBets: Map<string, number> = new Map();
  private socketToPlayer: Map<string, { playerId: string; tableId: number }> = new Map();
  private usernameToPlayer: Map<string, { playerId: string; tableId: number; socketId: string }> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // For cleanup purposes
  private readonly TURN_TIMEOUT = 20000; // 20 seconds

  constructor(server: HTTPServer) {
    const allowedOrigins = process.env.SOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // In development, allow all origins
          if (process.env.NODE_ENV === 'development' || !origin) {
            callback(null, true);
          } else if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Connection settings to handle idle connections
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });

    this.gameService = new GameService();
    this.jokerHandler = new JokerSocketHandler(this.io, this.gameService);
    this.setupEventHandlers();
    
    // Create initial table for practice mode
    this.gameService.createTable(1, 1, GameMode.PRACTICE);
    
    // Initialize autonomous bot system for practice mode lobbies
    initializeLobbyMonitor(this.gameService);
    console.log('🤖 Autonomous bot system initialized for practice mode lobbies');
    
    // Note: Additional tables will be created automatically when needed
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {

      // Join table
      socket.on('joinTable', (data: { tableId: number; playerInfo: any }) => {
        this.handleJoinTable(socket, data);
      });

      // Start game
      socket.on('startGame', (data: { tableId: number }) => {
        this.handleStartGame(socket, data);
      });

      // See cards
      socket.on('seeCards', (data: { tableId: number; playerId: string }) => {
        this.handleSeeCards(socket, data);
      });

      // Make bet
      socket.on('bet', (data: { tableId: number; playerId: string; amount: number }) => {
        this.handleBet(socket, data);
      });

      // Fold
      socket.on('fold', (data: { tableId: number; playerId: string }) => {
        this.handleFold(socket, data);
      });

      // Side show
      socket.on('sideShow', (data: { tableId: number; playerId: string; targetPlayerId: string }) => {
        this.handleSideShow(socket, data);
      });

      // Show
      socket.on('show', (data: { tableId: number; playerId: string }) => {
        this.handleShow(socket, data);
      });

      // Current bet update (from client)
      socket.on('currentBetUpdate', (data: { playerId: string; amount: number }) => {
        this.playerCurrentBets.set(data.playerId, data.amount);
      });

      // Remove player completely from table (cleanup)
      socket.on('removePlayer', (data: { tableId: number; playerId: string; reason: string }) => {
        this.handleRemovePlayer(socket, data);
      });

      // Leave table
      socket.on('leaveTable', (data: { tableId: number; playerId: string }) => {
        this.handleLeaveTable(socket, data);
      });

      // Force disconnect for session conflicts
      socket.on('forceDisconnect', (data: { userId: string }) => {
        this.handleForceDisconnect(data);
      });

      // Register Joker handlers
      this.jokerHandler.registerHandlers(socket);

      // Heartbeat - respond to client ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect - Player leaves game
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Update ALL players' balances in database after game ends
   */
  private async updateAllPlayersBalances(table: any, gameMode: GameMode): Promise<void> {
    try {
      const players = table.getPlayers();
      
      for (const player of players) {
        const userId = player.playerInfo.userId;
        
        if (!userId) {
          console.warn(`⚠️ No userId found for player ${player.playerInfo.userName}`);
          continue;
        }

        const currentBalance = player.playerInfo.chips;
        
        // Update the appropriate coin type based on game mode
        if (gameMode === GameMode.PRACTICE) {
          const updatedUser = await userRepository.updatePracticeCoins(userId, 0);
          if (updatedUser) {
            updatedUser.practiceCoins = currentBalance;
            await updatedUser.save();
            
            
            // Emit coin update to player's socket
            const playerSession = Array.from(this.socketToPlayer.entries())
              .find(([_, data]) => data.playerId === player.id);
            
            if (playerSession) {
              const [socketId] = playerSession;
              const playerSocket = this.io.sockets.sockets.get(socketId);
              if (playerSocket) {
                playerSocket.emit('coinsUpdated', {
                  practiceCoins: currentBalance,
                  realCoins: updatedUser.realCoins
                });
              }
            }
          }
        } else {
          const updatedUser = await userRepository.updateRealCoins(userId, 0);
          if (updatedUser) {
            updatedUser.realCoins = currentBalance;
            await updatedUser.save();
            
            
            // Emit coin update to player's socket
            const playerSession = Array.from(this.socketToPlayer.entries())
              .find(([_, data]) => data.playerId === player.id);
            
            if (playerSession) {
              const [socketId] = playerSession;
              const playerSocket = this.io.sockets.sockets.get(socketId);
              if (playerSocket) {
                playerSocket.emit('coinsUpdated', {
                  practiceCoins: updatedUser.practiceCoins,
                  realCoins: currentBalance
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating all players balances:', error);
    }
  }

  /**
   * Save a single player's balance to database
   * Used when player folds and leaves mid-game
   */
  private async savePlayerBalance(player: any, gameMode: GameMode): Promise<void> {
    try {
      const userId = player.playerInfo.userId;
      
      if (!userId) {
        console.warn(`⚠️ No userId found for player ${player.playerInfo.userName}`);
        return;
      }

      // Round to 2 decimal places to prevent floating-point errors
      const currentBalance = Math.round(player.playerInfo.chips * 100) / 100;
      
      // Update the appropriate coin type based on game mode
      if (gameMode === GameMode.PRACTICE) {
        const updatedUser = await userRepository.updatePracticeCoins(userId, 0);
        if (updatedUser) {
          updatedUser.practiceCoins = currentBalance;
          await updatedUser.save();
          console.log(`💾 Saved practice balance for ${player.playerInfo.userName}: ${currentBalance}`);
          
          // Emit coin update to player's socket
          const playerSession = Array.from(this.socketToPlayer.entries())
            .find(([_, data]) => data.playerId === player.id);
          
          if (playerSession) {
            const [socketId] = playerSession;
            const playerSocket = this.io.sockets.sockets.get(socketId);
            if (playerSocket) {
              playerSocket.emit('coinsUpdated', {
                practiceCoins: currentBalance,
                realCoins: updatedUser.realCoins
              });
            }
          }
        }
      } else {
        const updatedUser = await userRepository.updateRealCoins(userId, 0);
        if (updatedUser) {
          updatedUser.realCoins = currentBalance;
          await updatedUser.save();
          console.log(`💾 Saved cash balance for ${player.playerInfo.userName}: ${currentBalance}`);
          
          // Emit coin update to player's socket
          const playerSession = Array.from(this.socketToPlayer.entries())
            .find(([_, data]) => data.playerId === player.id);
          
          if (playerSession) {
            const [socketId] = playerSession;
            const playerSocket = this.io.sockets.sockets.get(socketId);
            if (playerSocket) {
              playerSocket.emit('coinsUpdated', {
                practiceCoins: updatedUser.practiceCoins,
                realCoins: currentBalance
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error saving player balance for ${player.playerInfo.userName}:`, error);
    }
  }

  private async handleJoinTable(socket: Socket, data: { tableId?: number; playerInfo: any; gameMode?: string }): Promise<void> {
    const username = data.playerInfo.userName;
    const userId = data.playerInfo.userId;
    
    // Determine game mode from client or infer from tableId
    let gameMode: GameMode;
    if (data.gameMode === 'real' || data.gameMode === 'cash') {
      gameMode = GameMode.REAL;
    } else if (data.gameMode === 'coins' || data.gameMode === 'practice') {
      gameMode = GameMode.PRACTICE;
    } else if (data.tableId) {
      // Infer from tableId range:
      // Practice/Coins: 10000-19999
      // Cash/Real: 20000-29999
      gameMode = data.tableId >= 20000 ? GameMode.REAL : GameMode.PRACTICE;
    } else {
      gameMode = GameMode.PRACTICE; // Default
    }
    
    const bootAmount = 1; // Default boot amount
    
    
    // Check if this username already has an active session
    const existingSession = this.usernameToPlayer.get(username);
    if (existingSession) {
      const existingSocket = this.io.sockets.sockets.get(existingSession.socketId);
      
      // If it's the same socket ID, allow rejoining (this handles retry attempts)
      if (existingSession.socketId === socket.id) {
        // Allow the join to proceed - will reuse same player ID
        socket.emit('joinedTable', { 
          success: true, 
          playerId: existingSession.playerId,
          tableId: existingSession.tableId
        });
        
        // Send updated table state
        const table = this.gameService.getTable(existingSession.tableId);
        if (table) {
          socket.emit('tableUpdate', table.getTableState());
        }
        return;
      }
      
      if (existingSocket && existingSocket.connected) {
        // User is trying to join from another tab/window
        socket.emit('joinedTable', { 
          success: false, 
          message: 'You are already connected from another window. Please close other tabs or refresh this page.' 
        });
        return;
      } else {
        // Old session is disconnected, clean it up
        
        // Use proper removal handler to ensure game logic is maintained
        const oldTable = this.gameService.getTable(existingSession.tableId);
        if (oldTable) {
          const removeResult = this.gameService.removePlayer(existingSession.tableId, existingSession.playerId);
          
          // If game ended due to removal, notify remaining players
          if (removeResult.success && removeResult.gameOver && removeResult.winner) {
            this.io.to(`table_${existingSession.tableId}`).emit('playerRemoved', {
              playerId: existingSession.playerId,
              playerName: username,
              reason: 'reconnect_cleanup'
            });
            
            await this.handleGameCompletion(
              existingSession.tableId,
              removeResult.winner,
              `${username} reconnected - old session cleaned up`
            );
          } else if (removeResult.success) {
            // Normal removal, notify players
            this.io.to(`table_${existingSession.tableId}`).emit('playerRemoved', {
              playerId: existingSession.playerId,
              playerName: username,
              reason: 'reconnect_cleanup'
            });
            
            this.io.to(`table_${existingSession.tableId}`).emit('tableUpdate', oldTable.getTableState());
          }
        }
        
        this.usernameToPlayer.delete(username);
        if (existingSession.socketId) {
          this.socketToPlayer.delete(existingSession.socketId);
        }
      }
    }
    
    // Determine which table to use
    let table: Table | undefined;
    let actualTableId: number;
    
    if (data.tableId) {
      // Client specified a table ID
      actualTableId = data.tableId;
      table = this.gameService.getTable(actualTableId);
      
      if (!table) {
        // Table doesn't exist, create it with the correct game mode
        table = this.gameService.createTable(actualTableId, bootAmount, gameMode);
      } else {
        // Table exists - verify game mode matches
        if (table.config.gameMode !== gameMode) {
          socket.emit('joinedTable', { 
            success: false, 
            message: `This table is for ${table.config.gameMode} mode players only. Please select the correct game mode.` 
          });
          return;
        }
        
        // Check if table is full
        if (table.getPlayers().length >= table.config.maxPlayers) {
          // Find or create another table in the same mode
          table = this.gameService.findOrCreateAvailableTable(gameMode, bootAmount);
          actualTableId = table.id;
        }
      }
    } else {
      // No table ID specified, find or create an available table
      table = this.gameService.findOrCreateAvailableTable(gameMode, bootAmount);
      actualTableId = table.id;
    }
    
    
    // Use provided userId for bots, generate random ID for human players
    const playerId = data.playerInfo.userId || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = this.gameService.joinTable(
      actualTableId,
      playerId,
      data.playerInfo,
      socket.id
    );

    if (result.success) {
      socket.join(`table_${actualTableId}`);
      
      // Store socket to player mapping for disconnect handling
      this.socketToPlayer.set(socket.id, { playerId, tableId: actualTableId });
      
      // Store username to player mapping to prevent duplicate sessions
      this.usernameToPlayer.set(username, { 
        playerId, 
        tableId: actualTableId, 
        socketId: socket.id 
      });
      
      socket.emit('joinedTable', { success: true, playerId, tableId: actualTableId });
      
      // Handle autonomous bots for practice mode
      if (table && table.config.gameMode === GameMode.PRACTICE) {
        // Remove bots if too many players now
        const removedBotIds = lobbyMonitorService?.removeBotsIfTooMany(table) || [];
        
        // Notify about removed bots
        if (removedBotIds.length > 0) {
          this.io.to(`table_${actualTableId}`).emit('botsRemoved', {
            botIds: removedBotIds,
            reason: 'Human player joined'
          });
        }
        
        // Check if we need to add bots
        lobbyMonitorService?.checkTableOnHumanJoin(table);
      }
      
      // Check if game is in progress
      if (table) {
        const player = table.getPlayer(playerId);
        
        // If game is in progress (not waiting), mark player as waiting for next round
        if (table.gameState !== GameState.WAITING && player) {
          player.waitingForNextRound = true;
          socket.emit('notification', {
            message: 'Game in progress. You will join the next round.',
            type: 'info',
            duration: 5000
          });
          
          // Check if only one active player remains (others folded/disconnected)
          // If so, that player should win immediately
          const activePlayers = table.getActivePlayers();
          if (activePlayers.length === 1 && table.pot > 0) {
            const winner = activePlayers[0];
            await this.handleGameCompletion(
              actualTableId,
              winner,
              'Last player standing'
            );
            return; // Exit early, game is over
          }
        }
        
        // Broadcast table state to all players
        this.io.to(`table_${actualTableId}`).emit('tableUpdate', table.getTableState());
      }

      
      // Auto-start game if 2+ players and game not started
      if (table) {
        const activePlayerCount = table.getActivePlayers().length;
        const totalPlayerCount = table.getPlayers().length;
        
        if (activePlayerCount >= 2 && table.gameState === 'waiting') {
          setTimeout(() => {
            this.handleStartGame(socket, { tableId: actualTableId });
          }, 500); // Reduced from 1000ms to 500ms for smoother experience
        } else if (totalPlayerCount === 1) {
          socket.emit('notification', {
            message: 'Waiting for more players to join...',
            type: 'info'
          });
        }
      }
    } else {
      socket.emit('joinedTable', { success: false, message: result.message });
    }
  }

  private handleStartGame(socket: Socket, data: { tableId: number }): void {
    const table = this.gameService.getTable(data.tableId);
    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    // Check if enough players
    if (table.getPlayers().length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    // Check and remove players with insufficient chips for boot amount
    const bootAmount = table.config.bootAmount;
    const playersToRemove: string[] = [];
    
    table.getPlayers().forEach((player) => {
      if (player.playerInfo.chips < bootAmount) {
        playersToRemove.push(player.id);
      }
    });

    // Remove players with insufficient balance
    playersToRemove.forEach((playerId) => {
      const player = table.getPlayer(playerId);
      if (player) {
        this.gameService.removePlayer(data.tableId, playerId);
        
        // Notify the removed player
        const playerSocket = this.io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.emit('kicked', {
            reason: 'insufficient_balance',
            message: `You need at least ${bootAmount} chips to play. You have been removed from the game.`
          });
        }
        
        // Broadcast removal
        this.io.to(`table_${data.tableId}`).emit('playerRemoved', {
          playerId,
          playerName: player.playerInfo.userName,
          reason: 'insufficient_balance'
        });
        
        // Cleanup
        this.cleanupPlayerData(playerId);
        this.usernameToPlayer.delete(player.playerInfo.userName);
      }
    });

    // Check if we still have enough players after removals
    if (table.getPlayers().length < 2) {
      this.io.to(`table_${data.tableId}`).emit('error', { 
        message: 'Not enough players with sufficient chips to start the game' 
      });
      return;
    }

    // Clear any existing countdown for this table
    const existingCountdown = this.gameStartCountdowns.get(data.tableId);
    if (existingCountdown) {
      clearInterval(existingCountdown);
      this.gameStartCountdowns.delete(data.tableId);
    }

    // Emit countdown to all players with ticker
    let countdown = 7;
    this.io.to(`table_${data.tableId}`).emit('gameCountdown', { countdown });

    // Countdown ticker - update every second
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.io.to(`table_${data.tableId}`).emit('gameCountdown', { countdown });
      } else {
        clearInterval(countdownInterval);
        this.gameStartCountdowns.delete(data.tableId);
      }
    }, 1000);

    // Store the countdown interval
    this.gameStartCountdowns.set(data.tableId, countdownInterval);

    // Start game after countdown (7 seconds total)
    setTimeout(() => {
      const result = this.gameService.startGame(data.tableId);
      
      if (result.success && table) {
        
        // Initialize Joker state for this game
        this.jokerHandler.initializeGameJokerState(`table_${data.tableId}`);
        
        // Send game started event to all players with their personalized view
        table.getPlayers().forEach((player) => {
          const playerSocket = this.io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('gameStarted', table.getTableState(player.id));
          }
        });

        // Start turn timer for first player
        const firstPlayer = table.getPlayers().find(p => p.turn);
        if (firstPlayer) {
          this.startTurnTimer(data.tableId, firstPlayer.id, socket);
          
          // Check if first player is a bot and handle automatically
          this.handleBotTurnIfNeeded(table, data.tableId);
        }
      } else {
        this.io.to(`table_${data.tableId}`).emit('error', { message: result.message || 'Failed to start game' });
      }
    }, countdown * 1000);
  }

  private handleSeeCards(socket: Socket, data: { tableId: number; playerId: string }): void {
    const result = this.gameService.handleSeeCards(data.tableId, data.playerId);
    
    if (result.success) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        const player = table.getPlayer(data.playerId);
        const playerName = player?.playerInfo.userName || 'Player';
        
        // Send full table state to the player who saw cards (with their cards visible)
        socket.emit('tableUpdate', table.getTableState(data.playerId));
        
        // Notify others that player saw cards (without showing their cards)
        socket.to(`table_${data.tableId}`).emit('playerSawCards', { playerId: data.playerId });
        socket.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
        
        // Broadcast notification to all players
        this.io.to(`table_${data.tableId}`).emit('notification', {
          message: `${playerName} saw their cards`,
          type: 'info'
        });
        
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  }

  private handleSeeOtherPlayerCards(socket: Socket, data: { tableId: number; playerId: string; targetPlayerId: string }): void {
    
    const table = this.gameService.getTable(data.tableId);
    
    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    const requestingPlayer = table.getPlayer(data.playerId);
    const targetPlayer = table.getPlayer(data.targetPlayerId);

    if (!requestingPlayer) {
      socket.emit('error', { message: 'Requesting player not found' });
      return;
    }

    if (!targetPlayer) {
      socket.emit('error', { message: 'Target player not found' });
      return;
    }

    // Check if target player has seen their cards
    if (targetPlayer.isBlind()) {
      socket.emit('error', { message: 'Target player has not seen their cards yet' });
      return;
    }

    // TODO: Verify requesting player is subscribed/premium user
    // When you add subscription field to PlayerInfo, uncomment this:
    // if (!requestingPlayer.playerInfo.isSubscribed) {
    //   console.log(`❌ Player ${requestingPlayer.playerInfo.userName} is not subscribed`);
    //   socket.emit('error', { message: 'This feature requires a premium subscription' });
    //   return;
    // }
    
    // For now, allow all players (temporary - remove when subscription is implemented)

    // Send the target player's cards to the requesting player
    const requestingPlayerName = requestingPlayer.playerInfo.userName || 'Player';
    const targetPlayerName = targetPlayer.playerInfo.userName || 'Player';
    
    // Get table state with target player's cards visible
    const tableStateWithTargetCards = table.getTableState(data.targetPlayerId);
    const targetPlayerData = tableStateWithTargetCards.players.find((p: any) => p.id === data.targetPlayerId);

    if (targetPlayerData && targetPlayerData.cardSet) {
      
      socket.emit('otherPlayerCards', {
        playerId: data.targetPlayerId,
        cards: targetPlayerData.cardSet.cards,
      });

      
      // Optional: Notify the requesting player
      socket.emit('notification', {
        message: `Viewing ${targetPlayerName}'s cards`,
        type: 'info'
      });
    } else {
      socket.emit('error', { message: 'Could not retrieve target player cards' });
    }
  }

  private async handleBet(socket: Socket, data: { tableId: number; playerId: string; amount: number }): Promise<void> {
    this.clearTurnTimer(data.playerId);
    
    try {
      const table = this.gameService.getTable(data.tableId);
      if (!table) return;

      const player = table.getPlayer(data.playerId);
      if (!player) return;

      // Check if player has sufficient balance BEFORE betting
      if (player.playerInfo.chips < data.amount) {
      
      // Remove the player from the game entirely
      const removeResult = this.gameService.removePlayer(data.tableId, data.playerId);
      
      if (removeResult.success) {
        // Clear timers and cleanup
        this.cleanupPlayerData(data.playerId);
        
        // Remove from username mapping
        this.usernameToPlayer.delete(player.playerInfo.userName);
        
        // Notify the player they've been removed
        socket.emit('error', { 
          message: 'Insufficient chips. You have been removed from the game.',
          type: 'INSUFFICIENT_BALANCE'
        });
        
        socket.emit('kicked', {
          reason: 'insufficient_balance',
          message: 'You do not have enough chips to continue playing.'
        });
        
        // Broadcast to all players
        this.io.to(`table_${data.tableId}`).emit('playerRemoved', {
          playerId: data.playerId,
          playerName: player.playerInfo.userName,
          reason: 'insufficient_balance'
        });
        
        this.io.to(`table_${data.tableId}`).emit('notification', {
          message: `${player.playerInfo.userName} was removed (insufficient chips)`,
          type: 'warning'
        });
        
        // Check if game should end
        if (removeResult.gameOver && removeResult.winner) {
          await this.handleGameCompletion(
            data.tableId,
            removeResult.winner,
            `${player.playerInfo.userName} ran out of chips`
          );
        } else {
          // Game continues, send updated state
          this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
          
          // Start timer for next player if needed
          const nextPlayer = table.getPlayers().find(p => p.turn);
          if (nextPlayer) {
            this.startTurnTimer(data.tableId, nextPlayer.id, socket);
          }
        }
      }
      
      return;
    }

    const isBlind = player.isBlind();
    const result = this.gameService.handleBet(data.tableId, data.playerId, data.amount, isBlind);

    if (result.success) {
      // Broadcast table update
      this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
      this.io.to(`table_${data.tableId}`).emit('playerBet', {
        playerId: data.playerId,
        amount: data.amount,
        isBlind,
      });

      // Check if game is over (only one player left after bet)
      if (result.gameOver && result.winner) {
        await this.handleGameCompletion(
          data.tableId,
          result.winner,
          'Last player standing after bet'
        );
        return;
      }

      // Start timer for next player
      const nextPlayer = table.getPlayers().find(p => p.turn);
      if (nextPlayer) {
        this.startTurnTimer(data.tableId, nextPlayer.id, socket);
        
        // Check if next player is a bot and handle automatically
        this.handleBotTurnIfNeeded(table, data.tableId);
      }
    }
    } catch (error: any) {
      console.error('Error handling bet:', error);
    }
  }

  private async handleFold(socket: Socket | null, data: { tableId: number; playerId: string }): Promise<void> {
    this.clearTurnTimer(data.playerId);
    
    const table = this.gameService.getTable(data.tableId);
    const player = table?.getPlayer(data.playerId);
    const playerName = player?.playerInfo.userName || 'Player';
    
    const result = this.gameService.handleFold(data.tableId, data.playerId);

    if (result.success) {
      // SAVE PLAYER BALANCE IMMEDIATELY AFTER FOLD
      // This ensures balance is saved even if player leaves before game ends
      if (player) {
        const gameMode = data.tableId >= 20000 ? GameMode.REAL : GameMode.PRACTICE;
        await this.savePlayerBalance(player, gameMode);
      }
      
      if (table) {
        this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
        this.io.to(`table_${data.tableId}`).emit('playerFolded', { 
          playerId: data.playerId,
          playerName: playerName
        });
        
        // Broadcast notification
        this.io.to(`table_${data.tableId}`).emit('notification', {
          message: `${playerName} folded`,
          type: 'info'
        });

        if (result.gameOver && result.winner) {
          await this.handleGameCompletion(
            data.tableId,
            result.winner,
            'All other players folded'
          );
        } else {
          // Start timer for next player
          const nextPlayer = table.getPlayers().find(p => p.turn);
          if (nextPlayer) {
            // Use provided socket or create a dummy socket for timer management
            this.startTurnTimer(data.tableId, nextPlayer.id, socket || {} as Socket);
          }
        }

      }
    }
  }

  private handleSideShow(socket: Socket, data: { tableId: number; playerId: string; targetPlayerId?: string }): void {
    // Note: targetPlayerId is optional - system determines PREVIOUS player automatically
    const result = this.gameService.handleSideShow(data.tableId, data.playerId);

    if (result.success) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        this.io.to(`table_${data.tableId}`).emit('sideShowResult', {
          playerId: data.playerId,
          targetPlayerId: result.targetPlayerId,
          loser: result.loser?.id,
        });

        this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());

      }
    } else {
      socket.emit('error', { message: result.message });
    }
  }

  private async handleShow(socket: Socket, data: { tableId: number; playerId: string }): Promise<void> {
    this.clearTurnTimer(data.playerId);
    
    const result = this.gameService.handleShow(data.tableId, data.playerId);

    if (result.success && result.winner) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        await this.handleGameCompletion(
          data.tableId,
          result.winner,
          'Show',
          result.results
        );
      }
    }
  }

  private async startTurnTimer(tableId: number, playerId: string, socket: Socket): Promise<void> {
    this.clearTurnTimer(playerId);
    
    // Check if player can afford minimum bet - auto-fold if not
    const table = this.gameService.getTable(tableId);
    if (table) {
      const player = table.getPlayer(playerId);
      if (player) {
        const minBet = this.gameService.getMinimumBet(tableId, playerId);
        const playerBalance = player.playerInfo?.chips || 0;
        
        if (playerBalance < minBet) {
          console.log(`💰 Player ${player.playerInfo?.userName} has insufficient balance (${playerBalance} < ${minBet}) - auto-folding`);
          await this.handleFold(null, { tableId, playerId });
          this.io.to(`table_${tableId}`).emit('playerAutoFolded', {
            playerId,
            playerName: player.playerInfo?.userName || 'Player',
            reason: 'Insufficient balance to continue'
          });
          return;
        }
      }
    }
    
    // Check if player is a bot
    const isBot = await BotGameplayService.isBot(playerId);
    
    // All players (bots and humans) get 20 seconds
    let timeLeft = 20;
    
    
    // Emit initial timer
    this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
    
    // Countdown interval for all players (bots and humans)
    const countdown = setInterval(() => {
      timeLeft--;
      if (timeLeft >= 0) {
        this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
        
        // Request current bet at 2 seconds (for humans)
        if (timeLeft === 2 && !isBot) {
          socket.emit('requestCurrentBet', { playerId });
        }
      } else {
        // Stop countdown when it reaches -1
        clearInterval(countdown);
        this.turnCountdowns.delete(playerId);
      }
    }, 1000);
    
    this.turnCountdowns.set(playerId, countdown);
    
    // Bots take action after 3-6 seconds (realistic thinking time) but timer continues to 20
    if (isBot) {
      const botThinkTime = 3000 + Math.random() * 3000; // 3-6 seconds
      const botActionTimer = setTimeout(async () => {
        // Bot decision logic
        try {
          const table = this.gameService.getTable(tableId);
          if (!table) return;
          
          const player = table.getPlayer(playerId);
          if (!player || !player.turn) return;
          
          const currentBet = this.playerCurrentBets.get(playerId) || 0;
          const minBet = this.gameService.getMinimumBet(tableId, playerId);
          const playerBalance = player.playerInfo?.chips || 0;
          const pot = table.pot || 0;
          const hand = player.cardSet?.cards.map(c => `${c.rank}${c.type.charAt(0).toUpperCase()}`) || [];
          
          const botAction = await BotGameplayService.getBotDecision(
            playerId,
            tableId,
            currentBet,
            minBet,
            playerBalance,
            pot,
            hand
          );
          
          
          // Execute bot action
          if (botAction.action === 'fold') {
            console.log(`🤖 Bot ${player.playerInfo?.userName} decided to fold`);
            await this.handleFold(null, { tableId, playerId });
          } else if (botAction.action === 'call' || botAction.action === 'raise') {
            console.log(`🤖 Bot ${player.playerInfo?.userName} decided to ${botAction.action} with amount ${botAction.amount}`);
            await this.handleBet(socket, { 
              tableId, 
              playerId, 
              amount: botAction.amount || minBet 
            });
          }
          
          // Clear the 20-second timer since bot acted
          this.clearTurnTimer(playerId);
        } catch (error) {
          console.error(`❌ Error in bot decision for ${playerId}:`, error);
          // On error, let the 20-second timeout handle it
        }
      }, botThinkTime);
      
      // Store bot action timer so it can be cleared if needed
      this.turnTimers.set(`${playerId}_bot_action`, botActionTimer);
    }
    
    // Timeout action after 20 seconds (fallback for both bots and humans)
    const timer = setTimeout(async () => {
      
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
      
      const table = this.gameService.getTable(tableId);
      if (!table) {
        return;
      }
      
      const player = table.getPlayer(playerId);
      if (!player) {
        return;
      }
      
      if (!player.turn) {
        return;
      }
      
      // Double-check timer hasn't been cleared
      if (!this.turnTimers.has(playerId)) {
        return;
      }
      
      // If bot hasn't acted yet by 20 seconds (rare), or human timeout - auto-fold
      console.log(`⏰ Timer expired for ${player.playerInfo?.userName} (bot: ${isBot}) - auto-folding`);
      await this.handleFold(null, { tableId, playerId });
      
      // Notify all players
      this.io.to(`table_${tableId}`).emit('playerTimeout', {
        playerId,
        playerName: player.playerInfo?.userName || 'Player',
        message: 'Timed out and folded'
      });
    }, 20000); // 20 seconds for all players
    
    this.turnTimers.set(playerId, timer);
  }

  /**
   * Clear turn timer - alias for cleanupPlayerData for backwards compatibility
   */
  private clearTurnTimer(playerId: string): void {
    this.cleanupPlayerData(playerId);
  }

  /**
   * Clean up all player-related data (timers, bets, etc.)
   */
  private cleanupPlayerData(playerId: string): void {
    const timer = this.turnTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(playerId);
    }
    
    // Also clear bot action timer if it exists
    const botActionTimer = this.turnTimers.get(`${playerId}_bot_action`);
    if (botActionTimer) {
      clearTimeout(botActionTimer);
      this.turnTimers.delete(`${playerId}_bot_action`);
    }
    
    const countdown = this.turnCountdowns.get(playerId);
    if (countdown) {
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
    }
    
    // Clear disconnect timer if exists
    const disconnectTimer = this.disconnectTimers.get(playerId);
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      this.disconnectTimers.delete(playerId);
    }
    
    this.playerCurrentBets.delete(playerId);
  }

  /**
   * Handle game completion and auto-restart
   * Centralizes all game over logic
   */
  private async handleGameCompletion(
    tableId: number, 
    winner: Player, 
    reason: string,
    results?: Map<string, any>
  ): Promise<void> {
    const table = this.gameService.getTable(tableId);
    if (!table) return;

    // Clear all timers for all players
    table.getPlayers().forEach(player => {
      this.cleanupPlayerData(player.id);
    });

    // Apply game payout commission for REAL money games
    let winnerPayout = table.pot;
    let adminCommission = 0;
    
    if (table.config.gameMode === GameMode.REAL && table.pot > 0) {
      try {
        // Fetch game payout commission setting
        const commissionSetting = await Settings.findOne({ key: 'gamePayoutCommission' });
        const commissionPercentage = commissionSetting?.value || 40; // Default 40%
        
        // Calculate commission (admin gets X%, winner gets (100-X)%)
        adminCommission = Math.round(table.pot * (commissionPercentage / 100) * 100) / 100;
        winnerPayout = Math.round((table.pot - adminCommission) * 100) / 100;
        
        // Adjust winner's chips to reflect the commission deduction
        winner.playerInfo.chips = Math.round((winner.playerInfo.chips - adminCommission) * 100) / 100;
        
        console.log(`💰 Game payout split - Pot: ₹${table.pot}, Winner: ₹${winnerPayout} (${100 - commissionPercentage}%), Admin: ₹${adminCommission} (${commissionPercentage}%)`);
      } catch (error) {
        console.error('❌ Error applying game payout commission:', error);
        // Fallback: winner gets full pot
        winnerPayout = table.pot;
        adminCommission = 0;
      }
    }

    // Emit game over to all players with payout details
    this.io.to(`table_${tableId}`).emit('gameOver', {
      winner: winner.getPublicData(false),
      results: results ? Object.fromEntries(results) : undefined,
      reason: reason,
      pot: table.pot,
      winnerPayout: winnerPayout,
      adminCommission: adminCommission,
    });

    
    // Handle Joker fees and calculate winner before updating balances
    const winAmount = table.pot;
    const userId = winner.playerInfo.userId;
    if (userId) {
      await this.jokerHandler.handleGameEnd(`table_${tableId}`, userId, winAmount);
    }
    
    // Update ALL players' coins in database
    await this.updateAllPlayersBalances(table, table.config.gameMode);
    
    // Set game state to finished
    table.gameState = GameState.FINISHED;
    
    // Send updated table state to show game is finished
    this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
    
    // Clear any existing countdown for this table
    const existingCountdown = this.gameStartCountdowns.get(tableId);
    if (existingCountdown) {
      clearInterval(existingCountdown);
      this.gameStartCountdowns.delete(tableId);
    }
    
    // Start countdown for next game
    let countdown = 6;
    this.io.to(`table_${tableId}`).emit('gameCountdown', { countdown });
    
    // Countdown ticker - update every second
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.io.to(`table_${tableId}`).emit('gameCountdown', { countdown });
      } else {
        clearInterval(countdownInterval);
        this.gameStartCountdowns.delete(tableId);
      }
    }, 1000);
    
    // Store the countdown interval
    this.gameStartCountdowns.set(tableId, countdownInterval);
    
    
    // Auto-restart game after 6 seconds
    setTimeout(async () => {
      const currentTable = this.gameService.getTable(tableId);
      if (!currentTable) {
        return;
      }

      const remainingPlayers = currentTable.getPlayers();
      
      if (remainingPlayers.length >= 2) {
        
        // Start game directly without another countdown (we already had a 6-second countdown)
        const result = this.gameService.startGame(tableId);
        
        if (result.success) {
          
          // Initialize Joker state for this game
          this.jokerHandler.initializeGameJokerState(`table_${tableId}`);
          
          // Emit game started event
          this.io.to(`table_${tableId}`).emit('gameStarted', currentTable.getTableState());
          
          // Start turn for first player
          const firstPlayer = currentTable.getActivePlayers()[0];
          if (firstPlayer) {
            console.log(`⏱️ Starting timer for first player: ${firstPlayer.playerInfo.userName} (${firstPlayer.id})`);
            // Find ANY connected socket in the table room instead of relying on socketId
            const socketsInRoom = await this.io.in(`table_${tableId}`).fetchSockets();
            if (socketsInRoom.length > 0) {
              // Use the first available socket (any socket in the room can trigger timer events)
              this.startTurnTimer(tableId, firstPlayer.id, socketsInRoom[0] as any);
              console.log(`✅ Timer started successfully for ${firstPlayer.playerInfo.userName}`);
            } else {
              console.error(`❌ No sockets found in table_${tableId} room to start timer`);
            }
          }
        } else {
          currentTable.gameState = GameState.WAITING;
          this.io.to(`table_${tableId}`).emit('tableUpdate', currentTable.getTableState());
        }
      } else {
        currentTable.gameState = GameState.WAITING;
        
        // Notify remaining player(s)
        this.io.to(`table_${tableId}`).emit('notification', {
          message: 'Waiting for more players to join...',
          type: 'info'
        });
        
        this.io.to(`table_${tableId}`).emit('tableUpdate', currentTable.getTableState());
      }
    }, 6000);
  }

  /**
   * Remove a player completely from the table (used by removePlayer event)
   * This ensures clean removal with proper fold handling if game is in progress
   */
  private async handleRemovePlayer(socket: Socket, data: { tableId: number; playerId: string; reason: string }): Promise<void> {
    const { tableId, playerId, reason } = data;
    
    const table = this.gameService.getTable(tableId);
    if (!table) {
      return;
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      return;
    }

    const playerName = player.playerInfo.userName;
    const playerSocket = this.io.sockets.sockets.get(player.socketId);

    // SAVE PLAYER BALANCE BEFORE REMOVAL - Critical for fold+leave scenario
    // Determine game mode from tableId (tables >= 20000 are REAL, < 20000 are PRACTICE)
    const currentGameMode = tableId >= 20000 ? GameMode.REAL : GameMode.PRACTICE;
    
    // Only save balance for non-bot players
    if (!autonomousBotService.isAutonomousBot(player)) {
      await this.savePlayerBalance(player, currentGameMode);
    } else {
      // Release bot name back to pool
      autonomousBotService.releaseBotName(player.playerInfo.userName);
    }

    // Use GameService to handle removal with proper game logic
    const result = this.gameService.removePlayer(tableId, playerId);
    
    if (!result.success) {
      console.error(`❌ Failed to remove player: ${result.message}`);
      return;
    }

    // Check if we need to clean up bots after human leaves (practice mode only)
    if (currentGameMode === GameMode.PRACTICE && !autonomousBotService.isAutonomousBot(player)) {
      lobbyMonitorService?.checkTableOnHumanLeave(table);
    }

    // Clear all timers and data for this player
    this.cleanupPlayerData(playerId);

    // Clean up socket mappings
    if (player.socketId) {
      this.socketToPlayer.delete(player.socketId);
    }
    this.socketToPlayer.delete(socket.id);

    // Clean up username mapping
    this.usernameToPlayer.delete(playerName);

    // If game ended as result of removal
    if (result.gameOver && result.winner) {
      
      // Notify ALL players about the removal BEFORE game completion
      this.io.to(`table_${tableId}`).emit('playerRemoved', {
        playerId,
        playerName,
        reason
      });

      await this.handleGameCompletion(
        tableId,
        result.winner,
        `${playerName} left the game`
      );
      
      // Don't send any more events - handleGameCompletion handles everything
      return;
    }

    // If player was folded during removal (but game continues)
    if (table.gameState === GameState.BETTING) {
      this.io.to(`table_${tableId}`).emit('playerFolded', { 
        playerId,
        playerName,
        reason: reason
      });
    }

    // Notify ALL players about the removal
    this.io.to(`table_${tableId}`).emit('playerRemoved', {
      playerId,
      playerName,
      reason
    });

    // Send updated table state to all remaining players
    const updatedTable = this.gameService.getTable(tableId);
    if (updatedTable) {
      this.io.to(`table_${tableId}`).emit('tableUpdate', updatedTable.getTableState());
    }

    // Kick the player back to dashboard if they disconnected
    if (playerSocket && reason === 'disconnect') {
      playerSocket.emit('kicked', {
        reason: 'disconnect',
        message: 'You have been disconnected from the game due to connection timeout.'
      });
      // Also force disconnect their socket
      playerSocket.disconnect(true);
    } else if (playerSocket) {
      // For manual removal, just notify them
      playerSocket.emit('removedFromTable', {
        success: true,
        message: `You have left the table. You can rejoin as a new player.`
      });
    }

    // Check if only bots remain and remove them
    await this.removeBotsIfNoHumans(tableId);
  }

  /**
   * Remove all bots from table if no human players remain
   */
  private async removeBotsIfNoHumans(tableId: number): Promise<void> {
    const table = this.gameService.getTable(tableId);
    if (!table) return;

    const players = table.getPlayers();
    const humanPlayers = players.filter((p: Player) => !p.playerInfo.isBot);

    // If no human players remain, remove all bots
    if (humanPlayers.length === 0 && players.length > 0) {
      console.log(`🤖 No humans left in table ${tableId}, removing ${players.length} bot(s)`);

      for (const player of players) {
        if (player.playerInfo.isBot) {
          // Remove bot from game
          this.gameService.removePlayer(tableId, player.id);
          
          // Clean up bot socket
          const BotSocketManager = await import('../services/BotSocketManager.js').then(m => m.default);
          const botSockets = (BotSocketManager as any).botSockets;
          
          if (botSockets) {
            for (const [socketId, botSocket] of botSockets.entries()) {
              if (botSocket.tableId === tableId) {
                await BotSocketManager.removeBot(socketId);
              }
            }
          }

          console.log(`  ✅ Removed bot: ${player.playerInfo.userName}`);
        }
      }

      // Notify that table is now empty
      this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
    }
  }

  /**
   * Handle player leaving table voluntarily (used by leaveTable event)
   */
  private handleLeaveTable(socket: Socket, data: { tableId: number; playerId: string }): void {
    
    // Use the removePlayer handler with 'leave' reason
    this.handleRemovePlayer(socket, {
      tableId: data.tableId,
      playerId: data.playerId,
      reason: 'leave'
    });
  }

  /**
   * Force disconnect a user (handle session conflicts)
   */
  private async handleForceDisconnect(data: { userId: string }): Promise<void> {
    const { userId } = data;

    // Find all sockets associated with this user
    const socketsToDisconnect: string[] = [];
    const playersToRemove: Array<{ tableId: number; playerId: string; playerName: string }> = [];

    // Check by playerId in socketToPlayer mapping
    for (const [socketId, playerData] of this.socketToPlayer.entries()) {
      if (playerData.playerId.includes(userId)) {
        socketsToDisconnect.push(socketId);
      }
    }

    // Check by username in usernameToPlayer mapping
    for (const [username, playerData] of this.usernameToPlayer.entries()) {
      if (username === userId || playerData.playerId.includes(userId)) {
        socketsToDisconnect.push(playerData.socketId);
        
        // Record player for removal
        playersToRemove.push({
          tableId: playerData.tableId,
          playerId: playerData.playerId,
          playerName: username
        });
        
        // Clean up mappings
        this.usernameToPlayer.delete(username);
        this.socketToPlayer.delete(playerData.socketId);
        this.cleanupPlayerData(playerData.playerId);
      }
    }

    // Remove players from tables using proper game logic
    for (const { tableId, playerId, playerName } of playersToRemove) {
      const removeResult = this.gameService.removePlayer(tableId, playerId);
      
      if (removeResult.success) {
        if (removeResult.gameOver && removeResult.winner) {
          // Game ended due to force disconnect
          this.io.to(`table_${tableId}`).emit('playerRemoved', {
            playerId,
            playerName,
            reason: 'force_disconnect'
          });
          
          await this.handleGameCompletion(
            tableId,
            removeResult.winner,
            `${playerName} was disconnected`
          );
        } else {
          // Normal removal
          this.io.to(`table_${tableId}`).emit('playerRemoved', {
            playerId,
            playerName,
            reason: 'force_disconnect'
          });
          
          const table = this.gameService.getTable(tableId);
          if (table) {
            this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
          }
        }
      }
    }

    // Disconnect all found sockets
    const uniqueSockets = [...new Set(socketsToDisconnect)];
    uniqueSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    });

  }

  /**
   * Handle player disconnect - Automatic fold and leave game
   */
  private handleDisconnect(socket: Socket): void {
    
    // Get player info from socket mapping
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      // Clean up any username mapping with this socket
      for (const [username, data] of this.usernameToPlayer.entries()) {
        if (data.socketId === socket.id) {
          this.usernameToPlayer.delete(username);
        }
      }
      return;
    }

    const { playerId, tableId } = playerInfo;
    
    console.log(`❌ Player ${playerId} disconnected. Removing from game immediately...`);
    
    // Remove player from game immediately (fold and remove)
    // No grace period - clean disconnect behavior
    this.handleRemovePlayer(socket, {
      tableId,
      playerId,
      reason: 'disconnect'
    });
  }

  /**
   * Bot Management Socket Events
   */

  /**
   * Emit bot assigned event to all clients at the table
   */
  public emitBotAssigned(tableId: number, seatIndex: number, botData: any): void {
    this.io.to(`table-${tableId}`).emit('bot:assigned', {
      tableId,
      seatIndex,
      bot: {
        bot_instance_id: botData.bot_instance_id,
        display_name: botData.display_name,
        bot_id: botData.bot_id,
        avatar_url: botData.avatar_url,
        balance_coins: botData.balance_coins,
        balance_cash: botData.balance_cash,
        is_active: botData.is_active
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit bot removed event to all clients at the table
   */
  public emitBotRemoved(tableId: number, seatIndex: number, botId: string): void {
    this.io.to(`table-${tableId}`).emit('bot:removed', {
      tableId,
      seatIndex,
      botId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Handle autonomous bot's turn if current player is a bot
   */
  private handleBotTurnIfNeeded(table: Table, tableId: number): void {
    const currentPlayer = table.getPlayers().find(p => p.turn);
    if (!currentPlayer || !autonomousBotService.isAutonomousBot(currentPlayer)) {
      return; // Not a bot's turn
    }

    // Handle bot turn with AI controller
    botAIController.handleBotTurn(currentPlayer, table, (playerId, action) => {
      // Execute bot action
      if (action.type === 'seeCards') {
        // Bot sees cards
        const seeResult = this.gameService.handleSeeCards(tableId, playerId);
        if (seeResult.success) {
          this.io.to(`table_${tableId}`).emit('playerSawCards', { playerId });
          this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
        }
      } else if (action.type === 'bet') {
        // Bot makes a bet
        const betResult = this.gameService.handleBet(tableId, playerId, action.amount, action.isBlind);
        if (betResult.success) {
          this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
          this.io.to(`table_${tableId}`).emit('playerBet', {
            playerId,
            amount: action.amount,
            isBlind: action.isBlind,
          });

          // Continue to next turn (might be another bot)
          const nextPlayer = table.getPlayers().find(p => p.turn);
          if (nextPlayer) {
            this.handleBotTurnIfNeeded(table, tableId);
          }
        }
      } else if (action.type === 'fold') {
        // Bot folds
        const foldResult = this.gameService.handleFold(tableId, playerId);
        if (foldResult.success) {
          const player = table.getPlayer(playerId);
          const playerName = player?.playerInfo.userName || 'Bot';
          
          this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
          this.io.to(`table_${tableId}`).emit('playerFolded', { 
            playerId,
            playerName
          });

          if (foldResult.gameOver && foldResult.winner) {
            this.handleGameCompletion(tableId, foldResult.winner, 'Last player standing');
          } else {
            // Continue to next turn
            const nextPlayer = table.getPlayers().find(p => p.turn);
            if (nextPlayer) {
              this.handleBotTurnIfNeeded(table, tableId);
            }
          }
        }
      }
    });
  }

  /**
   * Emit bot action event (bet, fold, call, etc.)
   */
  public emitBotAction(tableId: number, action: string, botData: any, actionDetails: any): void {
    this.io.to(`table-${tableId}`).emit('bot:action', {
      tableId,
      action,
      bot: {
        bot_instance_id: botData.bot_instance_id,
        display_name: botData.display_name,
        bot_id: botData.bot_id
      },
      details: actionDetails,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit bot identity rotated event
   */
  public emitBotIdentityRotated(tableId: number, seatIndex: number, oldIdentity: any, newIdentity: any): void {
    this.io.to(`table-${tableId}`).emit('bot:identity_rotated', {
      tableId,
      seatIndex,
      oldIdentity: {
        display_name: oldIdentity.display_name,
        bot_id: oldIdentity.bot_id
      },
      newIdentity: {
        display_name: newIdentity.display_name,
        bot_id: newIdentity.bot_id
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit bot status update (balance change, active status, etc.)
   */
  public emitBotStatusUpdate(tableId: number, botData: any): void {
    this.io.to(`table-${tableId}`).emit('bot:status_update', {
      tableId,
      bot: {
        bot_instance_id: botData.bot_instance_id,
        display_name: botData.display_name,
        bot_id: botData.bot_id,
        balance_coins: botData.balance_coins,
        balance_cash: botData.balance_cash,
        is_active: botData.is_active
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Public method to add a bot to a table programmatically
   * Used by BotSocketManager
   */
  async addBotToTable(botSocket: any, tableId: number, playerInfo: any): Promise<boolean> {
    try {
      // Check if table exists and has at least one human player
      const table = this.gameService.getTable(tableId);
      
      if (table) {
        const players = table.getPlayers();
        const humanPlayers = players.filter((p: Player) => !p.playerInfo.isBot);
        
        if (humanPlayers.length === 0) {
          console.warn(`⚠️ Cannot add bot to empty table ${tableId}. No human players present.`);
          return false;
        }
      }

      // Call the private handleJoinTable method
      await this.handleJoinTable(botSocket, {
        tableId,
        playerInfo,
        gameMode: tableId >= 20000 ? 'cash' : 'coins'
      });

      return true;
    } catch (error) {
      console.error(`❌ Failed to add bot to table:`, error);
      return false;
    }
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  getGameService(): GameService {
    return this.gameService;
  }
}


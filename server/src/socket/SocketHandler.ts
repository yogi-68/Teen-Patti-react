import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameService } from '../services/GameService.js';
import { GameState, GameMode, Table } from '../models/Table.js';
import { userRepository } from '../repositories/UserRepository.js';
import type { Player } from '../models/Player.js';

/**
 * Socket.IO event handlers for game logic
 */
export class SocketHandler {
  private io: SocketIOServer;
  private gameService: GameService;
  private turnTimers: Map<string, NodeJS.Timeout> = new Map();
  private turnCountdowns: Map<string, NodeJS.Timeout> = new Map();
  private playerCurrentBets: Map<string, number> = new Map();
  private socketToPlayer: Map<string, { playerId: string; tableId: number }> = new Map();
  private usernameToPlayer: Map<string, { playerId: string; tableId: number; socketId: string }> = new Map();
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
    });

    this.gameService = new GameService();
    this.setupEventHandlers();
    
    // Create initial table for practice mode
    this.gameService.createTable(1, 1, GameMode.PRACTICE);
    console.log('🎮 Initial table created (ID: 1, Boot: 1) - Practice Mode');
    
    // Note: Additional tables will be created automatically when needed
    console.log('✨ Dynamic table creation enabled - unlimited tables available!');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('✅ Client connected:', socket.id);

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
            
            console.log(`💾 Updated practice coins for ${player.playerInfo.userName}: ${currentBalance}`);
            
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
            
            console.log(`💾 Updated real coins for ${player.playerInfo.userName}: ${currentBalance}`);
            
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

  private async handleJoinTable(socket: Socket, data: { tableId?: number; playerInfo: any; gameMode?: string }): Promise<void> {
    const username = data.playerInfo.userName;
    
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
    
    console.log(`🎮 Join request - Username: ${username}, TableId: ${data.tableId}, GameMode: ${gameMode}`);
    
    // Check if this username already has an active session
    const existingSession = this.usernameToPlayer.get(username);
    if (existingSession) {
      const existingSocket = this.io.sockets.sockets.get(existingSession.socketId);
      
      // If it's the same socket ID, allow rejoining (this handles retry attempts)
      if (existingSession.socketId === socket.id) {
        console.log(`🔄 User "${username}" retrying join from same socket`);
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
        console.log(`⚠️ User "${username}" already connected from another session`);
        socket.emit('joinedTable', { 
          success: false, 
          message: 'You are already connected from another window. Please close other tabs or refresh this page.' 
        });
        return;
      } else {
        // Old session is disconnected, clean it up
        console.log(`🧹 Cleaning up old session for user "${username}"`);
        
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
        console.log(`🆕 Creating new table ${actualTableId} for ${gameMode} mode`);
        table = this.gameService.createTable(actualTableId, bootAmount, gameMode);
      } else {
        // Table exists - verify game mode matches
        if (table.config.gameMode !== gameMode) {
          console.log(`❌ Game mode mismatch! Table ${actualTableId} is ${table.config.gameMode}, player wants ${gameMode}`);
          socket.emit('joinedTable', { 
            success: false, 
            message: `This table is for ${table.config.gameMode} mode players only. Please select the correct game mode.` 
          });
          return;
        }
        
        // Check if table is full
        if (table.getPlayers().length >= table.config.maxPlayers) {
          console.log(`⚠️ Table ${actualTableId} is full, finding alternative...`);
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
    
    console.log(`✅ Assigning player ${username} to table ${actualTableId} (${gameMode} mode)`);
    
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      // Check if game is in progress
      if (table) {
        const player = table.getPlayer(playerId);
        
        // If game is in progress (not waiting), mark player as waiting for next round
        if (table.gameState !== 'waiting' && player) {
          player.waitingForNextRound = true;
          socket.emit('notification', {
            message: 'Game in progress. You will join the next round.',
            type: 'info',
            duration: 5000
          });
          console.log(`⏳ Player ${username} (${playerId}) will join next round`);
        }
        
        // Broadcast table state to all players
        this.io.to(`table_${actualTableId}`).emit('tableUpdate', table.getTableState());
      }

      console.log(`👤 Player ${username} (${playerId}) joined table ${actualTableId} (${gameMode} mode)`);
      
      // Auto-start game if 2+ players and game not started
      if (table) {
        const activePlayerCount = table.getActivePlayers().length;
        const totalPlayerCount = table.getPlayers().length;
        
        if (activePlayerCount >= 2 && table.gameState === 'waiting') {
          console.log(`🎮 Auto-starting game with ${activePlayerCount} players...`);
          setTimeout(() => {
            this.handleStartGame(socket, { tableId: actualTableId });
          }, 1000);
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

    // Emit countdown to all players
    const countdown = 7;
    this.io.to(`table_${data.tableId}`).emit('gameCountdown', { countdown });
    console.log(`⏳ Game starting in ${countdown} seconds...`);

    // Start game after countdown
    setTimeout(() => {
      const result = this.gameService.startGame(data.tableId);
      
      if (result.success && table) {
        console.log(`🎮 Game started at table ${data.tableId}`);
        
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
          console.log(`⏰ Starting timer for first player: ${firstPlayer.playerInfo.userName}`);
          this.startTurnTimer(data.tableId, firstPlayer.id, socket);
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
        
        console.log(`👁️ Player ${playerName} saw their cards`);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  }

  private async handleBet(socket: Socket, data: { tableId: number; playerId: string; amount: number }): Promise<void> {
    this.clearTurnTimer(data.playerId);
    
    const table = this.gameService.getTable(data.tableId);
    if (!table) return;

    const player = table.getPlayer(data.playerId);
    if (!player) return;

    // Check if player has sufficient balance BEFORE betting
    if (player.playerInfo.chips < data.amount) {
      console.log(`⚠️ Player ${player.playerInfo.userName} has insufficient balance (${player.playerInfo.chips} < ${data.amount})`);
      
      // Auto-fold the player
      const foldResult = this.gameService.handleFold(data.tableId, data.playerId);
      
      if (foldResult.success) {
        // Clear timers
        this.cleanupPlayerData(data.playerId);
        
        // Notify the player
        socket.emit('error', { 
          message: 'Insufficient balance. You have been auto-folded.',
          type: 'INSUFFICIENT_BALANCE'
        });
        
        // Broadcast fold to all players
        this.io.to(`table_${data.tableId}`).emit('playerFolded', {
          playerId: data.playerId,
          playerName: player.playerInfo.userName,
          reason: 'insufficient_balance'
        });
        
        // Check if game is over
        if (foldResult.gameOver && foldResult.winner) {
          await this.handleGameCompletion(
            data.tableId,
            foldResult.winner,
            `${player.playerInfo.userName} ran out of chips`
          );
        } else {
          // Game continues, send updated state
          this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
          
          // Start timer for next player
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

      // Check if pot limit exceeded (auto-show)
      if (result.potLimitExceeded) {
        console.log('🎯 Pot limit exceeded! Triggering automatic show...');
        this.io.to(`table_${data.tableId}`).emit('potLimitExceeded', {
          pot: table.pot,
          potLimit: table.config.potLimit,
        });
        
        // Trigger automatic show
        setTimeout(() => {
          this.handleShow(socket, { tableId: data.tableId, playerId: data.playerId });
        }, 2000); // 2 second delay for notification
      } else {
        // Start timer for next player
        const nextPlayer = table.getPlayers().find(p => p.turn);
        if (nextPlayer) {
          this.startTurnTimer(data.tableId, nextPlayer.id, socket);
        }
      }

      console.log(`💰 Player ${data.playerId} bet ${data.amount} (${isBlind ? 'blind' : 'chaal'})`);
    }
  }

  private async handleFold(socket: Socket, data: { tableId: number; playerId: string }): Promise<void> {
    this.clearTurnTimer(data.playerId);
    
    const table = this.gameService.getTable(data.tableId);
    const player = table?.getPlayer(data.playerId);
    const playerName = player?.playerInfo.userName || 'Player';
    
    const result = this.gameService.handleFold(data.tableId, data.playerId);

    if (result.success) {
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
            this.startTurnTimer(data.tableId, nextPlayer.id, socket);
          }
        }

        console.log(`🃏 Player ${data.playerId} folded`);
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

        console.log(`👁️ Side show: ${data.playerId} vs ${result.targetPlayerId} (previous player)`);
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

  private startTurnTimer(tableId: number, playerId: string, socket: Socket): void {
    this.clearTurnTimer(playerId);
    
    let timeLeft = 20;
    
    console.log(`⏰ Starting 20s timer for player: ${playerId}`);
    
    // Emit initial timer
    this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
    
    // Countdown interval
    const countdown = setInterval(() => {
      timeLeft--;
      if (timeLeft >= 0) {
        this.io.to(`table_${tableId}`).emit('turnTimer', { playerId, timeLeft });
        
        // Request current bet at 2 seconds
        if (timeLeft === 2) {
          socket.emit('requestCurrentBet', { playerId });
        }
      }
    }, 1000);
    
    this.turnCountdowns.set(playerId, countdown);
    
    // Timeout action
    const timer = setTimeout(() => {
      console.log(`⏰ Turn timeout for player: ${playerId}`);
      
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
      
      const table = this.gameService.getTable(tableId);
      if (!table) {
        console.log(`⚠️ Table ${tableId} not found for auto-bet`);
        return;
      }
      
      const player = table.getPlayer(playerId);
      if (!player) {
        console.log(`⚠️ Player ${playerId} not found for auto-bet`);
        return;
      }
      
      if (!player.turn) {
        console.log(`⚠️ Not player's turn anymore, skipping auto-bet for ${playerId}`);
        return;
      }
      
      // Double-check timer hasn't been cleared
      if (!this.turnTimers.has(playerId)) {
        console.log(`⚠️ Timer was cleared, skipping auto-bet for ${playerId}`);
        return;
      }
      
      // Auto-bet the minimum amount
      const currentBet = this.playerCurrentBets.get(playerId) || 0;
      const minBet = this.gameService.getMinimumBet(tableId, playerId);
      const betAmount = Math.max(currentBet, minBet);
      
      console.log(`🤖 Auto-betting ${betAmount} for player ${playerId}`);
      this.handleBet(socket, { tableId, playerId, amount: betAmount });
    }, this.TURN_TIMEOUT);
    
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
      console.log(`🧹 Cleared turn timer for player: ${playerId}`);
    }
    
    const countdown = this.turnCountdowns.get(playerId);
    if (countdown) {
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
      console.log(`🧹 Cleared countdown for player: ${playerId}`);
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

    // Emit game over to all players
    this.io.to(`table_${tableId}`).emit('gameOver', {
      winner: winner.getPublicData(false),
      results: results ? Object.fromEntries(results) : undefined,
      reason: reason,
    });

    console.log(`🏆 Game over! Winner: ${winner.playerInfo.userName} (Reason: ${reason})`);
    
    // Update ALL players' coins in database
    await this.updateAllPlayersBalances(table, table.config.gameMode);
    
    // Set game state to finished
    table.gameState = GameState.FINISHED;
    
    // Send updated table state to show game is finished
    this.io.to(`table_${tableId}`).emit('tableUpdate', table.getTableState());
    
    // Notify players about auto-restart
    this.io.to(`table_${tableId}`).emit('notification', {
      message: `Next game starting in 6 seconds...`,
      type: 'info'
    });
    
    console.log(`🎮 Game completed at table ${tableId}. Restarting in 6 seconds...`);
    
    // Auto-restart game after 6 seconds
    setTimeout(() => {
      const currentTable = this.gameService.getTable(tableId);
      if (!currentTable) {
        console.log(`⚠️ Table ${tableId} no longer exists`);
        return;
      }

      const remainingPlayers = currentTable.getPlayers();
      
      if (remainingPlayers.length >= 2) {
        console.log(`🔄 Auto-restarting game at table ${tableId} with ${remainingPlayers.length} players`);
        
        // Get any player's socket to trigger start
        const anyPlayer = remainingPlayers[0];
        const anySocket = this.io.sockets.sockets.get(anyPlayer.socketId);
        
        if (anySocket) {
          this.handleStartGame(anySocket, { tableId });
        } else {
          console.log(`⚠️ No valid socket found, resetting to waiting state`);
          currentTable.gameState = GameState.WAITING;
          this.io.to(`table_${tableId}`).emit('tableUpdate', currentTable.getTableState());
        }
      } else {
        console.log(`⚠️ Not enough players to restart game (${remainingPlayers.length}/2)`);
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
    console.log(`🗑️ Removing player ${playerId} from table ${tableId} (reason: ${reason})`);
    
    const table = this.gameService.getTable(tableId);
    if (!table) {
      console.log('⚠️ Table not found:', tableId);
      return;
    }

    const player = table.getPlayer(playerId);
    if (!player) {
      console.log('⚠️ Player not found in table:', playerId);
      return;
    }

    const playerName = player.playerInfo.userName;
    const playerSocket = this.io.sockets.sockets.get(player.socketId);

    // Use GameService to handle removal with proper game logic
    const result = this.gameService.removePlayer(tableId, playerId);
    
    if (!result.success) {
      console.error(`❌ Failed to remove player: ${result.message}`);
      return;
    }

    console.log(`✅ Player ${playerName} removed from table ${tableId}`);

    // Clear all timers and data for this player
    this.cleanupPlayerData(playerId);

    // Clean up socket mappings
    if (player.socketId) {
      this.socketToPlayer.delete(player.socketId);
    }
    this.socketToPlayer.delete(socket.id);

    // Clean up username mapping
    this.usernameToPlayer.delete(playerName);
    console.log(`🧹 Cleaned up all session data for "${playerName}"`);

    // If game ended as result of removal
    if (result.gameOver && result.winner) {
      console.log(`🏆 Game ended due to ${playerName} leaving - only one player remains`);
      
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

    // Confirm removal to the player who left
    if (playerSocket) {
      playerSocket.emit('removedFromTable', {
        success: true,
        message: `You have left the table. You can rejoin as a new player.`
      });
    }
  }

  /**
   * Handle player leaving table voluntarily (used by leaveTable event)
   */
  private handleLeaveTable(socket: Socket, data: { tableId: number; playerId: string }): void {
    console.log(`🚪 Player ${data.playerId} leaving table ${data.tableId}`);
    
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
    console.log(`🔄 Force disconnecting user: ${userId}`);

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
        console.log(`🔌 Disconnected socket: ${socketId}`);
      }
    });

    console.log(`✅ Force disconnected ${uniqueSockets.length} socket(s) for user: ${userId}`);
  }

  /**
   * Handle player disconnect - Automatic fold and leave game
   */
  private handleDisconnect(socket: Socket): void {
    console.log('❌ Client disconnected:', socket.id);
    
    // Get player info from socket mapping
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      console.log('No player info found for socket:', socket.id);
      // Clean up any username mapping with this socket
      for (const [username, data] of this.usernameToPlayer.entries()) {
        if (data.socketId === socket.id) {
          this.usernameToPlayer.delete(username);
          console.log(`🧹 Cleaned up username mapping for socket: ${socket.id}`);
        }
      }
      return;
    }

    const { playerId, tableId } = playerInfo;
    
    // Use the comprehensive removePlayer handler
    console.log(`� Player ${playerId} disconnected, triggering complete removal...`);
    this.handleRemovePlayer(socket, {
      tableId,
      playerId,
      reason: 'disconnect'
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

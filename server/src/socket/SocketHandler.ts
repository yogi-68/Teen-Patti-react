import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameService } from '../services/GameService.js';
import { GameState } from '../models/Table.js';

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
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.gameService = new GameService();
    this.setupEventHandlers();
    
    // Create initial tables
    this.gameService.createTable(1, 1); // Table 1 for Coins Mode (Free Play)
    console.log('🎮 Game table created (ID: 1, Boot: 1) - Coins Mode');
    
    this.gameService.createTable(2, 1); // Table 2 for Cash Mode (Real Money)
    console.log('🎮 Game table created (ID: 2, Boot: 1) - Cash Mode');
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

      // Disconnect - Player leaves game
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinTable(socket: Socket, data: { tableId: number; playerInfo: any }): void {
    const username = data.playerInfo.userName;
    
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
          playerId: existingSession.playerId 
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
        
        // Remove player from old table
        const oldTable = this.gameService.getTable(existingSession.tableId);
        if (oldTable) {
          oldTable.removePlayer(existingSession.playerId);
        }
        
        this.usernameToPlayer.delete(username);
        if (existingSession.socketId) {
          this.socketToPlayer.delete(existingSession.socketId);
        }
      }
    }
    
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = this.gameService.joinTable(
      data.tableId,
      playerId,
      data.playerInfo,
      socket.id
    );

    if (result.success) {
      socket.join(`table_${data.tableId}`);
      
      // Store socket to player mapping for disconnect handling
      this.socketToPlayer.set(socket.id, { playerId, tableId: data.tableId });
      
      // Store username to player mapping to prevent duplicate sessions
      this.usernameToPlayer.set(username, { 
        playerId, 
        tableId: data.tableId, 
        socketId: socket.id 
      });
      
      socket.emit('joinedTable', { success: true, playerId });
      
      // Check if game is in progress
      const table = this.gameService.getTable(data.tableId);
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
        this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
      }

      console.log(`👤 Player ${username} (${playerId}) joined table ${data.tableId}`);
      
      // Auto-start game if 2+ players and game not started
      if (table) {
        const activePlayerCount = table.getActivePlayers().length;
        const totalPlayerCount = table.getPlayers().length;
        
        if (activePlayerCount >= 2 && table.gameState === 'waiting') {
          console.log(`🎮 Auto-starting game with ${activePlayerCount} players...`);
          setTimeout(() => {
            this.handleStartGame(socket, { tableId: data.tableId });
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
        // Send full table state to the player who saw cards (with their cards visible)
        socket.emit('tableUpdate', table.getTableState(data.playerId));
        
        // Notify others that player saw cards (without showing their cards)
        socket.to(`table_${data.tableId}`).emit('playerSawCards', { playerId: data.playerId });
        socket.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
        
        console.log(`👁️ Player ${data.playerId} saw their cards`);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  }

  private handleBet(socket: Socket, data: { tableId: number; playerId: string; amount: number }): void {
    this.clearTurnTimer(data.playerId);
    
    const table = this.gameService.getTable(data.tableId);
    if (!table) return;

    const player = table.getPlayer(data.playerId);
    if (!player) return;

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

  private handleFold(socket: Socket, data: { tableId: number; playerId: string }): void {
    this.clearTurnTimer(data.playerId);
    
    const result = this.gameService.handleFold(data.tableId, data.playerId);

    if (result.success) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
        this.io.to(`table_${data.tableId}`).emit('playerFolded', { playerId: data.playerId });

        if (result.gameOver && result.winner) {
          this.io.to(`table_${data.tableId}`).emit('gameOver', {
            winner: result.winner.getPublicData(false),
            reason: 'All other players folded',
          });
          
          // Auto-restart game after 6 seconds (like original)
          console.log('🎮 Game over, restarting in 6 seconds...');
          setTimeout(() => {
            if (table && table.getPlayers().length >= 2) {
              this.handleStartGame(socket, { tableId: data.tableId });
            } else {
              console.log('⚠️ Not enough players to restart game');
              table.gameState = GameState.WAITING;
            }
          }, 6000);
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

  private handleShow(socket: Socket, data: { tableId: number; playerId: string }): void {
    this.clearTurnTimer(data.playerId);
    
    const result = this.gameService.handleShow(data.tableId, data.playerId);

    if (result.success && result.winner) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        this.io.to(`table_${data.tableId}`).emit('gameOver', {
          winner: result.winner.getPublicData(false),
          results: Object.fromEntries(result.results || []),
          reason: 'Show',
        });

        console.log(`🏆 Game over! Winner: ${result.winner.id}`);
        
        // Auto-restart game after 6 seconds (like original)
        console.log('🎮 Game over, restarting in 6 seconds...');
        setTimeout(() => {
          if (table && table.getPlayers().length >= 2) {
            this.handleStartGame(socket, { tableId: data.tableId });
          } else {
            console.log('⚠️ Not enough players to restart game');
            table.gameState = GameState.WAITING;
          }
        }, 6000);
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
    const table = this.gameService.getTable(tableId);
    
    if (!table) {
      console.log('Table not found:', tableId);
      this.socketToPlayer.delete(socket.id);
      // Clean up username mapping
      for (const [username, data] of this.usernameToPlayer.entries()) {
        if (data.socketId === socket.id || data.playerId === playerId) {
          this.usernameToPlayer.delete(username);
          console.log(`🧹 Cleaned up username mapping for: ${username}`);
        }
      }
      return;
    }

    const player = table.getPlayers().find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found in table:', playerId);
      this.socketToPlayer.delete(socket.id);
      // Clean up username mapping
      for (const [username, data] of this.usernameToPlayer.entries()) {
        if (data.socketId === socket.id || data.playerId === playerId) {
          this.usernameToPlayer.delete(username);
          console.log(`🧹 Cleaned up username mapping for playerId: ${playerId}`);
        }
      }
      return;
    }

    console.log(`🚪 Player ${player.playerInfo.userName} (${playerId}) disconnected from table ${tableId}`);

    // If game is in progress, fold the player
    if (table.gameState === 'betting') {
      console.log(`♠️ Auto-folding disconnected player: ${player.playerInfo.userName}`);
      
      // Fold the player
      const foldResult = this.gameService.handleFold(tableId, playerId);
      
      if (foldResult.success) {
        // Clear any active timers for this player
        this.cleanupPlayerData(playerId);
        
        // Broadcast fold to all players
        this.io.to(`table_${tableId}`).emit('playerFolded', { 
          playerId,
          playerName: player.playerInfo.userName,
          reason: 'disconnected'
        });

        // Check if game is over (only one player left)
        if (foldResult.gameOver && foldResult.winner) {
          this.io.to(`table_${tableId}`).emit('gameOver', {
            winner: foldResult.winner.getPublicData(false),
            reason: 'All other players folded/disconnected',
          });
          
          console.log(`🏆 Game over! Winner: ${foldResult.winner.playerInfo.userName} (last player remaining)`);
          
          // Auto-restart game after 6 seconds if enough players
          setTimeout(() => {
            const currentTable = this.gameService.getTable(tableId);
            if (currentTable && currentTable.getPlayers().length >= 2) {
              this.handleStartGame(socket, { tableId });
            } else if (currentTable) {
              console.log('⚠️ Not enough players to restart game');
              currentTable.gameState = GameState.WAITING;
            }
          }, 6000);
        } else {
          // Send updated table state for normal fold
          const updatedTable = this.gameService.getTable(tableId);
          if (updatedTable) {
            this.io.to(`table_${tableId}`).emit('tableUpdate', updatedTable.getTableState());
          }
        }
      }
    }

    // Remove player from table
    const wasRemoved = table.removePlayer(playerId);
    if (wasRemoved) {
      console.log(`✅ Removed player ${playerId} from table ${tableId}`);
    }

    // Notify other players about disconnection
    this.io.to(`table_${tableId}`).emit('playerLeft', {
      playerId,
      playerName: player.playerInfo.userName,
      reason: 'disconnected'
    });

    // Update table state for remaining players
    const finalTable = this.gameService.getTable(tableId);
    if (finalTable) {
      this.io.to(`table_${tableId}`).emit('tableUpdate', finalTable.getTableState());
      
      // If no players left, reset the table
      if (finalTable.getPlayers().length === 0) {
        console.log(`📊 No players remaining at table ${tableId}, resetting game state`);
        finalTable.gameState = GameState.WAITING;
        finalTable.pot = 0;
        finalTable.roundCount = 0;
      }
    }

    // Clean up socket mapping
    this.socketToPlayer.delete(socket.id);
    
    // Clean up username mapping
    const username = player.playerInfo.userName;
    this.usernameToPlayer.delete(username);
    console.log(`🧹 Cleaned up session for user "${username}"`);
    
    // Clean up any remaining timers and bets
    this.cleanupPlayerData(playerId);
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

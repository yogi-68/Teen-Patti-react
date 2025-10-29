import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameService } from '../services/GameService.js';

/**
 * Socket.IO event handlers for game logic
 */
export class SocketHandler {
  private io: SocketIOServer;
  private gameService: GameService;
  private turnTimers: Map<string, NodeJS.Timeout> = new Map();
  private turnCountdowns: Map<string, NodeJS.Timeout> = new Map();
  private playerCurrentBets: Map<string, number> = new Map();
  private readonly TURN_TIMEOUT = 20000; // 20 seconds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    this.gameService = new GameService();
    this.setupEventHandlers();
    
    // Create initial table
    this.gameService.createTable(1, 2);
    console.log('🎮 Game table created (ID: 1, Boot: 2)');
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

      // Disconnect
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
  }

  private handleJoinTable(socket: Socket, data: { tableId: number; playerInfo: any }): void {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = this.gameService.joinTable(
      data.tableId,
      playerId,
      data.playerInfo,
      socket.id
    );

    if (result.success) {
      socket.join(`table_${data.tableId}`);
      socket.emit('joinedTable', { success: true, playerId });
      
      // Broadcast table state to all players
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        this.io.to(`table_${data.tableId}`).emit('tableUpdate', table.getTableState());
      }

      console.log(`👤 Player ${playerId} joined table ${data.tableId}`);
    } else {
      socket.emit('joinedTable', { success: false, message: result.message });
    }
  }

  private handleStartGame(socket: Socket, data: { tableId: number }): void {
    const result = this.gameService.startGame(data.tableId);
    
    if (result.success) {
      const table = this.gameService.getTable(data.tableId);
      if (table) {
        // Send personalized state to each player (showing their own cards)
        table.getPlayers().forEach((player) => {
          const playerSocket = this.io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('gameStarted', table.getTableState(player.id));
          }
        });

        // Start timer for first player
        const firstPlayer = table.getPlayers().find(p => p.turn);
        if (firstPlayer) {
          this.startTurnTimer(data.tableId, firstPlayer.id, socket);
        }

        console.log(`🎲 Game started on table ${data.tableId}`);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
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
      setTimeout(() => {
        console.log(`⏰ Turn timeout for player: ${playerId}`);
        
        clearInterval(countdown);
        this.turnCountdowns.delete(playerId);
        
        const table = this.gameService.getTable(tableId);
        if (!table) return;
        
        const player = table.getPlayer(playerId);
        if (!player || !player.turn) return;
        
        // Auto-bet the minimum amount
        const currentBet = this.playerCurrentBets.get(playerId) || 0;
        const minBet = this.gameService.getMinimumBet(tableId, playerId);
        const betAmount = Math.max(currentBet, minBet);
        
        this.handleBet(socket, { tableId, playerId, amount: betAmount });
        
        console.log(`🤖 Auto-bet ${betAmount} for player ${playerId}`);
      }, 500);
    }, this.TURN_TIMEOUT);
    
    this.turnTimers.set(playerId, timer);
  }

  private clearTurnTimer(playerId: string): void {
    const timer = this.turnTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(playerId);
    }
    
    const countdown = this.turnCountdowns.get(playerId);
    if (countdown) {
      clearInterval(countdown);
      this.turnCountdowns.delete(playerId);
    }
    
    this.playerCurrentBets.delete(playerId);
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

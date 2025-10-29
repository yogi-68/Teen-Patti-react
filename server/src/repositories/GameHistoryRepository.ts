import { GameHistory, IGameHistory } from '../models/GameHistory.model';

/**
 * Game History Repository - Type-safe database operations
 */
export class GameHistoryRepository {
  /**
   * Create a new game history record
   */
  async create(gameData: Partial<IGameHistory>): Promise<IGameHistory> {
    const game = new GameHistory(gameData);
    return await game.save();
  }

  /**
   * Find game by ID
   */
  async findById(id: string): Promise<IGameHistory | null> {
    return await GameHistory.findById(id).exec();
  }

  /**
   * Get user's game history
   */
  async getUserHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    games: IGameHistory[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const query = { 'players.userId': userId };
    
    const [games, total] = await Promise.all([
      GameHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      GameHistory.countDocuments(query),
    ]);
    
    return {
      games,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user's wins
   */
  async getUserWins(userId: string, limit: number = 10): Promise<IGameHistory[]> {
    return await GameHistory.find({ 'winner.userId': userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get recent games
   */
  async getRecentGames(limit: number = 10): Promise<IGameHistory[]> {
    return await GameHistory.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get game statistics for a user
   */
  async getUserGameStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    totalWinnings: number;
    averagePot: number;
    longestGame: number;
  }> {
    const games = await GameHistory.find({ 'players.userId': userId }).exec();
    const wins = games.filter(game => game.winner.userId === userId);
    
    const totalWinnings = wins.reduce((sum, game) => sum + game.winner.amount, 0);
    const averagePot = games.length > 0
      ? games.reduce((sum, game) => sum + game.pot, 0) / games.length
      : 0;
    const longestGame = games.length > 0
      ? Math.max(...games.map(game => game.duration))
      : 0;
    
    return {
      totalGames: games.length,
      totalWins: wins.length,
      totalWinnings,
      averagePot: Math.round(averagePot),
      longestGame,
    };
  }

  /**
   * Get table history
   */
  async getTableHistory(
    tableId: string,
    limit: number = 10
  ): Promise<IGameHistory[]> {
    return await GameHistory.find({ tableId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get head-to-head stats between two players
   */
  async getHeadToHead(userId1: string, userId2: string): Promise<{
    totalGames: number;
    user1Wins: number;
    user2Wins: number;
    games: IGameHistory[];
  }> {
    const games = await GameHistory.find({
      'players.userId': { $all: [userId1, userId2] },
    })
      .sort({ createdAt: -1 })
      .exec();
    
    const user1Wins = games.filter(game => game.winner.userId === userId1).length;
    const user2Wins = games.filter(game => game.winner.userId === userId2).length;
    
    return {
      totalGames: games.length,
      user1Wins,
      user2Wins,
      games: games.slice(0, 10), // Last 10 games
    };
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(date: Date): Promise<{
    totalGames: number;
    totalPot: number;
    uniquePlayers: Set<string>;
    averageGameDuration: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const games = await GameHistory.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
    
    const uniquePlayers = new Set<string>();
    let totalDuration = 0;
    let totalPot = 0;
    
    games.forEach(game => {
      game.players.forEach(player => uniquePlayers.add(player.userId));
      totalDuration += game.duration;
      totalPot += game.pot;
    });
    
    return {
      totalGames: games.length,
      totalPot,
      uniquePlayers,
      averageGameDuration: games.length > 0
        ? Math.round(totalDuration / games.length)
        : 0,
    };
  }

  /**
   * Delete old game history (cleanup)
   */
  async deleteOldGames(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await GameHistory.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    
    return result.deletedCount || 0;
  }
}

export const gameHistoryRepository = new GameHistoryRepository();

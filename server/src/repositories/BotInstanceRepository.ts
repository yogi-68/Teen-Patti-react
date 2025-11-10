import mongoose, { Schema, Document, Model } from 'mongoose';
import { 
  BotInstance, 
  CreateBotInstanceInput, 
  UpdateBotInstanceInput 
} from '../models/BotInstance';

// MongoDB Schema
interface BotInstanceDocument extends Document {
  bot_instance_id: string;
  bot_blueprint_id: string;
  display_name: string;
  bot_id: string;
  avatar_url?: string;
  session_id?: string;
  assigned_table_id?: number;
  assigned_seat_index?: number;
  balance_coins: number;
  balance_cash: number;
  created_at: Date;
  expires_at?: Date;
  randomized: boolean;
  created_by_admin_id?: string;
  is_active: boolean;
  last_action_at?: Date;
  
  // Analytics fields
  games_played: number;
  games_won: number;
  total_winnings: number;
  total_bet_amount: number;
  total_hands_folded: number;
  total_hands_shown: number;
  last_game_at?: Date;
}

const BotInstanceSchema = new Schema<BotInstanceDocument>({
  bot_instance_id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  bot_blueprint_id: { type: String, required: true, index: true },
  display_name: { type: String, required: true },
  bot_id: { type: String, required: true, unique: true, index: true },
  avatar_url: { type: String },
  session_id: { type: String, index: true },
  assigned_table_id: { type: Number, index: true },
  assigned_seat_index: { type: Number, min: 0, max: 5 },
  balance_coins: { type: Number, default: 10000 },
  balance_cash: { type: Number, default: 0 },
  expires_at: { type: Date },
  randomized: { type: Boolean, default: false },
  created_by_admin_id: { type: String },
  is_active: { type: Boolean, default: true, index: true },
  last_action_at: { type: Date },
  
  // Analytics fields
  games_played: { type: Number, default: 0 },
  games_won: { type: Number, default: 0 },
  total_winnings: { type: Number, default: 0 },
  total_bet_amount: { type: Number, default: 0 },
  total_hands_folded: { type: Number, default: 0 },
  total_hands_shown: { type: Number, default: 0 },
  last_game_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for expiry cleanup (TTL index)
BotInstanceSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
// Index for analytics queries
BotInstanceSchema.index({ games_played: -1, games_won: -1 });

const BotInstanceModel: Model<BotInstanceDocument> = mongoose.model<BotInstanceDocument>('BotInstance', BotInstanceSchema);

export class BotInstanceRepository {
  /**
   * Create a new bot instance
   */
  async create(input: CreateBotInstanceInput): Promise<BotInstance> {
    const instance = new BotInstanceModel({
      bot_instance_id: new mongoose.Types.ObjectId().toString(),
      bot_blueprint_id: input.bot_blueprint_id,
      display_name: input.display_name,
      bot_id: input.bot_id,
      avatar_url: input.avatar_url,
      session_id: input.session_id,
      assigned_table_id: input.assigned_table_id,
      assigned_seat_index: input.assigned_seat_index,
      balance_coins: input.balance_coins || 10000,
      balance_cash: input.balance_cash || 0,
      expires_at: input.expires_at,
      randomized: input.randomized || false,
      created_by_admin_id: input.created_by_admin_id,
      is_active: true
    });

    const saved = await instance.save();
    return this.mapToModel(saved);
  }

  /**
   * Get bot instance by ID
   */
  async findById(instanceId: string): Promise<BotInstance | null> {
    const instance = await BotInstanceModel.findOne({ bot_instance_id: instanceId });
    return instance ? this.mapToModel(instance) : null;
  }

  /**
   * Get bot instance by bot_id (unique identifier like "RS-8732")
   */
  async findByBotId(botId: string): Promise<BotInstance | null> {
    const instance = await BotInstanceModel.findOne({ bot_id: botId });
    return instance ? this.mapToModel(instance) : null;
  }

  /**
   * Get all active bot instances
   */
  async findAllActive(): Promise<BotInstance[]> {
    const instances = await BotInstanceModel.find({ is_active: true }).sort({ created_at: -1 });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Get bot instances by table ID
   */
  async findByTableId(tableId: number): Promise<BotInstance[]> {
    const instances = await BotInstanceModel.find({ 
      assigned_table_id: tableId,
      is_active: true 
    });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Get bot instance by table and seat
   */
  async findByTableAndSeat(tableId: number, seatIndex: number): Promise<BotInstance | null> {
    const instance = await BotInstanceModel.findOne({ 
      assigned_table_id: tableId,
      assigned_seat_index: seatIndex,
      is_active: true 
    });
    return instance ? this.mapToModel(instance) : null;
  }

  /**
   * Get bot instances by session
   */
  async findBySessionId(sessionId: string): Promise<BotInstance[]> {
    const instances = await BotInstanceModel.find({ 
      session_id: sessionId,
      is_active: true 
    });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Get bot instances by blueprint
   */
  async findByBlueprintId(blueprintId: string): Promise<BotInstance[]> {
    const instances = await BotInstanceModel.find({ 
      bot_blueprint_id: blueprintId,
      is_active: true 
    });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Update bot instance
   */
  async update(instanceId: string, input: UpdateBotInstanceInput): Promise<BotInstance | null> {
    const updateData: any = {};

    if (input.display_name !== undefined) updateData.display_name = input.display_name;
    if (input.bot_id !== undefined) updateData.bot_id = input.bot_id;
    if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;
    if (input.session_id !== undefined) updateData.session_id = input.session_id;
    if (input.assigned_table_id !== undefined) updateData.assigned_table_id = input.assigned_table_id;
    if (input.assigned_seat_index !== undefined) updateData.assigned_seat_index = input.assigned_seat_index;
    if (input.balance_coins !== undefined) updateData.balance_coins = input.balance_coins;
    if (input.balance_cash !== undefined) updateData.balance_cash = input.balance_cash;
    if (input.expires_at !== undefined) updateData.expires_at = input.expires_at;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.last_action_at !== undefined) updateData.last_action_at = input.last_action_at;

    if (Object.keys(updateData).length === 0) {
      return this.findById(instanceId);
    }

    const updated = await BotInstanceModel.findOneAndUpdate(
      { bot_instance_id: instanceId },
      { $set: updateData },
      { new: true }
    );

    return updated ? this.mapToModel(updated) : null;
  }

  /**
   * Update bot balance
   */
  async updateBalance(instanceId: string, balanceCoins: number, balanceCash: number): Promise<boolean> {
    const result = await BotInstanceModel.updateOne(
      { bot_instance_id: instanceId },
      { $set: { balance_coins: balanceCoins, balance_cash: balanceCash } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update last action timestamp
   */
  async updateLastAction(instanceId: string): Promise<boolean> {
    const result = await BotInstanceModel.updateOne(
      { bot_instance_id: instanceId },
      { $set: { last_action_at: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Deactivate bot instance (soft delete)
   */
  async deactivate(instanceId: string): Promise<boolean> {
    const result = await BotInstanceModel.findOneAndUpdate(
      { bot_instance_id: instanceId },
      { $set: { is_active: false } },
      { new: true }
    );
    return result !== null;
  }

  /**
   * Hard delete bot instance
   */
  async hardDelete(instanceId: string): Promise<boolean> {
    const result = await BotInstanceModel.deleteOne({ bot_instance_id: instanceId });
    return result.deletedCount > 0;
  }

  /**
   * Find expired bot instances
   */
  async findExpired(): Promise<BotInstance[]> {
    const now = new Date();
    const instances = await BotInstanceModel.find({
      expires_at: { $lte: now },
      is_active: true
    });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Cleanup expired bots
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const result = await BotInstanceModel.updateMany(
      {
        expires_at: { $lte: now },
        is_active: true
      },
      { $set: { is_active: false } }
    );
    return result.modifiedCount;
  }

  /**
   * Find bots that have been inactive since a given date
   */
  async findInactiveSince(cutoffDate: Date): Promise<BotInstance[]> {
    const instances = await BotInstanceModel.find({
      is_active: true,
      $or: [
        { last_action_at: { $lte: cutoffDate } },
        { last_action_at: { $exists: false }, created_at: { $lte: cutoffDate } }
      ]
    });
    return instances.map((inst: BotInstanceDocument) => this.mapToModel(inst));
  }

  /**
   * Check if display name exists in active bots
   */
  async displayNameExists(displayName: string): Promise<boolean> {
    const count = await BotInstanceModel.countDocuments({
      display_name: displayName,
      is_active: true
    });
    return count > 0;
  }

  /**
   * Check if bot_id exists
   */
  async botIdExists(botId: string): Promise<boolean> {
    const count = await BotInstanceModel.countDocuments({ bot_id: botId });
    return count > 0;
  }

  /**
   * Get count statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byTable: Map<number, number>;
  }> {
    const all = await BotInstanceModel.find();
    const active = all.filter(b => b.is_active);
    
    const byTable = new Map<number, number>();
    active.forEach(bot => {
      if (bot.assigned_table_id) {
        const count = byTable.get(bot.assigned_table_id) || 0;
        byTable.set(bot.assigned_table_id, count + 1);
      }
    });

    return {
      total: all.length,
      active: active.length,
      byTable
    };
  }

  /**
   * Update bot analytics after a game
   */
  async updateGameStats(
    instanceId: string,
    won: boolean,
    winnings: number,
    totalBet: number,
    folded: boolean,
    shown: boolean
  ): Promise<boolean> {
    const updateFields: any = {
      $inc: {
        games_played: 1,
        games_won: won ? 1 : 0,
        total_winnings: winnings,
        total_bet_amount: totalBet,
        total_hands_folded: folded ? 1 : 0,
        total_hands_shown: shown ? 1 : 0
      },
      $set: {
        last_game_at: new Date()
      }
    };

    const result = await BotInstanceModel.updateOne(
      { bot_instance_id: instanceId },
      updateFields
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get analytics for a specific bot
   */
  async getAnalytics(instanceId: string): Promise<any | null> {
    const bot = await BotInstanceModel.findOne({ bot_instance_id: instanceId });
    if (!bot) return null;

    const gamesPlayed = bot.games_played || 0;
    const gamesWon = bot.games_won || 0;
    const totalWinnings = bot.total_winnings || 0;
    const totalBetAmount = bot.total_bet_amount || 0;
    const totalFolded = bot.total_hands_folded || 0;
    const totalShown = bot.total_hands_shown || 0;

    return {
      bot_instance_id: bot.bot_instance_id,
      display_name: bot.display_name,
      bot_id: bot.bot_id,
      games_played: gamesPlayed,
      games_won: gamesWon,
      win_rate: gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0,
      total_winnings: totalWinnings,
      total_bet_amount: totalBetAmount,
      avg_bet_per_game: gamesPlayed > 0 ? totalBetAmount / gamesPlayed : 0,
      total_hands_folded: totalFolded,
      total_hands_shown: totalShown,
      fold_rate: gamesPlayed > 0 ? (totalFolded / gamesPlayed) * 100 : 0,
      show_rate: gamesPlayed > 0 ? (totalShown / gamesPlayed) * 100 : 0,
      roi: totalBetAmount > 0 ? (totalWinnings / totalBetAmount) * 100 : 0,
      last_game_at: bot.last_game_at
    };
  }

  /**
   * Get analytics for all bots
   */
  async getAllAnalytics(options?: {
    sortBy?: 'win_rate' | 'games_played' | 'total_winnings' | 'roi';
    limit?: number;
    onlyActive?: boolean;
  }): Promise<any[]> {
    const query: any = {};
    if (options?.onlyActive) {
      query.is_active = true;
    }

    const bots = await BotInstanceModel.find(query);
    
    const analytics = bots.map(bot => {
      const gamesPlayed = bot.games_played || 0;
      const gamesWon = bot.games_won || 0;
      const totalWinnings = bot.total_winnings || 0;
      const totalBetAmount = bot.total_bet_amount || 0;
      const totalFolded = bot.total_hands_folded || 0;
      const totalShown = bot.total_hands_shown || 0;

      return {
        bot_instance_id: bot.bot_instance_id,
        display_name: bot.display_name,
        bot_id: bot.bot_id,
        games_played: gamesPlayed,
        games_won: gamesWon,
        win_rate: gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0,
        total_winnings: totalWinnings,
        total_bet_amount: totalBetAmount,
        avg_bet_per_game: gamesPlayed > 0 ? totalBetAmount / gamesPlayed : 0,
        total_hands_folded: totalFolded,
        total_hands_shown: totalShown,
        fold_rate: gamesPlayed > 0 ? (totalFolded / gamesPlayed) * 100 : 0,
        show_rate: gamesPlayed > 0 ? (totalShown / gamesPlayed) * 100 : 0,
        roi: totalBetAmount > 0 ? (totalWinnings / totalBetAmount) * 100 : 0,
        last_game_at: bot.last_game_at
      };
    });

    // Sort
    if (options?.sortBy) {
      analytics.sort((a, b) => {
        const key = options.sortBy!;
        return (b[key] || 0) - (a[key] || 0);
      });
    }

    // Limit
    if (options?.limit) {
      return analytics.slice(0, options.limit);
    }

    return analytics;
  }

  /**
   * Get aggregate statistics by blueprint
   */
  async getStatsByBlueprint(blueprintId: string): Promise<any> {
    const bots = await BotInstanceModel.find({ bot_blueprint_id: blueprintId });
    
    let totalGamesPlayed = 0;
    let totalGamesWon = 0;
    let totalWinnings = 0;
    let totalBetAmount = 0;
    let botCount = bots.length;
    let activeBotCount = bots.filter(b => b.is_active).length;

    bots.forEach(bot => {
      totalGamesPlayed += bot.games_played || 0;
      totalGamesWon += bot.games_won || 0;
      totalWinnings += bot.total_winnings || 0;
      totalBetAmount += bot.total_bet_amount || 0;
    });

    return {
      blueprint_id: blueprintId,
      bot_count: botCount,
      active_bot_count: activeBotCount,
      total_games_played: totalGamesPlayed,
      total_games_won: totalGamesWon,
      overall_win_rate: totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed) * 100 : 0,
      total_winnings: totalWinnings,
      total_bet_amount: totalBetAmount,
      avg_winnings_per_bot: botCount > 0 ? totalWinnings / botCount : 0,
      overall_roi: totalBetAmount > 0 ? (totalWinnings / totalBetAmount) * 100 : 0
    };
  }

  /**
   * Map database document to model
   */
  private mapToModel(doc: BotInstanceDocument): BotInstance {
    return {
      bot_instance_id: doc.bot_instance_id,
      bot_blueprint_id: doc.bot_blueprint_id,
      display_name: doc.display_name,
      bot_id: doc.bot_id,
      avatar_url: doc.avatar_url,
      session_id: doc.session_id,
      assigned_table_id: doc.assigned_table_id,
      assigned_seat_index: doc.assigned_seat_index,
      balance_coins: doc.balance_coins,
      balance_cash: doc.balance_cash,
      created_at: new Date(doc.created_at),
      expires_at: doc.expires_at ? new Date(doc.expires_at) : undefined,
      randomized: doc.randomized,
      created_by_admin_id: doc.created_by_admin_id,
      is_active: doc.is_active,
      last_action_at: doc.last_action_at ? new Date(doc.last_action_at) : undefined,
      
      // Analytics fields
      games_played: doc.games_played || 0,
      games_won: doc.games_won || 0,
      total_winnings: doc.total_winnings || 0,
      total_bet_amount: doc.total_bet_amount || 0,
      total_hands_folded: doc.total_hands_folded || 0,
      total_hands_shown: doc.total_hands_shown || 0,
      last_game_at: doc.last_game_at ? new Date(doc.last_game_at) : undefined
    };
  }
}

export default new BotInstanceRepository();

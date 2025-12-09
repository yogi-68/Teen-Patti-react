import Tip, { ITip } from '../models/Tip.js';
import AdminEarnings from '../models/AdminEarnings.js';
import { userRepository } from '../repositories/UserRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface TipResult {
  success: boolean;
  message?: string;
  error?: string;
  tip?: ITip;
  newBalance?: number;
}

export interface TipStats {
  totalTips: number;
  totalAmount: number;
  tipsByAmount: Record<number, number>;
  recentTips: ITip[];
}

export class TipService {
  /**
   * Validate if player can send tip
   */
  async validateTip(
    userId: string,
    amount: number,
    gameMode: 'trial' | 'token'
  ): Promise<{ valid: boolean; reason?: string; balance?: number }> {
    // Tips only allowed in token mode
    if (gameMode !== 'token') {
      return { valid: false, reason: 'Tips are only available in Token mode' };
    }

    // Validate amount
    if (![10, 20, 50, 100].includes(amount)) {
      return { valid: false, reason: 'Invalid tip amount. Choose 10, 20, 50, or 100.' };
    }

    // Get user balance
    const user = await userRepository.findById(userId);
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    // Since we validated gameMode is 'token', use realToken balance
    const balance = user.realToken;

    // Check sufficient balance
    if (balance < amount) {
      return {
        valid: false,
        reason: `Insufficient balance. You have ${balance}, need ${amount}.`,
        balance,
      };
    }

    return { valid: true, balance };
  }

  /**
   * Process tip - deduct balance and create tip record
   */
  async processTip(
    tableId: number,
    playerId: string,
    playerName: string,
    amount: number,
    gameMode: 'trial' | 'token',
    roundNumber: number,
    cardQuality?: string
  ): Promise<TipResult> {
    try {
      // Validate tip
      const validation = await this.validateTip(playerId, amount, gameMode);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // Deduct balance from user
      const user = await userRepository.findById(playerId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Tips only work in token mode (validated earlier)
      await userRepository.updateRealToken(playerId, -amount);
      user.realToken -= amount;

      // Create tip record
      const tipId = uuidv4();
      const tip = await Tip.create({
        tipId,
        tableId,
        playerId,
        playerName,
        amount,
        gameMode,
        roundNumber,
        timestamp: new Date(),
        cardQuality: cardQuality || 'regular',
      });

      // Add tip amount to admin earnings
      await this.addToAdminEarnings(amount, 'tip');

      const newBalance = user.realToken;

      console.log(`💰 Tip processed: ${playerName} tipped ${amount} (${gameMode}) at table ${tableId} - Added to admin balance`);

      return {
        success: true,
        message: `Successfully tipped ${amount}!`,
        tip: tip as ITip,
        newBalance,
      };
    } catch (error) {
      console.error('❌ Error processing tip:', error);
      return { success: false, error: 'Failed to process tip' };
    }
  }

  /**
   * Add earnings to admin balance
   */
  private async addToAdminEarnings(
    amount: number,
    type: 'tip' | 'commission'
  ): Promise<void> {
    try {
      // Get or create admin earnings record
      let adminEarnings = await AdminEarnings.findOne();
      
      if (!adminEarnings) {
        adminEarnings = await AdminEarnings.create({
          totalTips: 0,
          totalCommission: 0,
          totalEarnings: 0,
          lastUpdated: new Date(),
        });
      }

      // Update earnings
      if (type === 'tip') {
        adminEarnings.totalTips += amount;
      } else {
        adminEarnings.totalCommission += amount;
      }
      
      adminEarnings.totalEarnings = adminEarnings.totalTips + adminEarnings.totalCommission;
      adminEarnings.lastUpdated = new Date();
      
      await adminEarnings.save();
      
      console.log(`📊 Admin earnings updated: +${amount} (${type}), Total: ${adminEarnings.totalEarnings}`);
    } catch (error) {
      console.error('❌ Error updating admin earnings:', error);
    }
  }

  /**
   * Get tip history for a player
   */
  async getPlayerTipHistory(
    userId: string,
    limit: number = 20
  ): Promise<ITip[]> {
    try {
      const tips = await Tip.find({ playerId: userId })
        .sort({ timestamp: -1 })
        .limit(limit);
      return tips;
    } catch (error) {
      console.error('❌ Error fetching tip history:', error);
      return [];
    }
  }

  /**
   * Get tip history for a table
   */
  async getTableTipHistory(
    tableId: number,
    roundNumber?: number
  ): Promise<ITip[]> {
    try {
      const query: any = { tableId };
      if (roundNumber !== undefined) {
        query.roundNumber = roundNumber;
      }

      const tips = await Tip.find(query).sort({ timestamp: -1 });
      return tips;
    } catch (error) {
      console.error('❌ Error fetching table tips:', error);
      return [];
    }
  }

  /**
   * Get tip statistics for a player
   */
  async getPlayerTipStats(userId: string): Promise<TipStats> {
    try {
      const tips = await Tip.find({ playerId: userId });

      const totalTips = tips.length;
      const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);

      const tipsByAmount: Record<number, number> = {
        10: 0,
        20: 0,
        50: 0,
        100: 0,
      };

      tips.forEach((tip) => {
        tipsByAmount[tip.amount] = (tipsByAmount[tip.amount] || 0) + 1;
      });

      const recentTips = tips
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      return {
        totalTips,
        totalAmount,
        tipsByAmount,
        recentTips,
      };
    } catch (error) {
      console.error('❌ Error fetching tip stats:', error);
      return {
        totalTips: 0,
        totalAmount: 0,
        tipsByAmount: { 10: 0, 20: 0, 50: 0, 100: 0 },
        recentTips: [],
      };
    }
  }

  /**
   * Detect card quality for optional tip suggestion
   */
  detectCardQuality(cards: any[]): string {
    if (!cards || cards.length !== 3) return 'regular';

    const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
    const types = cards.map((c) => c.type);

    // Trail (Three of a kind)
    if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
      return 'trail';
    }

    // Pure Sequence (consecutive same type)
    const allSameType = types.every((t) => t === types[0]);
    const isSequence =
      (ranks[2] - ranks[1] === 1 && ranks[1] - ranks[0] === 1) ||
      (ranks[0] === 1 && ranks[1] === 11 && ranks[2] === 12) || // A-Q-K
      (ranks[0] === 1 && ranks[1] === 12 && ranks[2] === 13); // A-K-Q

    if (allSameType && isSequence) {
      return 'pure_sequence';
    }

    // Color (same type)
    if (allSameType) {
      return 'color';
    }

    // Sequence (consecutive mixed types)
    if (isSequence) {
      return 'sequence';
    }

    // Pair
    if (ranks[0] === ranks[1] || ranks[1] === ranks[2]) {
      return 'pair';
    }

    return 'regular';
  }

  /**
   * Get admin earnings
   */
  async getAdminEarnings() {
    try {
      let adminEarnings = await AdminEarnings.findOne();
      
      if (!adminEarnings) {
        adminEarnings = await AdminEarnings.create({
          totalTips: 0,
          totalCommission: 0,
          totalEarnings: 0,
          lastUpdated: new Date(),
        });
      }

      return {
        totalTips: adminEarnings.totalTips,
        totalCommission: adminEarnings.totalCommission,
        totalEarnings: adminEarnings.totalEarnings,
        lastUpdated: adminEarnings.lastUpdated,
      };
    } catch (error) {
      console.error('❌ Error fetching admin earnings:', error);
      return {
        totalTips: 0,
        totalCommission: 0,
        totalEarnings: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get all tips (for admin panel)
   */
  async getAllTips(limit: number = 100): Promise<ITip[]> {
    try {
      const tips = await Tip.find()
        .sort({ timestamp: -1 })
        .limit(limit);
      return tips;
    } catch (error) {
      console.error('❌ Error fetching all tips:', error);
      return [];
    }
  }
}

export default new TipService();

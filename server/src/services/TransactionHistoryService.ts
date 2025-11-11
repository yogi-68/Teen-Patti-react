import { TransactionHistory, TransactionHistoryType, ITransactionHistory } from '../models/TransactionHistory.model.js';
import { User } from '../models/User.model.js';

/**
 * Transaction History Service - Manages all transaction logs
 * Provides a complete audit trail of all user financial activities
 */

export class TransactionHistoryService {
  /**
   * Log a deposit transaction
   */
  async logDeposit(
    userId: string,
    amount: number,
    paymentMethod: string,
    transactionId: string
  ): Promise<ITransactionHistory> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.realCoins;
    const balanceAfter = balanceBefore + amount;

    return await TransactionHistory.create({
      userId,
      type: TransactionHistoryType.DEPOSIT,
      amount,
      balanceBefore,
      balanceAfter,
      description: `Deposit of ₹${amount} via ${paymentMethod}`,
      paymentMethod,
      transactionId
    });
  }

  /**
   * Log a withdrawal transaction
   */
  async logWithdrawal(
    userId: string,
    amount: number,
    paymentMethod: string,
    transactionId: string
  ): Promise<ITransactionHistory> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.realCoins;
    const balanceAfter = balanceBefore - amount;

    return await TransactionHistory.create({
      userId,
      type: TransactionHistoryType.WITHDRAWAL,
      amount: -amount, // Negative for withdrawal
      balanceBefore,
      balanceAfter,
      description: `Withdrawal of ₹${amount} to ${paymentMethod}`,
      paymentMethod,
      transactionId
    });
  }

  /**
   * Log a Joker fee deduction
   */
  async logJokerDeduction(
    userId: string,
    gameId: string,
    originalWinAmount: number,
    feePercent: number,
    feeAmount: number
  ): Promise<ITransactionHistory> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.realCoins;
    const balanceAfter = balanceBefore - feeAmount;

    return await TransactionHistory.create({
      userId,
      type: TransactionHistoryType.JOKER_DEDUCTION,
      amount: -feeAmount, // Negative for deduction
      balanceBefore,
      balanceAfter,
      description: `Joker fee (${feePercent}%) deducted from win of ₹${originalWinAmount}`,
      gameId,
      jokerFeePercent: feePercent,
      originalWinAmount
    });
  }

  /**
   * Log a transfer sent
   */
  async logTransferSent(
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<ITransactionHistory> {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    
    if (!fromUser || !toUser) throw new Error('User not found');

    const balanceBefore = fromUser.realCoins;
    const balanceAfter = balanceBefore - amount;

    return await TransactionHistory.create({
      userId: fromUserId,
      type: TransactionHistoryType.TRANSFER_SENT,
      amount: -amount, // Negative for sender
      balanceBefore,
      balanceAfter,
      description: `Sent ₹${amount} to ${toUser.username}`,
      toUserId,
      toUsername: toUser.username
    });
  }

  /**
   * Log a transfer received
   */
  async logTransferReceived(
    toUserId: string,
    fromUserId: string,
    amount: number
  ): Promise<ITransactionHistory> {
    const toUser = await User.findById(toUserId);
    const fromUser = await User.findById(fromUserId);
    
    if (!toUser || !fromUser) throw new Error('User not found');

    const balanceBefore = toUser.realCoins;
    const balanceAfter = balanceBefore + amount;

    return await TransactionHistory.create({
      userId: toUserId,
      type: TransactionHistoryType.TRANSFER_RECEIVED,
      amount, // Positive for receiver
      balanceBefore,
      balanceAfter,
      description: `Received ₹${amount} from ${fromUser.username}`,
      fromUserId,
      fromUsername: fromUser.username
    });
  }

  /**
   * Log a game win
   */
  async logGameWin(
    userId: string,
    gameId: string,
    winAmount: number
  ): Promise<ITransactionHistory> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.realCoins;
    const balanceAfter = balanceBefore + winAmount;

    return await TransactionHistory.create({
      userId,
      type: TransactionHistoryType.GAME_WIN,
      amount: winAmount,
      balanceBefore,
      balanceAfter,
      description: `Won ₹${winAmount} in game`,
      gameId
    });
  }

  /**
   * Log a game loss
   */
  async logGameLoss(
    userId: string,
    gameId: string,
    lossAmount: number
  ): Promise<ITransactionHistory> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.realCoins;
    const balanceAfter = balanceBefore - lossAmount;

    return await TransactionHistory.create({
      userId,
      type: TransactionHistoryType.GAME_LOSS,
      amount: -lossAmount, // Negative for loss
      balanceBefore,
      balanceAfter,
      description: `Lost ₹${lossAmount} in game`,
      gameId
    });
  }

  /**
   * Get transaction history for a user with pagination and filtering
   */
  async getUserHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: TransactionHistoryType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    transactions: ITransactionHistory[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        query.createdAt.$gte = options.startDate;
      }
      if (options.endDate) {
        query.createdAt.$lte = options.endDate;
      }
    }

    // Execute query with pagination
    const [transactions, total] = await Promise.all([
      TransactionHistory.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .exec(),
      TransactionHistory.countDocuments(query)
    ]);

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get transaction statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalReferralEarnings: number;
    totalJokerDeductions: number;
    totalGameWins: number;
    totalGameLosses: number;
    netProfit: number;
  }> {
    const transactions = await TransactionHistory.find({ userId });

    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalReferralEarnings: 0,
      totalJokerDeductions: 0,
      totalGameWins: 0,
      totalGameLosses: 0,
      netProfit: 0
    };

    transactions.forEach(tx => {
      switch (tx.type) {
        case TransactionHistoryType.DEPOSIT:
          stats.totalDeposits += tx.amount;
          break;
        case TransactionHistoryType.WITHDRAWAL:
          stats.totalWithdrawals += Math.abs(tx.amount);
          break;
        case TransactionHistoryType.REFERRAL_BONUS:
          stats.totalReferralEarnings += tx.amount;
          break;
        case TransactionHistoryType.JOKER_DEDUCTION:
          stats.totalJokerDeductions += Math.abs(tx.amount);
          break;
        case TransactionHistoryType.GAME_WIN:
          stats.totalGameWins += tx.amount;
          break;
        case TransactionHistoryType.GAME_LOSS:
          stats.totalGameLosses += Math.abs(tx.amount);
          break;
      }
    });

    stats.netProfit = 
      stats.totalGameWins +
      stats.totalReferralEarnings -
      stats.totalGameLosses -
      stats.totalJokerDeductions;

    return stats;
  }
}

export default new TransactionHistoryService();

import { User, IUser } from '../models/User.model.js';
import { TransactionHistory, TransactionHistoryType } from '../models/TransactionHistory.model.js';

/**
 * Referral Service - Handles all referral bonus logic
 * 
 * Referral Bonus Structure:
 * - 1st deposit by referred user → 5% bonus to referrer
 * - 2nd deposit by referred user → 2% bonus to referrer
 * - 3rd deposit by referred user → 1% bonus to referrer
 */

export class ReferralService {
  /**
   * Register a new user with a referral code
   * Links the new user to the referrer
   */
  async registerWithReferral(
    newUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; message: string; referrer?: IUser }> {
    try {
      // Find the referrer by referral code
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      
      if (!referrer) {
        return {
          success: false,
          message: 'Invalid referral code'
        };
      }

      // Don't allow self-referral
      if (referrer._id.toString() === newUserId) {
        return {
          success: false,
          message: 'Cannot use your own referral code'
        };
      }

      // Update new user with referrer info
      await User.findByIdAndUpdate(newUserId, {
        referredBy: referrer._id.toString()
      });

      // Add new user to referrer's referred users list
      await User.findByIdAndUpdate(referrer._id, {
        $addToSet: { referredUsers: newUserId }
      });

      
      return {
        success: true,
        message: `Successfully linked to referrer ${referrer.username}`,
        referrer
      };
    } catch (error) {
      console.error('Error registering with referral:', error);
      return {
        success: false,
        message: 'Error processing referral code'
      };
    }
  }

  /**
   * Process referral bonus when a referred user makes a deposit
   * Only processes bonuses for first 3 deposits
   */
  async processDepositBonus(
    depositingUserId: string,
    depositAmount: number
  ): Promise<{ bonusProcessed: boolean; bonusAmount?: number; referrerId?: string }> {
    try {
      // Get the depositing user
      const depositingUser = await User.findById(depositingUserId);
      
      if (!depositingUser || !depositingUser.referredBy) {
        // User wasn't referred or doesn't exist
        return { bonusProcessed: false };
      }

      // Get the referrer
      const referrer = await User.findById(depositingUser.referredBy);
      
      if (!referrer) {
        console.error(`Referrer not found for user ${depositingUserId}`);
        return { bonusProcessed: false };
      }

      // Count how many deposits this user has made (from transaction history)
      const depositCount = await TransactionHistory.countDocuments({
        userId: depositingUserId,
        type: TransactionHistoryType.DEPOSIT
      });

      // Determine bonus percentage based on deposit number
      let bonusPercent = 0;
      let depositNumber = 0;

      if (depositCount === 0) {
        // This is 1st deposit
        bonusPercent = 5;
        depositNumber = 1;
      } else if (depositCount === 1) {
        // This is 2nd deposit
        bonusPercent = 2;
        depositNumber = 2;
      } else if (depositCount === 2) {
        // This is 3rd deposit
        bonusPercent = 1;
        depositNumber = 3;
      } else {
        // More than 3 deposits - no bonus
        return { bonusProcessed: false };
      }

      // Calculate bonus amount
      const bonusAmount = Math.floor(depositAmount * (bonusPercent / 100));

      // Get current balance before bonus
      const balanceBefore = referrer.realCoins;

      // Add bonus to referrer's real coins and referral earnings
      await User.findByIdAndUpdate(referrer._id, {
        $inc: {
          realCoins: bonusAmount,
          referralEarnings: bonusAmount
        }
      });

      // Create transaction history entry for referrer
      await TransactionHistory.create({
        userId: referrer._id.toString(),
        type: TransactionHistoryType.REFERRAL_BONUS,
        amount: bonusAmount,
        balanceBefore,
        balanceAfter: balanceBefore + bonusAmount,
        description: `${bonusPercent}% referral bonus from ${depositingUser.username}'s ${this.ordinal(depositNumber)} deposit`,
        fromUserId: depositingUser._id.toString(),
        fromUsername: depositingUser.username,
        referralDepositNumber: depositNumber,
        referralBonusPercent: bonusPercent,
        metadata: {
          originalDepositAmount: depositAmount
        }
      });


      return {
        bonusProcessed: true,
        bonusAmount,
        referrerId: referrer._id.toString()
      };
    } catch (error) {
      console.error('Error processing referral bonus:', error);
      return { bonusProcessed: false };
    }
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string): Promise<{
    referralCode: string;
    totalReferred: number;
    totalEarned: number;
    referredUsers: Array<{
      username: string;
      joinedDate: Date;
      depositsCount: number;
      bonusesEarned: number;
    }>;
  } | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }

      // Get details for each referred user
      const referredUsersDetails = await Promise.all(
        user.referredUsers.map(async (referredUserId) => {
          const referredUser = await User.findById(referredUserId);
          
          if (!referredUser) {
            return null;
          }

          // Count deposits made by this referred user
          const depositsCount = await TransactionHistory.countDocuments({
            userId: referredUserId,
            type: TransactionHistoryType.DEPOSIT
          });

          // Get total bonuses earned from this referred user
          const bonusTransactions = await TransactionHistory.find({
            userId: userId,
            type: TransactionHistoryType.REFERRAL_BONUS,
            fromUserId: referredUserId
          });

          const bonusesEarned = bonusTransactions.reduce((sum, tx) => sum + tx.amount, 0);

          return {
            username: referredUser.username,
            joinedDate: referredUser.createdAt,
            depositsCount,
            bonusesEarned
          };
        })
      );

      return {
        referralCode: user.referralCode,
        totalReferred: user.referredUsers.length,
        totalEarned: user.referralEarnings,
        referredUsers: referredUsersDetails.filter(u => u !== null) as any[]
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  }

  /**
   * Helper to convert number to ordinal (1st, 2nd, 3rd)
   */
  private ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

export default new ReferralService();

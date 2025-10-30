import { userRepository } from '../repositories/UserRepository.js';
import { IUser } from '../models/User.model.js';

/**
 * User Service - Business logic for user management
 */
export class UserService {
  /**
   * Login or register user
   */
  async loginUser(username: string, email?: string): Promise<IUser> {
    try {
      const user = await userRepository.findOrCreate(username, email);
      console.log(`✅ User logged in: ${user.username} (ID: ${user._id})`);
      return user;
    } catch (error) {
      console.error('Error logging in user:', error);
      throw new Error('Failed to login user');
    }
  }

  /**
   * Get user data
   */
  async getUser(userId: string): Promise<IUser | null> {
    return await userRepository.findById(userId);
  }

  /**
   * Update user balance after game (coins mode)
   */
  async updateCoinsAfterGame(
    userId: string,
    amount: number,
    won: boolean
  ): Promise<IUser | null> {
    try {
      const user = await userRepository.updateCoins(userId, amount);
      return user;
    } catch (error) {
      console.error('Error updating coins:', error);
      return null;
    }
  }

  /**
   * Update user balance after game (cash mode)
   */
  async updateCashAfterGame(
    userId: string,
    amount: number,
    won: boolean
  ): Promise<IUser | null> {
    try {
      const user = await userRepository.updateCashBalance(userId, amount);
      return user;
    } catch (error) {
      console.error('Error updating cash:', error);
      return null;
    }
  }

  /**
   * Add cash to user account
   */
  async addCash(userId: string, amount: number): Promise<{ success: boolean; user?: IUser; error?: string }> {
    return await userRepository.addCash(userId, amount);
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string) {
    return await userRepository.getUserStats(userId);
  }

  /**
   * Validate user has sufficient balance for game mode
   */
  async validateBalance(userId: string, amount: number, gameMode: 'coins' | 'cash'): Promise<{ valid: boolean; error?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    if (gameMode === 'coins') {
      if (user.coins < amount) {
        return { valid: false, error: 'Insufficient coins' };
      }
    } else {
      if (user.cashBalance < amount) {
        return { valid: false, error: 'Insufficient cash balance' };
      }
    }

    return { valid: true };
  }
}

export const userService = new UserService();

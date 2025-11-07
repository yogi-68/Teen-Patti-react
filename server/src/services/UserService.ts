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
   * Update user balance after game (practice mode)
   */
  async updatePracticeCoinsAfterGame(
    userId: string,
    amount: number,
    won: boolean
  ): Promise<IUser | null> {
    try {
      const user = await userRepository.updatePracticeCoins(userId, amount);
      return user;
    } catch (error) {
      console.error('Error updating practice coins:', error);
      return null;
    }
  }

  /**
   * Update user balance after game (real mode)
   */
  async updateRealCoinsAfterGame(
    userId: string,
    amount: number,
    won: boolean
  ): Promise<IUser | null> {
    try {
      const user = await userRepository.updateRealCoins(userId, amount);
      return user;
    } catch (error) {
      console.error('Error updating real coins:', error);
      return null;
    }
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
  async validateBalance(userId: string, amount: number, gameMode: 'practice' | 'real'): Promise<{ valid: boolean; error?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    if (gameMode === 'practice') {
      if (user.practiceCoins < amount) {
        return { valid: false, error: 'Insufficient practice coins' };
      }
    } else {
      if (user.realCoins < amount) {
        return { valid: false, error: 'Insufficient real coins' };
      }
    }

    return { valid: true };
  }
}

export const userService = new UserService();

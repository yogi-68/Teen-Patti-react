import { User, IUser } from '../models/User.model';

/**
 * User Repository - Type-safe database operations
 */
export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id).exec();
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username }).exec();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).exec();
  }

  /**
   * Find or create user
   */
  async findOrCreate(username: string, email?: string): Promise<IUser> {
    let user = await this.findByUsername(username);
    
    if (!user) {
      user = await this.create({ username, email });
    }
    
    return user;
  }

  /**
   * Update user chips
   */
  async updateChips(userId: string, amount: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.chips += amount;
    if (user.chips < 0) user.chips = 0;
    
    return await user.save();
  }

  /**
   * Update game stats
   */
  async updateGameStats(
    userId: string,
    won: boolean,
    winnings: number
  ): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.gamesPlayed += 1;
    if (won) {
      user.gamesWon += 1;
      user.totalWinnings += winnings;
    }
    
    return await user.save();
  }

  /**
   * Get top players by total winnings
   */
  async getTopPlayers(limit: number = 10): Promise<IUser[]> {
    return await User.find()
      .sort({ totalWinnings: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<{
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    totalWinnings: number;
    chips: number;
  } | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const winRate = user.gamesPlayed > 0
      ? (user.gamesWon / user.gamesPlayed) * 100
      : 0;
    
    return {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      winRate: Math.round(winRate * 100) / 100,
      totalWinnings: user.totalWinnings,
      chips: user.chips,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, 'username' | 'email' | 'avatar'>>
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Delete user
   */
  async delete(userId: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(userId).exec();
    return result !== null;
  }

  /**
   * Get all users (with pagination)
   */
  async findAll(page: number = 1, limit: number = 20): Promise<{
    users: IUser[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).exec(),
      User.countDocuments(),
    ]);
    
    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

export const userRepository = new UserRepository();

import { User, IUser } from '../models/User.model.js';

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
   * Register a new user with password
   */
  async register(username: string, email: string, password: string): Promise<IUser> {
    console.log('🔍 Checking if user exists:', username);
    
    // Check if username already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists
    if (email) {
      const existingEmail = await this.findByEmail(email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }
    
    console.log('👤 Creating new user with password...');
    const user = await this.create({ username, email, password });
    console.log('✅ New user created in database:', user._id);
    
    return user;
  }

  /**
   * Login user with password verification
   */
  async login(username: string, password: string): Promise<IUser | null> {
    console.log('🔍 Finding user for login:', username);
    const user = await this.findByUsername(username);
    
    if (!user) {
      console.log('❌ User not found');
      return null;
    }
    
    console.log('🔐 Verifying password...');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password incorrect');
      return null;
    }
    
    console.log('✅ Login successful');
    return user;
  }

  /**
   * Find or create user (for backward compatibility/guest login)
   * @deprecated Use register() and login() instead
   */
  async findOrCreate(username: string, email?: string): Promise<IUser> {
    console.log('⚠️  Using deprecated findOrCreate - consider using register/login instead');
    console.log('🔍 Searching for user:', username);
    let user = await this.findByUsername(username);
    
    if (!user) {
      console.log('👤 User not found, creating new user with default password...');
      // For backward compatibility, create with a default password
      // In production, this should not be used
      user = await this.create({ username, email, password: 'defaultpass123' });
      console.log('✅ New user created in database:', user._id);
    } else {
      console.log('👤 Existing user found:', user._id);
    }
    
    return user;
  }

  /**
   * Update user chips (backward compatibility)
   */
  async updateChips(userId: string, amount: number): Promise<IUser | null> {
    // Chips field removed - use coins or cashBalance instead
    return await this.updateCoins(userId, amount);
  }

  /**
   * Update user coins (free practice coins)
   */
  async updateCoins(userId: string, amount: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.coins += amount;
    if (user.coins < 0) user.coins = 0;
    if (user.coins > 100) user.coins = 100; // Cap at 100
    
    return await user.save();
  }

  /**
   * Update user cash balance (real money)
   */
  async updateCashBalance(userId: string, amount: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.cashBalance += amount;
    if (user.cashBalance < 0) user.cashBalance = 0;
    
    return await user.save();
  }

  /**
   * Add cash to user balance (with max limit validation)
   */
  async addCash(userId: string, amount: number): Promise<{ success: boolean; user?: IUser; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }
    
    if (amount > 10000) {
      return { success: false, error: 'Maximum ₹10,000 per transaction' };
    }
    
    const user = await this.updateCashBalance(userId, amount);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    return { success: true, user };
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<{
    coins: number;
    cashBalance: number;
  } | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    return {
      coins: user.coins,
      cashBalance: user.cashBalance,
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

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
  async register(username: string, email: string, password: string, referralCode?: string): Promise<IUser> {
    
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
    
    // If referral code provided, validate it and get referrer
    let referrerId: string | undefined;
    if (referralCode && referralCode.trim()) {
      const upperCode = referralCode.toUpperCase().trim();
      const referrer = await User.findOne({ referralCode: upperCode });
      
      if (referrer) {
        referrerId = referrer._id.toString();
        console.log(`✅ REFERRAL SUCCESS: Code ${upperCode} belongs to ${referrer.username} (ID: ${referrerId})`);
        
        // Add this new user to referrer's referredUsers array
        await User.findByIdAndUpdate(referrer._id, {
          $addToSet: { referredUsers: username } // Will be updated with actual ID after user creation
        });
      } else {
        console.log(`❌ REFERRAL FAILED: Invalid code ${upperCode} - no matching user found`);
      }
    }
    
    const user = await this.create({ 
      username, 
      email, 
      password,
      ...(referrerId && { referredBy: referrerId })
    });
    
    // Update referrer's referredUsers array with actual user ID
    if (referrerId && user._id) {
      await User.findByIdAndUpdate(referrerId, {
        $addToSet: { referredUsers: user._id.toString() }
      });
      console.log(`✅ Added user ${user.username} (${user._id}) to referrer's (${referrerId}) referredUsers list`);
      console.log(`✅ User ${user.username} has referredBy set to: ${user.referredBy}`);
    }
    
    return user;
  }

  /**
   * Login user with password verification
   * @param usernameOrEmail - Username or email address
   * @param password - Password to verify
   */
  async login(usernameOrEmail: string, password: string): Promise<IUser | null> {
    
    // Try to find by username first, then by email
    let user = await this.findByUsername(usernameOrEmail);
    
    if (!user) {
      user = await this.findByEmail(usernameOrEmail);
    }
    
    if (!user) {
      return null;
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return null;
    }
    
    return user;
  }

  /**
   * Find or create user (for backward compatibility/guest login)
   * @deprecated Use register() and login() instead
   */
  async findOrCreate(username: string, email?: string): Promise<IUser> {
    let user = await this.findByUsername(username);
    
    if (!user) {
      // For backward compatibility, create with a default password
      // In production, this should not be used
      user = await this.create({ username, email, password: 'defaultpass123' });
    } else {
    }
    
    return user;
  }

  /**
   * Update user practice coins
   */
  async updatePracticeCoins(userId: string, amount: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.practiceCoins += amount;
    if (user.practiceCoins < 0) user.practiceCoins = 0;
    
    return await user.save();
  }

  /**
   * Update user real coins (for subscribed users)
   */
  async updateRealCoins(userId: string, amount: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.realCoins += amount;
    if (user.realCoins < 0) user.realCoins = 0;
    
    return await user.save();
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<{
    practiceCoins: number;
    realCoins: number;
  } | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    return {
      practiceCoins: user.practiceCoins,
      realCoins: user.realCoins,
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
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<IUser | null> {
    const user = await User.findById(userId).exec();
    if (!user) {
      return null;
    }
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
    
    return user;
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

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { config } from '../config/config';

export class AuthService {
  private userRepo = new UserRepository();

  /**
   * Register a new user
   */
  async register(username: string, password: string, email?: string): Promise<{ token: string; user: any }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }

    if (email) {
      const existingEmail = await this.userRepo.findByEmail(email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepo.createUser({
      username,
      password: hashedPassword,
      email,
      chips: 10000, // Starting chips
    });

    // Generate token
    const token = this.generateToken(user._id, username);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        chips: user.chips,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
      },
    };
  }

  /**
   * Login user
   */
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    // Find user
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = this.generateToken(user._id, username);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        chips: user.chips,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        totalWinnings: user.totalWinnings,
      },
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; username: string } {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      return { userId: decoded.userId, username: decoded.username };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      config.jwtSecret,
      { expiresIn: '30d' } // Token valid for 30 days
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      chips: user.chips,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      totalWinnings: user.totalWinnings,
    };
  }
}

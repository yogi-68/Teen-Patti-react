import mongoose, { ConnectOptions } from 'mongoose';
import { config } from './config';


/**
 * MongoDB Connection Manager
 */
class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📦 MongoDB already connected');
      return;
    }

    try {
      const mongoUri = config.mongoUri || 'mongodb://localhost:27017/teen-patti';
      
      const options: ConnectOptions = {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      };

      await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:',  (error as Error).message);
      console.warn('⚠️ Server will run without database. Install MongoDB or use MongoDB Atlas.');
      this.isConnected = false;
      // Don't throw error - allow server to run without DB for development
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ MongoDB disconnect error:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get Mongoose instance
   */
  public getMongoose(): typeof mongoose {
    return mongoose;
  }
}

export const database = Database.getInstance();

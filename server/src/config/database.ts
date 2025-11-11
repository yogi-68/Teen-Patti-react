import mongoose, { ConnectOptions } from 'mongoose';
import { config } from './config.js';


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
      return;
    }

    try {
      const mongoUri = config.mongoUri || 'mongodb://localhost:27017/teen-patti';
      
      const options: ConnectOptions = {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
        retryWrites: true,
        retryReads: true,
      };

      await mongoose.connect(mongoUri, options);

      this.isConnected = true;

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected - attempting to reconnect...');
        this.isConnected = false;
        // Mongoose will automatically attempt to reconnect
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
      });
      
      mongoose.connection.on('reconnectFailed', () => {
        console.error('❌ MongoDB reconnection failed');
        this.isConnected = false;
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

  /**
   * Get MongoDB native Db instance
   */
  public getDb() {
    if (!this.isConnected || !mongoose.connection.db) {
      return null;
    }
    return mongoose.connection.db;
  }
}

export const database = Database.getInstance();

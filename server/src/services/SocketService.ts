import { SocketHandler } from '../socket/SocketHandler.js';

/**
 * Global Socket Service
 * Provides access to the SocketHandler instance throughout the application
 */
class SocketService {
  private static socketHandler: SocketHandler | null = null;

  /**
   * Initialize the socket service with the SocketHandler instance
   */
  public static initialize(socketHandler: SocketHandler): void {
    this.socketHandler = socketHandler;
  }

  /**
   * Get the SocketHandler instance
   */
  public static getSocketHandler(): SocketHandler | null {
    return this.socketHandler;
  }

  /**
   * Check if socket service is initialized
   */
  public static isInitialized(): boolean {
    return this.socketHandler !== null;
  }
}

export default SocketService;

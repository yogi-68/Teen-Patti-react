import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    if (import.meta.env.DEV) {
      console.log('🔌 Initializing socket connection to:', SOCKET_URL);
    }
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10, // Limit attempts to avoid infinite reconnection
      timeout: 20000,
      forceNew: false,
      upgrade: true, // Allow transport upgrade from polling to websocket
      rememberUpgrade: true,
    });
    
    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.log('✅ Socket connected successfully');
        console.log('Socket ID:', socket?.id);
      }
    });
    
    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        console.log('⚠️ Socket disconnected:', reason);
      }
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, reconnect manually
        socket?.connect();
      }
    });
    
    socket.on('reconnect', () => {
      if (import.meta.env.DEV) {
        console.log('✅ Socket reconnected');
      }
    });
    
    socket.on('reconnect_attempt', (attempt) => {
      if (import.meta.env.DEV) {
        console.log(`🔄 Attempting to reconnect... (attempt ${attempt})`);
      }
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - please refresh the page');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });
  }
  
  return socket;
};

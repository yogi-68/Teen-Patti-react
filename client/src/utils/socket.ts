import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
    });
    
    socket.on('connect', () => {
    });
    
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, reconnect manually
        socket?.connect();
      }
    });
    
    socket.on('reconnect', (attemptNumber) => {
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });
  }
  
  return socket;
};

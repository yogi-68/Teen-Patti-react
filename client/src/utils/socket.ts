import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }
  
  return socket;
};

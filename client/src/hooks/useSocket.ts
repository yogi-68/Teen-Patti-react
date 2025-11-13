import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setConnected, setTableState } = useGameStore();

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Set initial connection state
    if (import.meta.env.DEV) {
      console.log('🔍 Initial socket.connected state:', socketInstance.connected);
    }
    setConnected(socketInstance.connected);

    const handleConnect = () => {
      if (import.meta.env.DEV) {
        console.log('✅ useSocket: Connected');
      }
      setConnected(true);
    };

    const handleDisconnect = () => {
      if (import.meta.env.DEV) {
        console.log('⚠️ useSocket: Disconnected');
      }
      setConnected(false);
    };

    const handleReconnect = () => {
      if (import.meta.env.DEV) {
        console.log('✅ useSocket: Reconnected');
      }
      setConnected(true);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleReconnect);

    socketInstance.on('tableUpdate', (data) => {
      if (import.meta.env.DEV) {
        console.log('📊 Table update received:', data);
      }
      setTableState(data);
    });

    socketInstance.on('gameStarted', (data) => {
      if (import.meta.env.DEV) {
        console.log('🎮 Game started:', data);
      }
      setTableState(data);
    });

    // Also listen for initial table state when joining
    socketInstance.on('joinedTable', (data) => {
      if (import.meta.env.DEV) {
        console.log('🎯 Joined table:', data);
      }
      // tableUpdate will come next with full state
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.off('tableUpdate');
      socketInstance.off('gameStarted');
      socketInstance.off('joinedTable');
    };
  }, [setConnected, setTableState]);

  return socket;
};

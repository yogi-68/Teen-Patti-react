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
    setConnected(socketInstance.connected);

    const handleConnect = () => {
      console.log('✅ useSocket: Connected');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('⚠️ useSocket: Disconnected');
      setConnected(false);
    };

    const handleReconnect = () => {
      console.log('✅ useSocket: Reconnected');
      setConnected(true);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleReconnect);

    socketInstance.on('tableUpdate', (data) => {
      setTableState(data);
    });

    socketInstance.on('gameStarted', (data) => {
      setTableState(data);
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.off('tableUpdate');
      socketInstance.off('gameStarted');
    };
  }, [setConnected, setTableState]);

  return socket;
};

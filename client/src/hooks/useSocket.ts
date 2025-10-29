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

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('tableUpdate', (data) => {
      setTableState(data);
    });

    socketInstance.on('gameStarted', (data) => {
      setTableState(data);
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('tableUpdate');
      socketInstance.off('gameStarted');
    };
  }, [setConnected, setTableState]);

  return socket;
};

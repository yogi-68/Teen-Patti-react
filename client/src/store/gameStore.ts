import { create } from 'zustand';
import type { GameStoreState, TableState } from '../types/game.types';

export const useGameStore = create<GameStoreState>((set) => ({
  tableState: null,
  myPlayerId: null,
  connected: false,
  
  setTableState: (state: TableState) => {
    console.log('📊 Store: Setting table state', state);
    set({ tableState: state });
  },
  setMyPlayerId: (id: string) => {
    console.log('👤 Store: Setting my player ID', id);
    set({ myPlayerId: id });
  },
  setConnected: (connected: boolean) => {
    console.log('🔌 Store: Connection status', connected);
    set({ connected });
  },
}));

import { create } from 'zustand';
import type { GameStoreState, TableState } from '../types/game.types';

export const useGameStore = create<GameStoreState>((set) => ({
  tableState: null,
  myPlayerId: null,
  connected: false,
  
  setTableState: (state: TableState) => set({ tableState: state }),
  setMyPlayerId: (id: string) => set({ myPlayerId: id }),
  setConnected: (connected: boolean) => set({ connected }),
}));

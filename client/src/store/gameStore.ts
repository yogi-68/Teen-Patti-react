import { create } from 'zustand';
import type { GameStoreState, TableState } from '../types/game.types';

export const useGameStore = create<GameStoreState>((set, get) => ({
  tableState: null,
  myPlayerId: null,
  connected: false,
  
  setTableState: (state: TableState) => {
    console.log('📊 Store: Setting table state', state);
    
    // Preserve current player's cards if they exist
    const currentState = get().tableState;
    const myPlayerId = get().myPlayerId;
    
    if (currentState && myPlayerId) {
      // Find current player's cards in old state
      const oldPlayer = currentState.players.find(p => p.id === myPlayerId);
      const newPlayer = state.players.find(p => p.id === myPlayerId);
      
      // If old player had cards but new player doesn't (or has empty cards), preserve old cards
      if (oldPlayer?.cardSet?.cards && oldPlayer.cardSet.cards.length > 0 && newPlayer?.cardSet) {
        const newPlayerCards = newPlayer.cardSet.cards;
        const hasRealCards = newPlayerCards && newPlayerCards.length > 0 && 
                            newPlayerCards[0].type !== ('hidden' as any);
        
        if (!hasRealCards) {
          // Preserve the old cards
          console.log('🃏 Preserving player cards from previous state');
          newPlayer.cardSet = {
            cards: oldPlayer.cardSet.cards,
            closed: newPlayer.cardSet.closed
          };
        }
      }
    }
    
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

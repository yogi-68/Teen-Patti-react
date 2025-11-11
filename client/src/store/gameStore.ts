import { create } from 'zustand';
import type { GameStoreState, TableState } from '../types/game.types';
import { GameState } from '../types/game.types';

export const useGameStore = create<GameStoreState>((set, get) => ({
  tableState: null,
  myPlayerId: null,
  connected: false,
  
  setTableState: (state: TableState) => {
    
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
        
        // Only preserve cards if game is FINISHED AND no new real cards
        // When new game starts, server sends new cards - accept them with their closed state (true)
        if (state.gameState === GameState.FINISHED && !hasRealCards) {
          // Preserve the old cards AND the closed state (waiting for next game)
          newPlayer.cardSet = {
            cards: oldPlayer.cardSet.cards,
            closed: oldPlayer.cardSet.closed // Keep whether player has seen their cards
          };
        } else if (!hasRealCards) {
          // Hidden cards during game - preserve old visible cards
          newPlayer.cardSet = {
            cards: oldPlayer.cardSet.cards,
            closed: oldPlayer.cardSet.closed
          };
        } else {
          // New real cards = new game/match starting! Accept new cards with closed: true
        }
      }
    }
    
    set({ tableState: state });
  },
  setMyPlayerId: (id: string) => {
    set({ myPlayerId: id });
  },
  setConnected: (connected: boolean) => {
    set({ connected });
  },
}));

import { create } from 'zustand';
import type { GameStoreState, TableState } from '../types/game.types';
import { GameState } from '../types/game.types';

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if game was in progress (not finished)
      if (parsed.tableState && parsed.tableState.gameState !== GameState.FINISHED) {
        return {
          tableState: parsed.tableState,
          myPlayerId: parsed.myPlayerId,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load persisted game state:', error);
  }
  return { tableState: null, myPlayerId: null };
};

// Save state to localStorage
const persistState = (state: { tableState: TableState | null; myPlayerId: string | null }) => {
  try {
    localStorage.setItem('gameState', JSON.stringify({
      tableState: state.tableState,
      myPlayerId: state.myPlayerId,
    }));
  } catch (error) {
    console.error('Failed to persist game state:', error);
  }
};

export const useGameStore = create<GameStoreState>((set, get) => {
  const persisted = loadPersistedState();
  
  return {
    tableState: persisted.tableState,
    myPlayerId: persisted.myPlayerId,
    connected: false,
  
    setTableState: (state: TableState | null) => {
      
      // If setting to null (clearing state), just clear it
      if (state === null) {
        set({ tableState: null });
        persistState({ tableState: null, myPlayerId: get().myPlayerId });
        return;
      }
      
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
          } else if (!hasRealCards && state.gameState === GameState.BETTING && currentState.gameState === GameState.BETTING) {
            // Hidden cards during SAME betting round - preserve old visible cards
            // Only do this if we're staying in betting state (not transitioning from another state)
            newPlayer.cardSet = {
              cards: oldPlayer.cardSet.cards,
              closed: oldPlayer.cardSet.closed
            };
          } else if (!hasRealCards && state.gameState === GameState.BETTING) {
            // New game starting (transitioning TO betting) with placeholder cards
            // Force closed: true for new game
            newPlayer.cardSet = {
              ...newPlayer.cardSet,
              closed: true  // Force closed for new game
            };
          } else {
            // New real cards = new game/match starting! Accept new cards with their closed state
          }
        }
      }
      
      set({ tableState: state });
      // Persist to localStorage
      persistState({ tableState: state, myPlayerId: get().myPlayerId });
    },
    setMyPlayerId: (id: string) => {
      set({ myPlayerId: id });
      // Persist to localStorage
      persistState({ tableState: get().tableState, myPlayerId: id });
    },
    setConnected: (connected: boolean) => {
      set({ connected });
    },
  };
});

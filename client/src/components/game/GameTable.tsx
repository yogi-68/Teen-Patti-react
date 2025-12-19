import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import JokerButton from './JokerButton.tsx';
import TipButton from './TipButton.tsx';
import Confetti from '../Confetti.tsx';
import SoundManager from '../../utils/SoundManager';
import './GameTable.css';

interface GameTableProps {
  socket: Socket | null;
  gameMode: 'trial' | 'token'; // Pass game mode from Dashboard
}

function GameTable({ socket, gameMode }: GameTableProps) {
  const navigate = useNavigate();
  const { tableState, myPlayerId, setTableState } = useGameStore();
  const [timerData, setTimerData] = useState<{ playerId: string; timeLeft: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [jokerActivePlayers, setJokerActivePlayers] = useState<Set<string>>(new Set());
  const [jokerRevealedCards, setJokerRevealedCards] = useState<Record<string, any[]>>({});
  // Store my revealed cards snapshot when I activate Joker (don't update from other Joker users)
  const myRevealedCardsRef = useRef<Record<string, any[]> | null>(null);
  // Ref to prevent stale closure for jokerActivePlayers in socket listeners
  const jokerActivePlayersRef = useRef<Set<string>>(new Set());
  // Track which players' Joker cards have been seen (one-time reveal per game)
  const jokerCardsSeenRef = useRef<Set<string>>(new Set());
  // Track which players should be revealed (who was in my snapshot when I activated)
  const playersToRevealRef = useRef<Set<string>>(new Set());
  // Track joker users count when I took my snapshot (prevent revealing on new activations)
  const snapshotJokerCountRef = useRef<number>(0);
  // Store original cards from game start (before any Joker modifications)
  const originalCardsRef = useRef<Record<string, any[]>>({});

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTipWindow, setShowTipWindow] = useState(false);
  
  // Card dealing animation state
  const [dealingCards, setDealingCards] = useState<Array<{ playerId: string; cardIndex: number; card: any }>>([]);
  const [isDealing, setIsDealing] = useState(false);

  // Refs to keep current values for socket listeners (prevents stale closures)
  const tableStateRef = useRef(tableState);
  const myPlayerIdRef = useRef(myPlayerId);
  
  // Update refs when values change
  useEffect(() => {
    tableStateRef.current = tableState;
  }, [tableState]);
  
  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);
  
  // Sync jokerActivePlayers ref with state
  useEffect(() => {
    jokerActivePlayersRef.current = jokerActivePlayers;
  }, [jokerActivePlayers]);

  // Currency symbol based on game mode
  const currencySymbol = gameMode === 'trial' ? '🪙' : '₹';
  
  // Switch to game background music when entering game
  useEffect(() => {
    SoundManager.playGameBackgroundMusic();
    
    return () => {
      // Switch back to app music when leaving game
      SoundManager.playAppBackgroundMusic();
    };
  }, []);
  
  // Handle leave game - show modal
  const handleLeaveGame = () => {
    setShowLeaveModal(true);
  };

  // Confirm leave game
  const confirmLeaveGame = () => {
    // Emit removePlayer event to properly leave the table
    if (socket && tableState) {
      socket.emit('removePlayer', { 
        tableId: tableState.id, 
        playerId: myPlayerId,
        reason: 'intentional_leave'
      });
      
      // Don't disconnect socket - keep it connected for future games
      // The server will handle removing the player from the table
    }

    // Close modal and navigate immediately
    setShowLeaveModal(false);
    
    // Use replace to prevent going back to game with browser back button
    navigate('/dashboard', { replace: true });
  };

  // Cancel leave game
  const cancelLeaveGame = () => {
    setShowLeaveModal(false);
  };

  // Sync jokerActivePlayers from table state
  useEffect(() => {
    if (!tableState) return;
    
    // Sync jokerActivePlayers from server state
    if (Array.isArray(tableState.jokerUsers)) {
      // If it's a fresh game (only boot collected, pot = boot * players) with NON-EMPTY jokerUsers, ignore (stale data)
      // Boot is typically 1, so pot = 2 for 2 players means fresh game
      const isFreshGame = tableState.pot !== undefined && tableState.pot <= 2;
      if (isFreshGame && tableState.jokerUsers.length > 0) {
        console.log('🚫 Ignoring stale jokerUsers from server - fresh game detected (pot:', tableState.pot, ')');
        return;
      }
      
      // Always sync if empty (clear stale state) or if not a fresh game
      const serverJokerUsers = new Set(tableState.jokerUsers);
      const currentIds = [...jokerActivePlayers].sort().join(',');
      const serverIds = [...serverJokerUsers].sort().join(',');
      
      if (currentIds !== serverIds) {
        console.log('🔄 Syncing jokerActivePlayers from server:', tableState.jokerUsers);
        setJokerActivePlayers(serverJokerUsers);
      }
    }
  }, [tableState?.jokerUsers, tableState?.pot, jokerActivePlayers]);

  // Clear Joker state when new game starts
  useEffect(() => {
    if (!tableState) return;
    
    // If we're in a new game (waiting/dealing), clear all Joker state
    if (tableState.gameState === 'waiting' || tableState.gameState === 'dealing') {
      if (Object.keys(jokerRevealedCards).length > 0 || jokerActivePlayers.size > 0) {
        console.log('🧹 New game starting - clearing all Joker state');
        setJokerRevealedCards({});
        setJokerActivePlayers(new Set());
        myRevealedCardsRef.current = null;
      }
    }
  }, [tableState?.gameState, jokerRevealedCards, jokerActivePlayers]);

  useEffect(() => {
    if (!socket) return;

    // If we have a playerId but no tableState, request the current table state
    if (myPlayerId && !tableState && socket.connected) {
      // The tableUpdate should come automatically, but this ensures we get it
      socket.emit('requestTableState', { playerId: myPlayerId });
    }

    // Handle socket disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected. Reason:', reason);
      setNotification({
        message: 'Connection lost. Attempting to reconnect...',
        type: 'error'
      });
      
      // Auto-reconnect if server forced disconnect
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Handle reconnection
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      // Don't automatically rejoin - let the user go through normal join flow
      // The server will handle reconnection if they join within grace period
      const currentTableState = tableStateRef.current;
      const currentPlayerId = myPlayerIdRef.current;
      if (currentTableState && currentPlayerId) {
        console.log('📡 Socket reconnected while in game - waiting for tableUpdate');
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setNotification({
        message: 'Connection error. Please check your internet.',
        type: 'error'
      });
    });

    socket.on('turnTimer', (data: { playerId: string; timeLeft: number }) => {
      setTimerData(data);
    });

    socket.on('gameCountdown', (data: { countdown: number }) => {
      setCountdown(data.countdown);
      // Server now handles the countdown ticker, just display the value
      if (data.countdown <= 0) {
        setCountdown(null);
        // Reset Joker state when new game starts
        setJokerActivePlayers(new Set());
        setJokerRevealedCards({}); // Clear revealed cards
        myRevealedCardsRef.current = null;
        
        // Reset card visibility for all players when new game starts
        const currentTableState = tableStateRef.current;
        if (currentTableState) {
          const updatedPlayers = currentTableState.players.map(player => ({
            ...player,
            cardSet: player.cardSet ? {
              ...player.cardSet,
              closed: true
            } : player.cardSet
          }));
          setTableState({ ...currentTableState, players: updatedPlayers });
        }
      }
    });

    // Listen for card dealing animation events
    socket.on('cardDealing', (data: { playerId: string; cardIndex: number; totalCards: number; card: any }) => {
      console.log(`🃏 Card dealing animation: Player ${data.playerId}, Card ${data.cardIndex + 1}/${data.totalCards}`, data.card);
      
      // Enable UI blocker during dealing
      setIsDealing(true);
      
      // Play sound once for each card dealt
      SoundManager.playCardDistribute();
      
      // Show only one card at a time - clear when new round starts
      setDealingCards(prev => {
        // Check if this is a new round (cardIndex changed)
        const isNewRound = prev.length > 0 && prev[0].cardIndex !== data.cardIndex;
        
        if (isNewRound) {
          // Clear previous round and start fresh
          return [{ playerId: data.playerId, cardIndex: data.cardIndex, card: data.card }];
        } else {
          // Same round - add this card
          return [...prev, { playerId: data.playerId, cardIndex: data.cardIndex, card: data.card }];
        }
      });
    });

    // Reset Joker state when a new game starts
    socket.on('gameStarted', (newTableState: any) => {
      console.log('🎮 New game started - resetting Joker state and See Cards');
      
      // Show tip window for entire game duration (only in token mode)
      if (gameMode === 'token') {
        setShowTipWindow(true);
      }
      
      // Clear dealing cards animation now that game has started
      setDealingCards([]);
      setIsDealing(false);
      
      setJokerActivePlayers(new Set());
      setJokerRevealedCards({}); // Clear revealed cards
      myRevealedCardsRef.current = null;
      jokerCardsSeenRef.current.clear();
      playersToRevealRef.current.clear();
      
      // Store original cards from game start (before any Joker modifications)
      const originalCards: Record<string, any[]> = {};
      if (newTableState && newTableState.players && Array.isArray(newTableState.players)) {
        newTableState.players.forEach((player: any) => {
          if (player.cardSet && player.cardSet.cards && player.cardSet.cards.length > 0) {
            originalCards[player.id] = player.cardSet.cards.map((card: any) => ({
              rank: card.rank,
              type: card.type
            }));
          }
        });
      }
      originalCardsRef.current = originalCards;
      console.log('📋 Stored original cards for Joker reveal:', Object.keys(originalCards).length, 'players');
      
      if (newTableState) {
        console.log('📊 New table state received:', {
          gameState: newTableState.gameState,
          players: newTableState.allPlayers?.map((p: any) => ({
            id: p.id,
            name: p.playerInfo?.userName,
            cardSetClosed: p.cardSet?.closed
          }))
        });
        
        // IMPORTANT: Ensure all cards are marked as closed for new game
        // Server should send this, but we enforce it client-side as well
        const stateWithClosedCards = {
          ...newTableState,
          players: newTableState.players?.map((p: any) => ({
            ...p,
            cardSet: p.cardSet ? {
              ...p.cardSet,
              closed: true  // Force cards to be closed for new game
            } : p.cardSet
          }))
        };
        
        setTableState(stateWithClosedCards);
        console.log('✅ All cards reset to closed state for new game');
      }
    });

    socket.on('notification', (data: { message: string; type: string }) => {
      setNotification({
        message: data.message,
        type: data.type
      });
      setTimeout(() => setNotification(null), 4000);
    });

    socket.on('gameOver', (data: any) => {
      setWinnerData(data);
      setShowWinner(true);
      
      // Check if I'm the winner using ref
      const currentPlayerId = myPlayerIdRef.current;
      const isWinner = data.winner && currentPlayerId && (
        data.winner.id === currentPlayerId || 
        data.winner.playerId === currentPlayerId || 
        data.winner.playerInfo?.userId === currentPlayerId
      );
      
      // Play winner sound and show confetti if I won
      if (isWinner) {
        SoundManager.playWinnerSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // Play loser sound if I lost
        SoundManager.playLoserSound();
      }
      
      // Clear ALL Joker state when game ends - MUST clear jokerActivePlayers FIRST
      // to prevent viewerHasJoker from being true when placeholder cards arrive
      console.log('🏁 Game over - clearing ALL Joker state');
      setJokerActivePlayers(new Set());
      setJokerRevealedCards({});
      myRevealedCardsRef.current = null;
      
      // Reset all cards to closed state after game ends
      const currentTableState = tableStateRef.current;
      if (currentTableState) {
        const updatedPlayers = currentTableState.players.map(player => ({
          ...player,
          cardSet: player.cardSet ? {
            ...player.cardSet,
            closed: true
          } : player.cardSet
        }));
        setTableState({ ...currentTableState, players: updatedPlayers });
      }
      
      // Hide tip window when game ends
      setShowTipWindow(false);
      
      setTimeout(() => {
        setShowWinner(false);
      }, 10000);
    });

    socket.on('balanceUpdated', (data: { practiceTrial: number; realToken: number }) => {
      // Update localStorage
      localStorage.setItem('practiceTrial', String(data.practiceTrial));
      localStorage.setItem('realToken', String(data.realToken));
      
      // Also update old format for backwards compatibility
      if (gameMode === 'trial') {
        localStorage.setItem('userCoins', String(data.practiceTrial));
      } else {
        localStorage.setItem('tokenBalance', String(data.realToken));
      }
      
      // Show notification
      setNotification({
        message: `💰 Your balance has been updated!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('playerBet', () => {
      // Player bet event handled by other handlers
    });

    socket.on('playerFolded', (data: { playerId: string; playerName?: string; reason?: string }) => {
      if (data.reason === 'disconnected') {
        setNotification({
          message: `${data.playerName || 'Player'} disconnected`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    });

    socket.on('playerTimeout', (data: { playerId: string; playerName: string; message: string }) => {
      setNotification({
        message: `⏰ ${data.playerName} ${data.message}`,
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('playerLeft', (data: { playerId: string; playerName: string; reason: string }) => {
      setNotification({
        message: `${data.playerName} left the game`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('kicked', (data: { reason: string; message: string }) => {
      alert(data.message || 'You have been removed from the game.');
      window.location.href = '/dashboard';
    });

    socket.on('removedFromTable', (data: { success: boolean; message: string }) => {
      if (data.success) {
        alert(data.message || 'You have left the table.');
        window.location.href = '/game';
      }
    });

    // Joker socket listeners
    socket.on('joker:activated', (data: { playerId: string; playerName: string; totalJokerUsers: number }) => {
      if (data && data.playerId && data.playerName) {
        setJokerActivePlayers(prev => new Set(prev).add(data.playerId));
        
        // Tip window already showing during game, no need to toggle
      }
    });

    // Listen for new joker:reveal-cards event (sent immediately when user activates)
    socket.on('joker:reveal-cards', (data: { forUserId: string; revealedCards: Record<string, any[]>; jokerUsers: string[] }) => {
      const currentPlayerId = myPlayerIdRef.current;
      
      console.log('🃏 Joker cards revealed event:', {
        userId: currentPlayerId,
        forUserId: data.forUserId,
        isForMe: data.forUserId === currentPlayerId,
        isJokerUser: data.jokerUsers?.includes(currentPlayerId || ''),
        playerCount: Object.keys(data.revealedCards || {}).length,
      });
      
      // CRITICAL: Only process if this event is explicitly FOR ME
      // Server sends forUserId to indicate who should receive the cards
      if (data.forUserId && data.forUserId !== currentPlayerId) {
        console.log(`🚫 Ignoring joker:reveal-cards - Event is for ${data.forUserId}, not me (${currentPlayerId})`);
        return;
      }
      
      // ABSOLUTE BLOCK: If I already have a snapshot AND have seen cards, NEVER process this event again
      // This prevents any re-reveals even if server keeps broadcasting
      if (myRevealedCardsRef.current && jokerCardsSeenRef.current.size > 0) {
        console.log('🚫 BLOCKING joker:reveal-cards - I already have snapshot and seen cards. Ignoring completely.');
        console.log('   Snapshot has:', Object.keys(myRevealedCardsRef.current).length, 'players');
        console.log('   Already seen:', jokerCardsSeenRef.current.size, 'players');
        return;
      }
      
      if (currentPlayerId && data && data.revealedCards && data.jokerUsers && data.jokerUsers.includes(currentPlayerId)) {
        // If I already have a revealed cards snapshot, ignore this event
        // This prevents seeing new cards when another player activates Joker after me
        // UNLESS jokerCardsSeenRef is empty (meaning we just rejoined)
        const isRejoin = myRevealedCardsRef.current && jokerCardsSeenRef.current.size === 0;
        
        if (myRevealedCardsRef.current && !isRejoin) {
          console.log('🃏 Ignoring Joker reveal - I already have my snapshot from when I activated Joker');
          // Still update jokerActivePlayers list for state consistency
          setJokerActivePlayers(new Set(data.jokerUsers));
          return;
        }
        
        if (isRejoin) {
          console.log('🔄 REJOIN DETECTED - Will show cards once more, then mark as seen');
        } else {
          console.log(`🃏 Joker cards revealed! Showing ${Object.keys(data.revealedCards).length} players' cards to you - First time activation!`);
        }
        
        // IMPORTANT: Use ORIGINAL cards from game start, NOT the modified Joker cards
        console.log('📋 Using ORIGINAL cards from game start, ignoring Joker-modified cards');
        const cardsToReveal = originalCardsRef.current;
        
        // CRITICAL: Store which players I should see cards for
        // Only players who are in my snapshot when I activate
        // This prevents showing cards of players who activate Joker AFTER me
        playersToRevealRef.current = new Set(Object.keys(cardsToReveal));
        snapshotJokerCountRef.current = data.jokerUsers.length; // Remember how many Joker users when I activated
        console.log('📋 Players I can reveal:', Array.from(playersToRevealRef.current));
        console.log('📋 Joker users count at snapshot:', snapshotJokerCountRef.current);
        
        console.log('📋 Original cards data:', Object.keys(cardsToReveal).map(pid => ({
          playerId: pid,
          cards: cardsToReveal[pid]?.map((c: any) => `${c.rank}${c.type}`) || []
        })));
        
        // Store this snapshot - these are MY revealed cards that I'll see until game ends
        myRevealedCardsRef.current = cardsToReveal;
        
        // Update jokerActivePlayers with all Joker users
        setJokerActivePlayers(new Set(data.jokerUsers));
        
        // Store the ORIGINAL revealed cards (not Joker-modified)
        setJokerRevealedCards(cardsToReveal);
        console.log('✅ Joker revealed cards stored and will be shown immediately');
        
        // CRITICAL: Mark all cards as seen immediately after showing them
        // This prevents showing them again on next tableUpdate
        console.log('🔒 Marking all revealed cards as SEEN');
        Object.keys(cardsToReveal).forEach(playerId => {
          jokerCardsSeenRef.current.add(playerId);
        });
        console.log('✅ Cards marked as seen:', Array.from(jokerCardsSeenRef.current));
      }
    });

    // Keep backward compatibility with old event name
    socket.on('joker:cards-revealed', (data: { visibleCards: Record<string, any[]>; jokerUserIds: string[] }) => {
      // Store revealed cards for Joker users
      const currentPlayerId = myPlayerIdRef.current;
      if (currentPlayerId && data && data.jokerUserIds && data.visibleCards && data.jokerUserIds.includes(currentPlayerId)) {
        console.log(`🃏 Joker cards revealed (old event)! Showing ${Object.keys(data.visibleCards).length} players' cards to you`);
        
        // Store the revealed cards separately to preserve them across table updates
        setJokerRevealedCards(data.visibleCards);
        console.log('✅ Joker revealed cards stored - will be applied to table state');
        
        // Get the CURRENT table state (not from closure)
        const currentState = useGameStore.getState().tableState;
        if (currentState) {
          console.log('🔍 Applying Joker cards to', currentState.players.length, 'players in current state');
          
          const updatedPlayers = currentState.players.map(player => {
            if (data.visibleCards[player.id]) {
              console.log('  ✓ Updating cards for player:', player.id, player.playerInfo.userName);
              return {
                ...player,
                cardSet: {
                  ...player.cardSet,
                  cards: data.visibleCards[player.id],
                  closed: player.cardSet?.closed ?? true
                }
              };
            }
            return player;
          });
          
          console.log('✅ Updated', updatedPlayers.length, 'players with Joker cards');
          setTableState({ ...currentState, players: updatedPlayers });
        }
      }
    });

    socket.on('joker:winner', (data: { winnerId: string; winnerName: string; hand: string; amount: number }) => {
      if (data && data.winnerName && data.hand !== undefined && data.amount !== undefined) {
        setNotification({
          message: `🏆 Joker Winner: ${data.winnerName} (${data.hand}) - Won ${currencySymbol}${data.amount}`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    });

    socket.on('joker:fee-applied', (data: { winnerId: string; winnerName: string; feeAmount: number; remainingAmount: number }) => {
      if (data && data.winnerId === myPlayerId && data.feeAmount !== undefined && data.remainingAmount !== undefined) {
        setNotification({
          message: `⚠️ Joker fee applied: -${currencySymbol}${data.feeAmount.toFixed(2)} (30% fee). You received ${currencySymbol}${data.remainingAmount.toFixed(2)}`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 6000);
      }
    });

    // Handle table state updates from server
    socket.on('tableUpdate', (serverState: any) => {
      console.log('📡 ==================== TABLE UPDATE RECEIVED (WEB) ====================');
      console.log('📡 Received tableUpdate from server');
      console.log('📡 Server players:', serverState?.players?.map((p: any) => ({
        id: p.id,
        name: p.playerInfo?.userName,
        cardSetClosed: p.cardSet?.closed
      })));
      
      const currentState = tableStateRef.current;
      const currentPlayerId = myPlayerIdRef.current;
      const currentJokerPlayers = jokerActivePlayersRef.current;
      
      console.log('📡 Current state check:', {
        hasCurrentState: !!currentState,
        currentPlayerId,
        jokerActivePlayers: Array.from(currentJokerPlayers),
        iAmJokerUser: Array.from(currentJokerPlayers).includes(currentPlayerId || '')
      });
      
      if (!serverState || !currentPlayerId) {
        console.log('⏭️ Skipping tableUpdate - missing data');
        return;
      }
      
      // Check if I'm a Joker user
      const iAmJokerUser = Array.from(currentJokerPlayers).includes(currentPlayerId);
      const currentJokerCount = currentJokerPlayers.size;
      const hasNewJokerActivation = currentJokerCount > snapshotJokerCountRef.current;
      
      if (hasNewJokerActivation && iAmJokerUser && myRevealedCardsRef.current) {
        console.log('🚫 New Joker activation detected - NOT revealing cards (Joker count:', currentJokerCount, '> snapshot:', snapshotJokerCountRef.current, ')');
        // Update snapshot count to prevent repeated logs
        snapshotJokerCountRef.current = currentJokerCount;
      }
      
      if (!iAmJokerUser || !currentState || hasNewJokerActivation) {
        // If I'm not a Joker user, or no current state, accept server state as-is
        setTableState(serverState);
        return;
      }
      
      // If I'm a Joker user, preserve revealed cards
      console.log('🃏 I\'m a Joker user - preserving revealed cards from server updates');
      
      // First, check if we have a snapshot of revealed cards
      if (myRevealedCardsRef.current) {
        console.log('🃏 Using revealed cards snapshot to restore card visibility');
        const revealedCards = myRevealedCardsRef.current;
        
        // Check which players' cards haven't been seen yet in this game
        // AND are in my reveal list (don't show new Joker users)
        const unseenPlayers = Object.keys(revealedCards).filter(
          playerId => !jokerCardsSeenRef.current.has(playerId) && playersToRevealRef.current.has(playerId)
        );
        
        if (unseenPlayers.length > 0) {
          console.log('🃏 Applying one-time reveal for unseen players:', unseenPlayers);
          console.log('🔒 Already seen players (staying hidden):', Array.from(jokerCardsSeenRef.current));
          
          const preservedPlayers = serverState.players.map((serverPlayer: any) => {
            const playerRevealedCards = revealedCards[serverPlayer.id];
            const hasNotSeenYet = !jokerCardsSeenRef.current.has(serverPlayer.id);
            
            if (playerRevealedCards && playerRevealedCards.length > 0 && hasNotSeenYet) {
              console.log(`🔄 Showing revealed cards for player ${serverPlayer.playerInfo?.userName} (FIRST AND ONLY TIME)`);
              // Mark as seen PERMANENTLY for this game
              jokerCardsSeenRef.current.add(serverPlayer.id);
              
              return {
                ...serverPlayer,
                cardSet: {
                  cards: playerRevealedCards,
                  closed: false, // Show cards this one time
                },
              };
            }
            
            // If already seen, keep cards HIDDEN permanently
            if (playerRevealedCards && jokerCardsSeenRef.current.has(serverPlayer.id)) {
              return {
                ...serverPlayer,
                cardSet: {
                  ...serverPlayer.cardSet,
                  closed: true, // Keep hidden - already seen
                },
              };
            }
            
            return serverPlayer;
          });
          
          setTableState({
            ...serverState,
            players: preservedPlayers,
          });
        } else {
          console.log('👁️ All Joker cards have been seen - staying hidden for rest of game');
          setTableState(serverState);
        }
        return;
      }
      
      // Fallback: preserve revealed cards from current state
      const preservedPlayers = serverState.players.map((serverPlayer: any) => {
        const oldPlayer = currentState.players.find((p: any) => p.id === serverPlayer.id);
        
        // Stop card reveal loop if my cards just got revealed
        if (serverPlayer.id === myPlayerId && oldPlayer?.cardSet?.closed === true && serverPlayer.cardSet?.closed === false) {
          console.log('🎵 Stopping card reveal loop (cards revealed)');
          SoundManager.stopCardRevealLoop();
        }
        
        // If this player's cards are already revealed (closed === false), keep them revealed
        if (oldPlayer?.cardSet?.closed === false) {
          console.log(`🔄 Preserving revealed cards for player ${serverPlayer.playerInfo?.userName}`);
          return {
            ...serverPlayer,
            cardSet: oldPlayer.cardSet, // Keep the revealed cards
          };
        }
        
        // Otherwise accept server state
        return serverPlayer;
      });
      
      setTableState({
        ...serverState,
        players: preservedPlayers,
      });
    });

    socket.on('joker:error', (data: { error: string }) => {
      if (data && data.error) {
        console.error('🃏 Joker error:', data.error);
        setNotification({
          message: `❌ Joker Error: ${data.error}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 4000);
      }
    });

    return () => {
      socket.off('disconnect');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('turnTimer');
      socket.off('gameCountdown');
      socket.off('gameStarted');
      socket.off('notification');
      socket.off('gameOver');
      socket.off('balanceUpdated');
      socket.off('playerBet');
      socket.off('playerFolded');
      socket.off('playerLeft');
      socket.off('kicked');
      socket.off('removedFromTable');
      socket.off('tableUpdate');
      socket.off('joker:activated');
      socket.off('joker:reveal-cards');
      socket.off('joker:cards-revealed');
      socket.off('joker:winner');
      socket.off('joker:fee-applied');
      socket.off('joker:error');
    };
  }, [socket]); // Only depend on socket to prevent constant re-renders

  // IMPORTANT: ALL HOOKS MUST COME BEFORE EARLY RETURNS
  // Memoize player calculations to prevent unnecessary re-renders
  const allPlayers = tableState?.players || [];
  
  const currentPlayer = useMemo(() => 
    allPlayers.find(p => p.id === myPlayerId),
    [allPlayers, myPlayerId]
  );
  
  const otherPlayers = useMemo(() => 
    allPlayers.filter(p => p.id !== myPlayerId),
    [allPlayers, myPlayerId]
  );
  
  // Stable player positions - maintain fixed slots for each player ID
  const playerIdsRef = useRef<string>('');
  const positionAssignmentsRef = useRef<Map<string, string>>(new Map()); // playerId -> position key (pos0, pos1, etc)
  
  // Calculate current player IDs
  const currentPlayerIds = otherPlayers.map(p => p.id).sort().join(',');
  
  // Only reassign position slots if player IDs actually changed (join/leave)
  if (playerIdsRef.current !== currentPlayerIds) {
    playerIdsRef.current = currentPlayerIds;
    positionAssignmentsRef.current.clear();
    
    const sortedPlayers = [...otherPlayers].sort((a, b) => a.id.localeCompare(b.id));
    sortedPlayers.forEach((player, index) => {
      positionAssignmentsRef.current.set(player.id, `pos${index}`);
    });
  }
  
  // Build positions object using stable assignments but latest player data
  const playerPositions: { [key: string]: any } = {};
  otherPlayers.forEach(player => {
    const posKey = positionAssignmentsRef.current.get(player.id);
    if (posKey) {
      playerPositions[posKey] = player;
    }
  });

  // NOW safe to do early returns after all hooks
  if (!tableState) {
    return <div className="loading">Loading table...</div>;
  }
  
  // Debug log for See Cards button visibility
  if (import.meta.env.DEV && currentPlayer) {
    console.log('🔍 See Cards Debug:', {
      hasCardSet: !!currentPlayer.cardSet,
      closed: currentPlayer.cardSet?.closed,
      gameState: tableState.gameState,
      buttonShouldShow: !!(currentPlayer.cardSet && currentPlayer.cardSet.closed && tableState.gameState === 'betting')
    });
  }
  
  return (
    <div className="game-table">
      {/* UI Blocker during card dealing */}
      {isDealing && <div className="dealing-ui-blocker" />}
      
      {/* Card Dealing Animation Overlay */}
      {dealingCards.map((card, index) => {
        const player = tableState.players.find(p => p.id === card.playerId);
        if (!player) return null;
        
        // Determine player position class
        const isCurrentPlayer = player.id === myPlayerId;
        let playerPosition = 'current-player';
        
        if (!isCurrentPlayer) {
          const posKey = positionAssignmentsRef.current.get(player.id);
          // Map pos0, pos1, pos2, etc. to actual position names
          const positionMap: { [key: string]: string } = {
            'pos0': 'left',
            'pos1': 'topleft',
            'pos2': 'top',
            'pos3': 'topright',
            'pos4': 'right',
          };
          const mappedPosition = posKey ? positionMap[posKey] : 'left';
          playerPosition = `player-${mappedPosition}`;
        }
        
        // Stack cards with offset to show progression: 1 card → 2 cards → 3 cards
        const playerCards = dealingCards.filter(c => c.playerId === card.playerId);
        const cardIndexInSequence = playerCards.findIndex(c => 
          c.playerId === card.playerId && c.cardIndex === card.cardIndex
        );
        const cardOffset = cardIndexInSequence * 15; // 15px offset per card
        
        return (
          <div 
            key={`${card.playerId}-${card.cardIndex}-${index}`}
            className={`dealing-card dealing-card-to-${playerPosition}`}
            style={{ 
              left: isCurrentPlayer ? `calc(50% + ${cardOffset}px)` : undefined,
              marginLeft: !isCurrentPlayer ? `${cardOffset}px` : undefined
            }}
          >
            <img 
              src="/images/cards/red_joker.svg" 
              alt="Card back"
              className="dealing-card-image"
            />
          </div>
        );
      })}
      
      {/* Leave Button - Top Left */}
      <button className="btn-leave-game" onClick={handleLeaveGame} title="Leave Game">
        ← Leave Game
      </button>

      {/* Private Table Code Display - Top Center */}
      {tableState.isPrivate && tableState.tableCode && (
        <div className="private-table-code-banner">
          <span className="code-label">Private Table Code:</span>
          <span className="code-value">{tableState.tableCode}</span>
          <button
            className="code-copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(tableState.tableCode || '');
              setNotification({ message: '📋 Code copied!', type: 'success' });
              setTimeout(() => setNotification(null), 2000);
            }}
            title="Copy code"
          >
            📋
          </button>
        </div>
      )}

      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content leave-modal">
            <div className="modal-header">
              <h2>⚠️ Leave Game?</h2>
            </div>
            <div className="modal-body">
              <p className="warning-text">Are you sure you want to leave the game?</p>
              <ul className="warning-list">
                <li>🃏 You will fold your hand</li>
                <li>👥 You will be removed from the game</li>
                <li>🚫 You cannot rejoin this round</li>
                <li>💰 Any bet you placed will be lost</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelLeaveGame}>
                Cancel
              </button>
              <button className="btn-confirm-leave" onClick={confirmLeaveGame}>
                Yes, Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teen Patti Logo Watermark on Table */}
      <div className="table-logo">TEEN PATTI</div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {showWinner && winnerData && (
        <div className="winner-overlay">
          <div className="winner-card">
            <h2>🏆 Winner!</h2>
            <h3>{winnerData.winner.playerInfo.userName}</h3>
            <p className="winner-hand">{winnerData.reason}</p>
            <p className="winner-chips">Won: {currencySymbol}{tableState.pot.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Pot Display - Center of Table */}
      <div className="pot-display">
        <div className="pot-amount">{currencySymbol}{tableState.pot.toLocaleString()}</div>
        <div className="pot-label">Pot</div>
      </div>

      {(tableState.gameState === 'waiting' || tableState.gameState === 'finished') && countdown !== null && countdown > 0 && !showWinner && (
        <div className="countdown-overlay">
          <span className="countdown-text">
            {tableState.gameState === 'finished' ? 'Next game starts in ' : 'Game starts in '}
            {countdown} {countdown === 1 ? 'second' : 'seconds'}...
          </span>
        </div>
      )}
      {tableState.gameState === 'waiting' && countdown === null && (
        <div className="waiting-area">
          <h3>⏳ Waiting...</h3>
          <p>{tableState.playerCount} player(s)</p>
          {tableState.playerCount < 2 && (
            <p className="hint">Need 2+ players</p>
          )}
        </div>
      )}

      {/* Table Layout - Original Style */}
      <div className="table-layout">
        {/* Other Players - Top Row - Use stable positions */}
        <div className="opponents-row">
          {Object.keys(playerPositions).map((posKey, index) => {
            const player = playerPositions[posKey];
            if (!player) return null;
            
            const showTimer = timerData?.playerId === player.id;
            const isJokerActive = jokerActivePlayers.has(player.id);
            const viewerHasJoker = myPlayerId ? jokerActivePlayers.has(myPlayerId) : false;
            return (
              <div 
                key={player.id} 
                className={`opponent-seat seat-${index} ${isJokerActive ? 'joker-active' : ''}`}
              >
                <PlayerCard
                  player={player}
                  position={0}
                  showTimer={showTimer}
                  timeLeft={timerData?.timeLeft || 0}
                  isCurrentPlayer={false}
                  currencySymbol={currencySymbol}
                  isJokerUser={isJokerActive}
                  viewerHasJoker={viewerHasJoker}
                />
              </div>
            );
          })}
        </div>

        {/* Current Player - Bottom */}
        {currentPlayer && (
          <div className="current-player-area">
            <div className="current-player-seat">
              <PlayerCard
                player={currentPlayer}
                position={0}
                showTimer={timerData?.playerId === currentPlayer.id}
                timeLeft={timerData?.timeLeft || 0}
                isCurrentPlayer={true}
                currencySymbol={currencySymbol}
                isJokerUser={jokerActivePlayers.has(currentPlayer.id)}
                viewerHasJoker={jokerActivePlayers.has(currentPlayer.id)}
              />
              
              {/* See Cards Button - Disabled when Joker is active */}
              {currentPlayer.cardSet && currentPlayer.cardSet.closed && tableState.gameState === 'betting' && !jokerActivePlayers.has(myPlayerId || '') && (
                <button
                  className="btn-see-cards"
                  onClick={() => {
                    SoundManager.playButtonClick();
                    // Play see sound for 1 second
                    SoundManager.playSeeSound();
                    socket?.emit('seeCards', { tableId: tableState.id, playerId: myPlayerId });
                    
                    // Tip window already showing during game, no need to toggle
                  }}
                >
                  👁️ See Cards
                </button>
              )}

              {/* Joker Button - Tier-based premium feature (Token mode only) */}
              {myPlayerId != null && tableState && gameMode === 'token' && (
                <JokerButton
                  socket={socket}
                  tableState={tableState}
                  userId={myPlayerId}
                  gameMode={gameMode}
                />
              )}

              {/* Tip Button - Live tip system (Token mode only, after seeing cards or using Joker) */}
              {myPlayerId && tableState && (
                <TipButton
                  socket={socket}
                  tableState={tableState}
                  userId={myPlayerId}
                  gameMode={gameMode}
                  hasSeenCards={!currentPlayer.cardSet?.closed}
                  hasUsedJoker={jokerActivePlayers.has(myPlayerId || '')}
                  showTipWindow={showTipWindow}
                />
              )}

              {/* Good Cards Popup - Disabled */}
            </div>

            {/* Betting Controls - Always Show for Current Player During Betting */}
            {tableState.gameState === 'betting' && (
              <div className="betting-controls-container">
                <BettingPanel
                  socket={socket}
                  tableState={tableState}
                  myPlayer={currentPlayer}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Confetti Animation on Winner */}
      {showConfetti && <Confetti />}
    </div>
  );
}

export default GameTable;

export interface Card {
  type: 'heart' | 'spade' | 'diamond' | 'club';
  rank: number;
  name: string;
  priority: number;
  id?: string;
}

export interface PlayerInfo {
  userName: string;
  userId?: string;
  chips: number;
  avatar?: string;
}

export interface CardSet {
  cards: Card[];
  closed: boolean; // true = blind, false = chaal
}

export interface Player {
  id: string;
  playerInfo: PlayerInfo;
  cardSet: CardSet | null;
  bet: number;
  totalBet: number;
  folded: boolean;
  turn: boolean;
  connected: boolean;
}

export interface TableConfig {
  bootAmount: number;
  minBet: number;
  maxBet: number;      // bootAmount * 2^7 (128)
  potLimit: number;    // bootAmount * 2^11 (2048) - triggers auto-show
  maxPlayers: number;
}

export const GameState = {
  WAITING: 'waiting',
  DEALING: 'dealing',
  BETTING: 'betting',
  SHOWDOWN: 'showdown',
  FINISHED: 'finished',
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export interface TableState {
  id: number;
  config: TableConfig;
  players: Player[];
  pot: number;
  currentTurn: string | null;
  gameState: GameState;
  lastBet: number;
  lastBlind: boolean;
  roundCount: number;
  playerCount: number;
}

export interface GameStoreState {
  tableState: TableState | null;
  myPlayerId: string | null;
  connected: boolean;
  setTableState: (state: TableState) => void;
  setMyPlayerId: (id: string) => void;
  setConnected: (connected: boolean) => void;
}

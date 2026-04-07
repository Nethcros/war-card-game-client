// ---- Auth ----

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---- Cards ----

export interface Card {
  id: number;     // 0-51 (Card(id) from spec)
  value: number;  // 2-14 (Card(value) — 2 through Ace)
  suit: number;   // 0-3
}

// ---- Game State (used by useReducer) ----

export type RoundResult = 'win' | 'loss' | 'war' | null;

export interface GameState {
  p1Stack: number[];       // Player_1 (student) card deck — array of Card(id)s
  p2Stack: number[];       // Player_2 (computer) card deck — array of Card(id)s
  p1Play: number[];        // Cards currently in play for P1 (grows during war)
  p2Play: number[];        // Cards currently in play for P2
  currentRound: number;    // CurrentRound from spec
  roundResult: RoundResult;
  gameOver: boolean;
  gameMessage: string;     // GameStateDisplay / CurrentRoundDisplay from spec
  canFlip: boolean;        // Controls whether clicking the deck does anything
}

// ---- Game Actions (dispatched to useReducer) ----

export type GameAction =
  | { type: 'START_GAME'; deck: number[] }
  | { type: 'FLIP_CARD' }
  | { type: 'SET_MESSAGE'; message: string };

// ---- Game Log (from backend) ----

export interface GameRecord {
  game_id: number;
  student_id: number;
  win: boolean;
  rounds: number;
  created_at: string;
}
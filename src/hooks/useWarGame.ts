import { useReducer, useCallback, useState } from 'react';
import { shuffleDeck, getCardValue } from '../services/cardUtils';
import { postGame } from '../services/api';
import type { GameState, GameAction, GameRecord } from '../types';

// ---- Initial state ----

const INITIAL_STATE: GameState = {
  p1Stack: [],
  p2Stack: [],
  p1Play: [],
  p2Play: [],
  currentRound: 0,
  roundResult: null,
  gameOver: false,
  gameMessage: 'Press Start to begin!',
  canFlip: false,
};

// ---- Reducer ----

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      // Spec: shuffle deck → P1Stack gets items 0-25, P2Stack gets items 26-51
      return {
        p1Stack: action.deck.slice(0, 26),
        p2Stack: action.deck.slice(26),
        p1Play: [],
        p2Play: [],
        currentRound: 0,
        roundResult: null,
        gameOver: false,
        gameMessage: 'Game in Progress',
        canFlip: true,
      };
    }

    case 'FLIP_CARD': {
      if (!state.canFlip || state.gameOver) return state;

      const p1Stack = [...state.p1Stack];
      const p2Stack = [...state.p2Stack];
      let p1Play = [...state.p1Play];
      let p2Play = [...state.p2Play];

      // Spec: Check count P1Stack && P2Stack — if either is empty, goto WinLogic
      if (p1Stack.length === 0 || p2Stack.length === 0) {
        return resolveGameEnd(state, p1Stack, p2Stack, p1Play, p2Play);
      }

      // Spec: CutPaste P1Stack position 0(id) to P1Py, same for P2
      const p1Card = p1Stack.shift()!;
      const p2Card = p2Stack.shift()!;
      p1Play.push(p1Card);
      p2Play.push(p2Card);

      const p1Value = getCardValue(p1Card);
      const p2Value = getCardValue(p2Card);
      const newRound = state.currentRound + 1;

      if (p1Value > p2Value) {
        // Spec: P1Py(value) > P2Py(value) → append P1Stack with all play cards
        // Winner collects: their cards first, then opponent's
        p1Stack.push(...p1Play, ...p2Play);
        const result: GameState = {
          p1Stack,
          p2Stack,
          p1Play,     // Keep visible so UI shows what was played this round
          p2Play,
          currentRound: newRound,
          roundResult: 'win',
          gameMessage: `Round ${newRound}: Round Won`,
          canFlip: true,
          gameOver: false,
        };
        // Check if game is over after collecting
        if (p2Stack.length === 0) {
          return {
            ...result,
            gameOver: true,
            canFlip: false,
            gameMessage: `You win the game in ${newRound} rounds!`,
          };
        }
        return result;
      }

      if (p1Value < p2Value) {
        // Spec: P1Py(value) < P2Py(value) → append P2Stack
        p2Stack.push(...p2Play, ...p1Play);
        const result: GameState = {
          p1Stack,
          p2Stack,
          p1Play,
          p2Play,
          currentRound: newRound,
          roundResult: 'loss',
          gameMessage: `Round ${newRound}: Round Lost`,
          canFlip: true,
          gameOver: false,
        };
        if (p1Stack.length === 0) {
          return {
            ...result,
            gameOver: true,
            canFlip: false,
            gameMessage: `You lost the game in ${newRound} rounds!`,
          };
        }
        return result;
      }

      // Spec: P1Py(value) = P2Py(value) → WAR!
      // Each player places 1 card face-down, then flip again
      if (p1Stack.length === 0 || p2Stack.length === 0) {
        // Can't wage war with empty stack — resolve game
        return resolveGameEnd(
          { ...state, currentRound: newRound },
          p1Stack, p2Stack, p1Play, p2Play,
        );
      }

      // Face-down card into the war pot
      p1Play.push(p1Stack.shift()!);
      p2Play.push(p2Stack.shift()!);

      return {
        p1Stack,
        p2Stack,
        p1Play,
        p2Play,
        currentRound: newRound,
        roundResult: 'war',
        gameMessage: `Round ${newRound}: WAR!`,
        canFlip: true,   // Player flips again to resolve
        gameOver: false,
      };
    }

    case 'SET_MESSAGE':
      return { ...state, gameMessage: action.message };

    default:
      return state;
  }
}

// ---- Helper: WinLogic from spec ----

function resolveGameEnd(
  state: GameState,
  p1Stack: number[],
  p2Stack: number[],
  p1Play: number[],
  p2Play: number[],
): GameState {
  const p1Total = p1Stack.length + p1Play.length;
  const p2Total = p2Stack.length + p2Play.length;

  let message: string;
  let win: boolean | null = null;

  if (p1Total > p2Total) {
    message = `You win the game in ${state.currentRound} rounds!`;
    win = true;
  } else if (p2Total > p1Total) {
    message = `You lost the game in ${state.currentRound} rounds!`;
    win = false;
  } else {
    message = 'Both decks are empty! This is either an error or you have used up a lifetime worth of luck.';
  }

  return {
    ...state,
    p1Stack,
    p2Stack,
    p1Play,
    p2Play,
    gameOver: true,
    canFlip: false,
    gameMessage: message,
  };
}

// ---- Hook ----

export function useWarGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [gameTimestamp, setGameTimestamp] = useState<string | null>(null);

  const startGame = useCallback(() => {
    const deck = shuffleDeck();
    dispatch({ type: 'START_GAME', deck });
    setGameTimestamp(null);
  }, []);

  const flipCard = useCallback(() => {
    dispatch({ type: 'FLIP_CARD' });
  }, []);

  const saveGame = useCallback(async (win: boolean, rounds: number): Promise<GameRecord | undefined> => {
    try {
      const res = await postGame(win, rounds);
      setGameTimestamp(res.data.created_at);
      return res.data;
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }, []);

  return { state, startGame, flipCard, saveGame, gameTimestamp };
}
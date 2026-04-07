// src/hooks/useWarGame.ts

import { useReducer, useCallback, useState } from 'react';
import { shuffleDeck, getCardValue } from '../services/cardUtils';
import { postGame } from '../services/api';
import type { GameState, GameAction, GameRecord } from '../types';

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
  if (p1Total > p2Total) {
    message = `You win the game in ${state.currentRound} rounds!`;
  } else if (p2Total > p1Total) {
    message = `You lost the game in ${state.currentRound} rounds!`;
  } else {
    message =
      'Both decks are empty! This is either an error or you have used up a lifetime worth of luck.';
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

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
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
      const p1Play = [...state.p1Play];
      const p2Play = [...state.p2Play];

      if (p1Stack.length === 0 || p2Stack.length === 0) {
        return resolveGameEnd(state, p1Stack, p2Stack, p1Play, p2Play);
      }

      p1Play.push(p1Stack.shift()!);
      p2Play.push(p2Stack.shift()!);

      const p1Value = getCardValue(p1Play[p1Play.length - 1]);
      const p2Value = getCardValue(p2Play[p2Play.length - 1]);
      const newRound = state.currentRound + 1;

      if (p1Value > p2Value) {
        p1Stack.push(...p1Play, ...p2Play);
        if (p2Stack.length === 0) {
          return {
            p1Stack, p2Stack, p1Play, p2Play,
            currentRound: newRound, roundResult: 'win',
            gameOver: true, canFlip: false,
            gameMessage: `You win the game in ${newRound} rounds!`,
          };
        }
        return {
          p1Stack, p2Stack, p1Play: [], p2Play: [],
          currentRound: newRound, roundResult: 'win',
          gameOver: false, canFlip: true,
          gameMessage: `Round ${newRound}: Round Won`,
        };
      }

      if (p1Value < p2Value) {
        p2Stack.push(...p2Play, ...p1Play);
        if (p1Stack.length === 0) {
          return {
            p1Stack, p2Stack, p1Play, p2Play,
            currentRound: newRound, roundResult: 'loss',
            gameOver: true, canFlip: false,
            gameMessage: `You lost the game in ${newRound} rounds!`,
          };
        }
        return {
          p1Stack, p2Stack, p1Play: [], p2Play: [],
          currentRound: newRound, roundResult: 'loss',
          gameOver: false, canFlip: true,
          gameMessage: `Round ${newRound}: Round Lost`,
        };
      }

      // WAR
      if (p1Stack.length === 0 || p2Stack.length === 0) {
        return resolveGameEnd(
          { ...state, currentRound: newRound },
          p1Stack, p2Stack, p1Play, p2Play,
        );
      }

      p1Play.push(p1Stack.shift()!);
      p2Play.push(p2Stack.shift()!);

      return {
        p1Stack, p2Stack, p1Play, p2Play,
        currentRound: newRound, roundResult: 'war',
        gameOver: false, canFlip: true,
        gameMessage: `Round ${newRound}: WAR!`,
      };
    }

    case 'SET_MESSAGE':
      return { ...state, gameMessage: action.message };

    default:
      return state;
  }
}

export function useWarGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [gameTimestamp, setGameTimestamp] = useState<string | null>(null);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME', deck: shuffleDeck() });
    setGameTimestamp(null);
  }, []);

  // Returns new state so the caller can act on it (e.g. save game)
  // without needing a useEffect watching gameOver.
  const flipCard = useCallback((): GameState => {
    let resultState = state;
    // We can't read post-dispatch state from useReducer synchronously,
    // so we run the reducer manually to get the next state, then dispatch.
    const nextState = gameReducer(state, { type: 'FLIP_CARD' });
    dispatch({ type: 'FLIP_CARD' });
    resultState = nextState;
    return resultState;
  }, [state]);

  const saveGame = useCallback(
    async (win: boolean, rounds: number): Promise<GameRecord | undefined> => {
      try {
        const res = await postGame(win, rounds);
        setGameTimestamp(res.data.created_at);
        return res.data;
      } catch (err) {
        console.error('Failed to save game:', err);
      }
    },
    [],
  );

  return { state, startGame, flipCard, saveGame, gameTimestamp };
}
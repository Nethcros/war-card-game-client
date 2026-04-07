// src/pages/GamePage.tsx

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWarGame } from '../hooks/useWarGame';
import { setApiToken, setUnauthorizedHandler } from '../services/api';
import { getCardDisplay, getCardSuit } from '../services/cardUtils';

export default function GamePage() {
  const { logout, user, token } = useAuth();
  const { state, startGame, flipCard, saveGame, gameTimestamp } = useWarGame();
  const navigate = useNavigate();

  // Sync token cache + unauthorized handler with router context
  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [logout, navigate]);

  // Flip is a user event, so save is triggered from the handler, not an effect.
  const handleFlip = async () => {
    const nextState = flipCard();
    if (nextState.gameOver) {
      const win = nextState.p1Stack.length > nextState.p2Stack.length;
      await saveGame(win, nextState.currentRound);
    }
  };

  const lastP1Card =
    state.p1Play.length > 0 ? state.p1Play[state.p1Play.length - 1] : null;
  const lastP2Card =
    state.p2Play.length > 0 ? state.p2Play[state.p2Play.length - 1] : null;

  return (
    <div className="game-container">
      <nav>
        <span>Player: {user?.username}</span>
        <Link to="/gamelog">Game Log</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <h1>War!</h1>
      <p className="game-message">{state.gameMessage}</p>
      {gameTimestamp && (
        <p className="timestamp">
          Completed: {new Date(gameTimestamp).toLocaleString()}
        </p>
      )}

      <div className="game-board">
        <div className="player-area">
          <h2>Computer ({state.p2Stack.length} cards)</h2>
          <div className="card-zone">
            {state.p2Stack.length > 0 && (
              <div className="card card-back">🂠</div>
            )}
            {lastP2Card !== null && (
              <div className={`card card-face suit-${getCardSuit(lastP2Card)}`}>
                <span className="card-value">{getCardDisplay(lastP2Card)}</span>
              </div>
            )}
          </div>
          {state.roundResult === 'war' && state.p2Play.length > 1 && (
            <p className="war-indicator">
              +{state.p2Play.length - 1} cards in war pot
            </p>
          )}
        </div>

        <div className="vs">VS</div>

        <div className="player-area">
          <h2>You ({state.p1Stack.length} cards)</h2>
          <div className="card-zone">
            {state.p1Stack.length > 0 && (
              <div
                className={`card card-back ${state.canFlip ? 'clickable' : ''}`}
                onClick={state.canFlip ? handleFlip : undefined}
              >
                🂠
              </div>
            )}
            {lastP1Card !== null && (
              <div className={`card card-face suit-${getCardSuit(lastP1Card)}`}>
                <span className="card-value">{getCardDisplay(lastP1Card)}</span>
              </div>
            )}
          </div>
          {state.roundResult === 'war' && state.p1Play.length > 1 && (
            <p className="war-indicator">
              +{state.p1Play.length - 1} cards in war pot
            </p>
          )}
        </div>
      </div>

      <div className="game-info">
        <p>Round: {state.currentRound}</p>
      </div>

      {(state.gameOver || state.currentRound === 0) && (
        <button className="start-btn" onClick={startGame}>
          {state.gameOver ? 'Play Again' : 'Start Game'}
        </button>
      )}
    </div>
  );
}
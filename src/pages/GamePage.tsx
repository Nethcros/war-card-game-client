import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWarGame } from '../hooks/useWarGame';
import { getCardDisplay, getCardSuit } from '../services/cardUtils';

export default function GamePage() {
  const { logout, user } = useAuth();
  const { state, startGame, flipCard, saveGame, gameTimestamp } = useWarGame();
  const hasSavedRef = useRef<boolean>(false);

  // When game ends, POST result to backend
  useEffect(() => {
    if (state.gameOver && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const win = state.p1Stack.length > state.p2Stack.length;
      saveGame(win, state.currentRound);
    }
    if (!state.gameOver) {
      hasSavedRef.current = false;
    }
  }, [state.gameOver, state.p1Stack.length, state.p2Stack.length, state.currentRound, saveGame]);

  // Last card played by each side (the visible face-up card)
  const lastP1Card =
    state.p1Play.length > 0 ? state.p1Play[state.p1Play.length - 1] : null;
  const lastP2Card =
    state.p2Play.length > 0 ? state.p2Play[state.p2Play.length - 1] : null;

  return (
    <div className="game-container">
      {/* Nav */}
      <nav>
        <span>Player: {user?.username}</span>
        <Link to="/gamelog">Game Log</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <h1>War!</h1>

      {/* GameStateDisplay */}
      <p className="game-message">{state.gameMessage}</p>
      {gameTimestamp && (
        <p className="timestamp">
          Completed: {new Date(gameTimestamp).toLocaleString()}
        </p>
      )}

      {/* Game Board */}
      <div className="game-board">
        {/* Player_2 (Computer) */}
        <div className="player-area">
          <h2>Computer ({state.p2Stack.length} cards)</h2>
          <div className="card-zone">
            {/* CardBack for P2Stack */}
            {state.p2Stack.length > 0 && (
              <div className="card card-back">🂠</div>
            )}
            {/* TopCardDisplay for P2 */}
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

        {/* Player_1 (Student) */}
        <div className="player-area">
          <h2>You ({state.p1Stack.length} cards)</h2>
          <div className="card-zone">
            {/* CardBack for P1Stack — clickable to FlipCard */}
            {state.p1Stack.length > 0 && (
              <div
                className={`card card-back ${state.canFlip ? 'clickable' : ''}`}
                onClick={state.canFlip ? flipCard : undefined}
              >
                🂠
              </div>
            )}
            {/* TopCardDisplay for P1 */}
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

      {/* Round counter */}
      <div className="game-info">
        <p>Round: {state.currentRound}</p>
      </div>

      {/* StartGameButton — visible when game is over or hasn't started */}
      {(state.gameOver || state.currentRound === 0) && (
        <button className="start-btn" onClick={startGame}>
          {state.gameOver ? 'Play Again' : 'Start Game'}
        </button>
      )}
    </div>
  );
}
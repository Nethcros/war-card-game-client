import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGames } from '../services/api';
import type { GameRecord } from '../types';

export default function GamelogPage() {
  const { logout } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getGames()
      .then((res) => setGames(res.data))
      .catch((err) => console.error('Failed to fetch games:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gamelog-container">
      <nav>
        <Link to="/game">Back to Game</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <h1>Game History</h1>

      {loading ? (
        <p>Loading...</p>
      ) : games.length === 0 ? (
        <p>No games played yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Game #</th>
              <th>Result</th>
              <th>Rounds</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.game_id}>
                <td>{game.game_id}</td>
                <td>{game.win ? 'WIN' : 'LOSS'}</td>
                <td>{game.rounds}</td>
                <td>{new Date(game.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
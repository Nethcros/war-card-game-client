// src/App.tsx

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { setApiToken, setUnauthorizedHandler } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import GamelogPage from './pages/GamelogPage';

function AuthSync() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

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

  return null;
}

function NotFound() {
  return (
    <div className="login-container">
      <h1>404</h1>
      <p>Page not found.</p>
      <a href="/login">Go to login</a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthSync />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamelog"
            element={
              <ProtectedRoute>
                <GamelogPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
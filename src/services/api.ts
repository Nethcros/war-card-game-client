import axios from 'axios';
import type { AuthResponse, GameRecord } from '../types';

// Base URL — during dev, Vite proxy forwards /api to your backend
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: auto-redirect to login on 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---- Auth ----
export const registerUser = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/register', { username, password });

export const loginUser = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password });

// ---- Games ----
export const postGame = (win: boolean, rounds: number) =>
  api.post<GameRecord>('/games', { win, rounds });

export const getGames = () =>
  api.get<GameRecord[]>('/games');

export default api;
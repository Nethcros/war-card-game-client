// src/services/api.ts

import axios, { AxiosError } from 'axios';
import type { AuthResponse, GameRecord } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Token cache — avoids localStorage reads on every request.
// Synced manually via setApiToken.
let cachedToken: string | null = localStorage.getItem('token');

export function setApiToken(token: string | null) {
  cachedToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

api.interceptors.request.use((config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

// Store a navigate function injected from the router context.
// Avoids window.location reload on 401.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error instanceof AxiosError &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      setApiToken(null);
      localStorage.removeItem('user');
      if (onUnauthorized) {
        onUnauthorized();
      }
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
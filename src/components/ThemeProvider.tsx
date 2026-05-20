'use client';

import { useEffect } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'alcheque-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light';
    applyTheme(saved);
  }, []);
  return children;
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return ((localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light');
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  // Let interested components update instantly (charts, etc.)
  window.dispatchEvent(new CustomEvent('alcheque-theme', { detail: theme }));
}

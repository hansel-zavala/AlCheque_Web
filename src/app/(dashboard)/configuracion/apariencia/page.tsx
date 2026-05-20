'use client';

import { useEffect, useState } from 'react';
import { MoonStar, Sun } from 'lucide-react';
import { getStoredTheme, setStoredTheme } from '@/components/ThemeProvider';

type Theme = 'light' | 'dark';

export default function AparienciaPage() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Apariencia</h2>
        <p className="text-slate-500 mt-1 text-sm">Cambia el tema del sistema para todas las pantallas.</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 sm:p-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-border flex items-center justify-center">
              {isDark ? <MoonStar size={18} className="text-slate-600" /> : <Sun size={18} className="text-slate-600" />}
            </div>
            <div>
              <p className="font-semibold text-slate-800">Modo oscuro</p>
              <p className="text-sm text-slate-500">Activa o desactiva el tema oscuro.</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={() => {
              const next: Theme = isDark ? 'light' : 'dark';
              setTheme(next);
              setStoredTheme(next);
            }}
            className={
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
              (isDark ? 'bg-brand-600' : 'bg-slate-300')
            }
          >
            <span
              className={
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
                (isDark ? 'translate-x-6' : 'translate-x-1')
              }
            />
            <span className="sr-only">Alternar modo oscuro</span>
          </button>
        </div>
      </div>
    </div>
  );
}

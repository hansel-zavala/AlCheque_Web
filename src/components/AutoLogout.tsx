'use client';

import { useEffect } from 'react';
import { logout } from '@/app/(auth)/login/actions';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos por defecto

export function AutoLogout({ timeoutMs = INACTIVITY_TIMEOUT }: { timeoutMs?: number }) {
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const performLogout = async () => {
      await logout();
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        performLogout();
      }, timeoutMs);
    };

    // Agregar event listeners para detectar actividad
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Iniciar temporizador
    resetTimer();

    return () => {
      // Limpiar al desmontar
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [timeoutMs]);

  return null;
}

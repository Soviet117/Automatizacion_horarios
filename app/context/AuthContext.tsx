'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SessionUser } from '../../lib/types';

// Tiempo de inactividad antes de cerrar sesión (5 minutos en ms)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Eventos del usuario que se consideran "actividad"
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

interface AuthContextType {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
  loading: boolean;
  updateUser: (data: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('optimizer_user');
    // Limpiar el temporizador al cerrar sesión
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    router.push('/login');
  }, [router]);

  // Reinicia el temporizador de inactividad cada vez que hay actividad
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Activa/desactiva los listeners de actividad según si hay sesión
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, limpiar timer y no escuchar eventos
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Iniciar el temporizador al iniciar sesión
    resetInactivityTimer();

    // Escuchar todos los eventos de actividad del usuario
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    return () => {
      // Limpiar listeners al desmontar o cuando el usuario cambie
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('optimizer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const updateUser = useCallback((data: Partial<SessionUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('optimizer_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const login = (newUser: SessionUser) => {
    setUser(newUser);
    localStorage.setItem('optimizer_user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

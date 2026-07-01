import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useActivityFeed } from './ActivityContext';
import { api, ApiError, getStoredAccessToken } from '../services/api';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  authError: string;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  canCreateContent: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { recordActivity } = useActivityFeed();
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api.auth.me()
      .then((me) => {
        if (isMounted) {
          setUser(me);
          setAuthError('');
          recordActivity({
            type: 'auth',
            title: 'Session restored',
            detail: `${me.name} resumed a saved session.`,
          });
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          api.auth.logout();
          setToken(null);
          setUser(null);
        } else {
          setAuthError(error instanceof Error ? error.message : 'Session validation failed.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const updateSession = (response: AuthResponse) => {
    setToken(response.token);
    setUser(response.user);
    setAuthError('');
    recordActivity({
      type: 'auth',
      title: 'Authenticated',
      detail: `${response.user.name} signed in as ${response.user.role}.`,
    });
    return response;
  };

  const login = async (payload: LoginRequest) => {
    setIsSubmitting(true);
    try {
      return updateSession(await api.auth.login(payload));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsSubmitting(true);
    try {
      return updateSession(await api.auth.register(payload));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    const signedOutUserName = user?.name;
    api.auth.logout();
    setToken(null);
    setUser(null);
    setAuthError('');
    recordActivity({
      type: 'auth',
      title: 'Signed out',
      detail: signedOutUserName ? `${signedOutUserName} ended the session.` : 'Session cleared.',
    });
  };

  const canCreateContent = useMemo(() => Boolean(user && ['Admin', 'Project Manager'].includes(user.role as UserRole)), [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    isSubmitting,
    authError,
    login,
    register,
    logout,
    canCreateContent,
  }), [user, token, isLoading, isSubmitting, authError, canCreateContent]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

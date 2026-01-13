import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthReady: boolean;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUser = (supabaseUser: User | null): AuthUser | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: supabaseUser.user_metadata.full_name ?? supabaseUser.email ?? '',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setAuthReady] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(mapUser(data.session?.user ?? null));
      setAuthReady(true);
    };
    bootstrap();
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(mapUser(session?.user ?? null));
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setAuthReady(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loginWithMagicLink = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthReady,
      isLoading,
      loginWithMagicLink,
      loginWithGoogle,
      logout,
    }),
    [isAuthReady, isLoading, loginWithGoogle, loginWithMagicLink, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};



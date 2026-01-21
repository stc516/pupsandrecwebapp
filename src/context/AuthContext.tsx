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

import { supabase, supabaseConfigError, supabaseConfigured } from '../lib/supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  selectedPetId?: string | null;
  onboarding?: {
    completed?: boolean;
    introSeen?: boolean;
    skipped?: boolean;
    lastStepIndex?: number;
    checklist?: {
      petAdded?: boolean;
      avatarUploaded?: boolean;
      activityLogged?: boolean;
      journalWritten?: boolean;
      reminderAdded?: boolean;
    };
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthReady: boolean;
  isLoading: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>; // alias for backward compatibility
  loginWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUser = (supabaseUser: User | null): AuthUser | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: supabaseUser.user_metadata.full_name ?? supabaseUser.email ?? '',
    selectedPetId: supabaseUser.user_metadata?.selectedPetId ?? null,
    onboarding: supabaseUser.user_metadata?.onboarding ?? null,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setAuthReady] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const configErrorMessage = supabaseConfigError ?? 'Supabase is not configured.';

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    const client = supabase;
    let mounted = true;
    const bootstrap = async () => {
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      setUser(mapUser(data.session?.user ?? null));
      setAuthReady(true);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('Auth bootstrap', {
          session: Boolean(data.session),
          expires_at: data.session?.expires_at,
          refresh_token_present: Boolean(data.session?.refresh_token),
        });
      }
    };
    bootstrap();
    const { data: listener } = client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(mapUser(session?.user ?? null));
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setAuthReady(true);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('Auth change', {
          event,
          session: Boolean(session),
          expires_at: session?.expires_at,
          refresh_token_present: Boolean(session?.refresh_token),
        });
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const buildError = (fallback: string, err?: unknown) => {
    if (err instanceof Error) return err.message || fallback;
    return fallback;
  };

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  const sendMagicLink = useCallback(async (email: string) => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        throw new Error(configErrorMessage);
      }
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) {
        throw new Error(error.message || 'Magic link sign-in failed. Check Supabase email settings.');
      }
    } catch (err) {
      throw new Error(buildError('Magic link sign-in failed. Try again.', err));
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        throw new Error(configErrorMessage);
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message || 'Sign in failed. Check your email and password.');
      }
    } catch (err) {
      throw new Error(buildError('Sign in failed. Check your email and password.', err));
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        throw new Error(configErrorMessage);
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw new Error(error.message || 'Sign up failed. Check password requirements.');
      }
    } catch (err) {
      throw new Error(buildError('Sign up failed. Check password requirements.', err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        throw new Error(configErrorMessage);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        throw new Error(
          error.message ||
            'Google sign-in failed. Ensure the Google provider is enabled and redirect URLs are configured in Supabase.',
        );
      }
    } catch (err) {
      throw new Error(
        buildError(
          'Google sign-in failed. Ensure the provider is enabled in Supabase.',
          err,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        setUser(null);
        return;
      }
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
      sendMagicLink,
      loginWithMagicLink: sendMagicLink,
      loginWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      logout,
    }),
    [isAuthReady, isLoading, loginWithGoogle, logout, sendMagicLink, signInWithPassword, signUpWithPassword, user],
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



import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_STORAGE_KEY = 'pups-rec-auth-user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthReady: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const simulateDelay = (duration = 400) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AuthUser;
  } catch (error) {
    console.warn('Failed to read stored auth user', error);
    return null;
  }
};

const persistUser = (value: AuthUser | null) => {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const createMockUser = (email: string): AuthUser => {
  const localPart = email.split('@')[0] ?? 'pupslover';
  const displayName =
    localPart
      .split(/[\.\-_]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
      .trim() || 'Pups Lover';
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `mock-user-${Date.now()}`;
  return {
    id,
    email,
    name: displayName,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setAuthReady] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setAuthReady(true);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setLoading(true);
    try {
      await simulateDelay();
      const normalizedEmail = email.trim().toLowerCase();
      const mockUser = createMockUser(normalizedEmail);
      setUser(mockUser);
      persistUser(mockUser);
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await simulateDelay(250);
      setUser(null);
      persistUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthReady,
      isLoading,
      login,
      logout,
    }),
    [isAuthReady, isLoading, login, logout, user],
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



import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setActionPending(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setActionPending(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setActionPending(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } finally {
      setActionPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setActionPending(true);
    try {
      await signOut(auth);
    } finally {
      setActionPending(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: initializing || actionPending,
      login,
      signup,
      logout,
    }),
    [actionPending, initializing, login, logout, signup, user],
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



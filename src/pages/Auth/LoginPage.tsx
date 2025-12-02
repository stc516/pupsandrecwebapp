import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

type AuthMode = 'signin' | 'signup';

export const LoginPage = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user, login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-subtle to-white px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-brand-primary/10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Pups & Rec</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'signin'
              ? 'Sign in to sync your pet adventures across devices.'
              : 'Sign up to keep your pack in sync everywhere.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-brand-primary/20 focus:border-brand-primary focus:ring-4"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-brand-primary/20 focus:border-brand-primary focus:ring-4"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/60"
          >
            {isLoading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                className="font-semibold text-brand-primary hover:underline"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-brand-primary hover:underline"
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link className="font-medium text-brand-primary hover:underline" to="/">
            Back to app
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;



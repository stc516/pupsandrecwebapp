import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { user, sendMagicLink, loginWithGoogle, signInWithPassword, isLoading, isAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && user) {
      navigate('/');
    }
  }, [isAuthReady, navigate, user]);

  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSent(false);
    try {
      if (mode === 'password') {
        await signInWithPassword(email, password);
        navigate('/');
      } else {
        await sendMagicLink(email);
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-subtle to-white px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-brand-primary/10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Pups & Rec</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to keep your pack in sync across every device.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex gap-2 text-xs font-semibold text-brand-primary/80">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`rounded-full px-3 py-1 ${mode === 'password' ? 'bg-brand-primary text-white' : 'bg-brand-subtle'}`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`rounded-full px-3 py-1 ${mode === 'magic' ? 'bg-brand-primary text-white' : 'bg-brand-subtle'}`}
            >
              Magic Link
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-brand-primary/20 focus:border-brand-primary focus:ring-4"
            />
            <p className="mt-1 text-xs text-text-muted">Use the same email you signed up with.</p>
          </label>

          {mode === 'password' && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-brand-primary/20 focus:border-brand-primary focus:ring-4"
              />
              <p className="mt-1 text-xs text-text-muted">At least 6 characters.</p>
            </label>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {sent ? <p className="text-sm text-emerald-600">Check your email to continue.</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/60"
          >
            {isLoading
              ? mode === 'password'
                ? 'Signing in…'
                : 'Sending magic link…'
              : mode === 'password'
                ? 'Sign in'
                : 'Send magic link'}
          </button>
          {mode === 'magic' && <p className="text-xs text-text-muted">We’ll email you a one-time sign-in link.</p>}

          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await loginWithGoogle();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : 'Google sign-in failed. Ensure the provider is enabled in Supabase.',
                );
              }
            }}
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>
          <p className="text-xs text-text-muted text-center">Google sign-in requires provider enabled in Supabase.</p>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need an account?{' '}
          <Link className="font-semibold text-brand-primary hover:underline" to="/signup">
            Sign up
          </Link>
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



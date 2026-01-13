import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';

export const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { user, loginWithMagicLink, loginWithGoogle, isLoading, isAuthReady } = useAuth();
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
    try {
      await loginWithMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-subtle to-white px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-brand-primary/10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Pups & Rec</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Sync activities and journal entries across every device.</p>
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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {sent ? <p className="text-sm text-emerald-600">Check your email for a magic link.</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/60"
          >
            {isLoading ? 'Sending link…' : 'Send magic link'}
          </button>

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link className="font-semibold text-brand-primary hover:underline" to="/login">
            Sign in
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

export default SignupPage;



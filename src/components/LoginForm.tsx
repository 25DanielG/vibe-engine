'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Mode = 'signin' | 'signup' | 'confirm';

export default function LoginForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const goOnboarding = () => {
    onSignedIn?.();
    navigate('/onboarding');
  };

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setStatus('loading');
    setError(null);

    try {
      await login(email, password);
      goOnboarding();
    } catch (err: any) {
      setError(err?.message ?? 'Sign-in failed');
    } finally {
      setStatus('idle');
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setStatus('loading');
    setError(null);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setStatus('idle');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setStatus('idle');
        return;
      }

      await register(email, password);
      goOnboarding();
    } catch (err: any) {
      setError(err?.message ?? 'Sign-up failed');
    } finally {
      setStatus('idle');
    }
  }

  const heading =
    mode === 'signup'
      ? 'Create Account'
      : 'Sign In';

  const subtext =
    mode === 'signup'
      ? 'Create an account to get started'
      : 'Sign in to your account';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">{heading}</h2>
          <p className="text-sm text-gray-400">{subtext}</p>
        </div>

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-gray-800 border-gray-700 text-white"
                disabled={status === 'loading'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-gray-800 border-gray-700 text-white"
                disabled={status === 'loading'}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={status === 'loading'} className="w-full">
              {status === 'loading' ? 'Signing in…' : 'Sign In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                Don&apos;t have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email2" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email2"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-gray-800 border-gray-700 text-white"
                disabled={status === 'loading'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password2"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-gray-800 border-gray-700 text-white"
                disabled={status === 'loading'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-gray-800 border-gray-700 text-white"
                disabled={status === 'loading'}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={status === 'loading'} className="w-full">
              {status === 'loading' ? 'Creating…' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


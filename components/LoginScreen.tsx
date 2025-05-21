'use client';

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginForm(): ReactElement {
  const [password, setPassword] = useState<string>('');
  const [error, setError]         = useState<string>('');
  const [loading, setLoading]     = useState<boolean>(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const router = useRouter();

  // Fetch CSRF token on mount
  useEffect(() => {
    async function fetchCsrf() {
      try {
        const res = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch CSRF token');
        const data = (await res.json()) as { csrfToken: string };
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
        setError('Security init failed. Please refresh.');
      }
    }
    fetchCsrf();
  }, []);
  
  // Logout handler
  const handleLogout = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      if (res.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!csrfToken) {
      setError('Security token missing. Refresh the page.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type':  'application/json',
          'X-CSRF-Token':   csrfToken
        },
        body: JSON.stringify({ password, csrfToken })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Login failed');
      }
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Try again.';
      console.error('Login error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <Image
            src="/images/airtrex-logo.png"
            alt="Airtrex Logo"
            width={120}
            height={120}
            className="mx-auto"
          />
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !csrfToken}
              className={`group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || !csrfToken
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ml-auto`}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
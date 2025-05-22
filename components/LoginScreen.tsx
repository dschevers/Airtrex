'use client';

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  ReactElement
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginForm(): ReactElement {
  const [password, setPassword]   = useState('');
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const router                    = useRouter();

  const enabledBg = 'bg-[#0033cc]'
  const hoverBg   = 'hover:bg-[#009933]'

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch('/api/auth/csrf', {
      method:      'GET',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch CSRF token');
        return res.json();
      })
      .then((data: { csrfToken: string }) => {
        setCsrfToken(data.csrfToken);
      })
      .catch(() => {
        setError('Security init failed. Please refresh.');
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrfToken) {
      setError('Security token missing. Refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method:      'POST',
        credentials: 'include',
        headers: {
          'Content-Type':  'application/json',
          'X-CSRF-Token':   csrfToken
        },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Login failed');
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
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
            unoptimized
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />

        <button
          type="submit"
          disabled={loading || !csrfToken}
          className={`
            w-full py-2 text-white rounded-md
            ${loading || !csrfToken
              ? 'bg-blue-300 cursor-not-allowed'
              : `${enabledBg} ${hoverBg}`}
          `}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        </form>
      </div>
    </div>
  );
}

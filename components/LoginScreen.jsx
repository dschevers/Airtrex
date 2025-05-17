'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginScreen() {
  const router = useRouter();

  // form state
  const [password, setPassword]       = useState('');
  const [csrfToken, setCsrfToken]     = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  // 1) Fetch & store CSRF token cookie + header value
  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json();
      })
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);

  // 2) Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate', {
        method:      'POST',
        credentials: 'include',          // send the csrf-token cookie
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token':  csrfToken     // send the header
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (response.ok) {
        // on successful auth, redirect to landing page
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // 3) Render
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border-2"
        style={{ borderColor: '#0033cc' }}
      >
        <div className="text-center mb-6">
          <img
            src="/images/airtrex-logo.png"
            alt="Airtrex Logo"
            className="w-40 h-auto mx-auto mb-4"
          />
          <h1
            className="text-2xl font-bold"
            style={{ color: '#0033cc' }}
          >
            Airtrex Forms Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Please enter your password to access the forms
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !csrfToken}
            className="w-full py-2 px-4 text-white font-medium rounded-md transition duration-150"
            style={{ backgroundColor: isLoading ? '#ccc' : '#0033cc' }}
          >
            {isLoading ? 'Verifying...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

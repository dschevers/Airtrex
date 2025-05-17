'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthWrapper({ children }) {
  const [csrfToken, setCsrfToken] = useState('');
  const router = useRouter();

  // 1) Grab a fresh CSRF token on mount
  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json();
      })
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => {
        console.error('Failed to load CSRF token:', err);
      });
  }, []);

  // 2) Logout handler
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method:      'POST',
        credentials: 'include',
        headers: {
          'Content-Type':  'application/json',
          'X-CSRF-Token':   csrfToken
        }
      });

      if (res.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        const err = await res.json().catch(() => null);
        console.error('Logout failed:', err || res.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>
      <div className="bg-gray-100 p-2 text-right">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Log Out
        </button>
      </div>
      {children}
    </div>
  );
}

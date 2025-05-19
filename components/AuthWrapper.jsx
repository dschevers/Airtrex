// components/AuthWrapper.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthWrapper({ children }) {
  const [csrfToken, setCsrfToken] = useState('');
  const router = useRouter();

  // Fetch CSRF token when component mounts
  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json();
      })
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      // Ensure we have a CSRF token before attempting logout
      if (!csrfToken) {
        console.error('CSRF token not available for logout');
        return;
      }

      // Use relative URL instead of absolute
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        }
      });

      if (res.ok) {
        // Force clear the cookie ourselves as well
        document.cookie = "airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict";
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
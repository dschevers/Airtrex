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
    if (!csrfToken) {
      console.error('CSRF token not available for logout');
      return;
    }

    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    });

    if (res.ok) {
      document.cookie = "airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      router.push('/login');
    } else {
      const error = await res.json().catch(() => ({}));
      console.error('Logout failed:', error);
    }
  } catch (err) {
    console.error('Logout error:', err);
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
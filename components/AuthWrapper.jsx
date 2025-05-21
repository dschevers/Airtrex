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
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
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
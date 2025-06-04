'use client';

import React, { useState, useEffect, ReactNode, ReactElement } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import QuickRefDrawer from './QuickRefDrawer';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({
  children,
}: AuthWrapperProps): ReactElement {
  const pathname = usePathname();
  const [csrfToken, setCsrfToken] = useState<string>('');
  const router = useRouter();

  // Always call this hook, but skip fetching when on /login
  useEffect(() => {
    if (pathname === '/login') return;

    fetch('/api/auth/csrf', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json() as Promise<{ csrfToken: string }>;
      })
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((err) => console.error('Failed to fetch CSRF token:', err));
  }, [pathname]);

  // If we're on /login, render children only (no header/buttons)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
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

  const goDashboard = () => {
    router.push('/dashboard');
  };

  const airtrexBlue = '#0033cc';
  const airtrexGreen = '#009933';

  return (
    <div>
      <header className="relative bg-gray-100 h-12 flex items-center px-4">
        <div className="flex justify-between items-center w-full">
          <QuickRefDrawer />

          <button onClick={handleLogout} className="logout">
            Logout
          </button>

          <style jsx global>{`
            .logout {
              background-color: ${airtrexBlue};
              color: white;
              padding: 0.25rem 1rem;
              border-radius: 9999px;
              font-size: 0.875rem;
              z-index: 50;
            }
            .logout:hover {
              background-color: ${airtrexGreen};
            }
          `}</style>
        </div>

        <button
          onClick={goDashboard}
          aria-label="Home"
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center hover:text-gray-900 hover:shadow-lg transition-shadow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9.75L12 3l9 6.75v10.5a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 20.25V9.75z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 22.5V12h6v10.5"
            />
          </svg>
        </button>
      </header>

      {children}
    </div>
  );
}

'use client';

import React, { useState, useEffect, ReactNode, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import QuickRefDrawer from './QuickRefDrawer';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({
  children,
}: AuthWrapperProps): ReactElement {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const router = useRouter();

  // Your brand colors:
  const airtrexBlue = '#0033cc';
  const airtrexGreen = '#009933';

  // Fetch CSRF token when component mounts
  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('CSRF fetch failed');
        return res.json() as Promise<{ csrfToken: string }>;
      })
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((err) => console.error('Failed to fetch CSRF token:', err));
  }, []);

  // Logout handler
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

  return (
    <div>
      {/*
        Header is relative so we can absolutely position Home in its center.
        We fix header height to h-12 (48px) so buttons of height h-8 fit with 8px vertical padding.
      */}
      <header className="relative bg-gray-100 h-12 flex items-center px-4">
        {/*
          Left and right items live in a flex that stretches full width.
          QuickRefDrawer on left; Log Out on right.
        */}
        <div className="flex justify-between items-center w-full">
          {/* Left: QuickRefDrawer trigger (no changes here) */}
          <QuickRefDrawer />

          {/* Right: Logout button—replaced `bg-blue-600` with inline style={ { backgroundColor: airtrexBlue } } */}
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

        {/*
          Home button absolutely centered: top-1/2 / left-1/2, then translate -50% to align perfectly.
          We give it h-8 w-8 so it sits vertically centered inside the h-12 header.
        */}
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

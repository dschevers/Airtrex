// app/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { cookies }        from 'next/headers';
import { redirect }       from 'next/navigation';
import { validateAuthToken } from '../../lib/auth';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('airtrex-auth-token')?.value ?? '';

  const { valid } = await validateAuthToken(token);
  if (!valid) {
    redirect('/login');
  }

  return <>{children}</>;
}
// app/dashboard/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateAuthToken } from '../../lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get('airtrex-auth-token')?.value;
  if (!token) redirect('/login');

  const { valid } = await validateAuthToken(token);
  if (!valid) redirect('/login');

  // Authenticated → render your dashboard UI
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
}

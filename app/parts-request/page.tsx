// app/parts-request/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AirtrexOrderForm from '../../components/AirtrexOrderForm';
import { validateAuthToken } from '../../lib/auth';

export default async function PartsRequestPage() {
  // 1. Await the cookies() call
  const cookieStore = await cookies();
  const token = cookieStore.get('airtrex-auth-token')?.value ?? '';

  // 2. Validate
  const { valid } = await validateAuthToken(token);
  if (!valid) {
    redirect('/login');
  }

  // 3. Return JSX (works now that this is a .tsx file)
  return (
    <main className="p-4 min-h-screen bg-gray-50">
      <AirtrexOrderForm />
    </main>
  );
}

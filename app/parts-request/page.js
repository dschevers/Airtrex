// app/parts-request/page.js
import { redirect } from 'next/navigation';
import AirtrexOrderForm from '../../components/AirtrexOrderForm';
import { validateAuthToken } from '../../lib/auth';

export default async function PartsRequestPage() {
  // Check authentication
  const { valid } = await validateAuthToken();
  
  if (!valid) {
    redirect('/login');
  }
  
  return (
    <main className="p-4 min-h-screen bg-gray-50">
      <AirtrexOrderForm />
    </main>
  );
}
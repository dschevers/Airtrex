// app/page.tsx
import { cookies }          from 'next/headers';
import { redirect }         from 'next/navigation';
import { validateAuthToken } from '../lib/auth';

export default async function HomePage() {
  // 1️⃣ Grab the cookie jar
  const cookieStore = await cookies();
  const token       = cookieStore.get('airtrex-auth-token')?.value ?? '';

  // 2️⃣ Validate it (runs in Node.js here)
  const { valid } = await validateAuthToken(token);

  // 3️⃣ Redirect based on auth state
  if (valid) {
    redirect('/dashboard');
  }
  redirect('/login');
}
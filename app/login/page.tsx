// app/login/page.tsx
import LoginScreen from '../../components/LoginScreen';
import { cookies }  from 'next/headers';
import { redirect } from 'next/navigation';
import { validateAuthToken } from '../../lib/auth';

export default async function LoginPage() {
  // Check session cookie
  const store = await cookies();
  const token = store.get('airtrex-auth-token')?.value;
  if (token) {
    const { valid } = await validateAuthToken(token);
    if (valid) {
      redirect('/dashboard');
    }
  }

  // Unauthenticated → render the login form
  return <LoginScreen />;
}

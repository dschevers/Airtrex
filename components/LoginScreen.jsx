"use client";
import { useState } from 'react';

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Company-specific styling
  const airtrexBlue = "#0033cc";
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // In production - call a secure API endpoint to validate
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        // Authentication successful
        const result = await response.json();
        
        // Store authentication state
        localStorage.setItem('airtrex-auth', 'true');
        // Set expiry time (8 hours from now)
        const expiry = Date.now() + (8 * 60 * 60 * 1000);
        localStorage.setItem('airtrex-auth-expiry', expiry.toString());
        
        // Call the login callback
        onLogin();
      } else {
        // Authentication failed
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    }
    
    setIsLoading(false);
  };
  
  // Logo component
  const AirtrexLogo = () => (
    <img 
      src="/images/airtrex-logo.png" 
      alt="Airtrex Logo" 
      className="w-40 h-auto mx-auto mb-4" 
    />
  );
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border-2" style={{ borderColor: airtrexBlue }}>
        <div className="text-center mb-6">
          <AirtrexLogo />
          <h1 className="text-2xl font-bold" style={{ color: airtrexBlue }}>
            Airtrex Forms Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Please enter your password to access the forms
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 text-white font-medium rounded-md transition duration-150"
            style={{ backgroundColor: isLoading ? '#ccc' : airtrexBlue }}
          >
            {isLoading ? 'Verifying...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
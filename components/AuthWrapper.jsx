"use client";
import { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem('airtrex-auth');
    const expiry = localStorage.getItem('airtrex-auth-expiry');
    
    // Check if authentication is valid and not expired
    if (auth === 'true' && expiry && parseInt(expiry) > Date.now()) {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('airtrex-auth');
    localStorage.removeItem('airtrex-auth-expiry');
    setIsAuthenticated(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
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
};

export default AuthWrapper;
"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Client-side auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();

        if (!res.ok || !data.authenticated) {
          router.push('/login');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return null;

  // Forms config
  const forms = [
    {
      id: 'order-request',
      title: 'Parts Order Request',
      description: 'Submit requests for parts and materials',
      icon: '📦',
      color: '#0033cc',
      path: '/parts-request',
      status: 'active',
    },
    {
      id: 'purchase-order',
      title: 'Purchase Order Form',
      description: 'Create purchase orders for vendors',
      icon: '💰',
      color: '#009933',
      path: '/purchase-order',
      status: 'coming-soon',
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Check and update inventory levels',
      icon: '📊',
      color: '#cc3300',
      path: '/inventory',
      status: 'coming-soon',
    },
  ];

  const handleCardClick = (path: string, isActive: boolean) => {
    if (isActive) {
      router.push(path);
    }
  };

  const AirtrexLogo = () => (
    <Image 
      src="/images/airtrex-logo.png" 
      alt="Airtrex Logo" 
      width={192}
      height={48}
      className="h-auto mb-6" 
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        .card-container {
          will-change: box-shadow, background-color, border-color;
          height: 100%;
          transition: box-shadow 0.3s ease, background-color 0.3s ease;
          transition-delay: 20ms;
        }
        .card-container.active:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background-color: rgba(249, 250, 251, 1);
        }
        .get-started-arrow {
          transition: transform 0.3s ease;
          transition-delay: 20ms;
        }
        .card-container.active:hover .get-started-arrow {
          transform: translateX(4px);
        }
      `}</style>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 sm:p-8 border-2" style={{ borderColor: '#0033cc' }}>
        <div className="text-center mb-10">
          <AirtrexLogo />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Airtrex Forms Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a form to get started
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div 
              key={form.id} 
              className={`
                card-container bg-white rounded-lg border-2 p-6
                ${form.status === 'active' ? 'active cursor-pointer' : 'opacity-70'}
              `}
              style={{ borderColor: form.color }}
              onClick={() => handleCardClick(form.path, form.status === 'active')}
            >
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-full text-2xl mr-4"
                  style={{ backgroundColor: `${form.color}20`, color: form.color }}
                >
                  {form.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{form.title}</h2>
              </div>
              <p className="text-gray-600 mb-6">{form.description}</p>
              {form.status === 'active' ? (
                <div 
                  className="inline-flex items-center text-sm font-medium"
                  style={{ color: form.color }}
                >
                  Get Started
                  <svg className="ml-2 w-4 h-4 get-started-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              ) : (
                <div className="inline-flex items-center text-sm font-medium text-gray-400">
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Airtrex. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// app/page.js - Main landing page for all forms
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Define your forms here - first one links to your existing form
  const forms = [
    {
      id: 'order-request',
      title: 'Parts Order Request',
      description: 'Submit requests for parts and materials',
      icon: '📦',
      color: '#0033cc', // Airtrex blue
      path: '/parts-request', // This should match your route for the existing form
      status: 'active'
    },
    {
      id: 'purchase-order',
      title: 'Purchase Order Form',
      description: 'Create purchase orders for vendors',
      icon: '💰',
      color: '#009933', // Airtrex green
      path: '/purchase-order',
      status: 'coming-soon'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Check and update inventory levels',
      icon: '📊',
      color: '#cc3300', // Complementary red
      path: '/inventory',
      status: 'coming-soon'
    }
  ];

  const handleCardClick = (form:any) => {
    if (form.status === 'active') {
      router.push(form.path);
    }
  };

  // Logo component using the image file
  const AirtrexLogo = () => (
    <img 
      src="/images/airtrex-logo.png" 
      alt="Airtrex Logo" 
      className="w-48 h-auto mb-6" 
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
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
              className={`bg-white border-2 rounded-lg p-6 transition-all duration-300 transform ${
                form.status === 'active' ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : 'opacity-70'
              }`}
              style={{ 
                borderColor: form.color,
                boxShadow: hoveredCard === form.id && form.status === 'active' ? `0 10px 15px -3px ${form.color}30` : 'none'
              }}
              onClick={() => handleCardClick(form)}
              onMouseEnter={() => setHoveredCard(form.id)}
              onMouseLeave={() => setHoveredCard(null)}
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
                  className="inline-flex items-center text-sm font-medium transition-colors duration-300"
                  style={{ color: form.color }}
                >
                  Get Started
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

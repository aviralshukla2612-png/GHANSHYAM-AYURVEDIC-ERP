'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('ghanshyam_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ayurveda-900 text-white">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-bold tracking-wide">Ghanshyam Ayurvedic ERP</h2>
        <p className="text-ayurveda-200 text-sm">Initializing Enterprise Operations...</p>
      </div>
    </div>
  );
}

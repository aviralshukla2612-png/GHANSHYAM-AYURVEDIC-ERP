'use client';

import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-50 text-espresso-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-wine-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-espresso-600 tracking-wider uppercase">Loading Ghanshyam ERP...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#FAF8F5] overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#FAF8F5]">{children}</main>
      </div>
    </div>
  );
}

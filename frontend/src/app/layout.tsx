'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../lib/auth/authContext';
import { useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30000,
        gcTime: 300000,
        retry: 1,
      },
    },
  }));

  return (
    <html lang="en">
      <head>
        <title>Ghanshyam Ayurvedic Pharmacy — Production ERP</title>
        <meta name="description" content="Full Enterprise ERP System for Ghanshyam Ayurvedic Pharmacy" />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

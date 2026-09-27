'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { TrendingUp, Award, DollarSign, Target, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SalesPerformancePage() {
  const { data: salesRes } = useQuery({
    queryKey: ['salesDashboard'],
    queryFn: () => apiClient.get('/api/sales/dashboard'),
  });

  const salesData = (salesRes as any)?.data || {};

  const chartData = [
    { name: 'Kayam Churna', sales: 840000 },
    { name: 'Ayurvedic Cough Syrup', sales: 496000 },
    { name: 'Ayurvedic Hair Oil', sales: 432000 },
    { name: 'Neem Soap', sales: 390000 },
    { name: 'Ayurvedic Pain Oil', sales: 342000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-ayurveda-700" /> Sales Performance & Product Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Performance metrics, monthly revenue targets, B2B vs B2C breakdown, and top-selling Ayurvedic product formulations.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Product Revenue Analytics</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="sales" fill="#1b4332" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import {
  TrendingUp,
  Award,
  DollarSign,
  Target,
  BarChart2,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function SalesPerformancePage() {
  const { data: salesRes } = useQuery({
    queryKey: ['salesDashboard'],
    queryFn: () => apiClient.get('/api/sales/dashboard'),
  });

  const salesData = (salesRes as any)?.data || {};

  const chartData = [
    { name: 'Kayam Churna', sales: 840000, units: 1200, margin: '58%' },
    { name: 'Ayurvedic Cough Syrup', sales: 496000, units: 850, margin: '62%' },
    { name: 'Ayurvedic Hair Oil', sales: 432000, units: 620, margin: '55%' },
    { name: 'Neem Soap', sales: 390000, units: 1500, margin: '48%' },
    { name: 'Ayurvedic Pain Oil', sales: 342000, units: 580, margin: '64%' },
  ];

  const barColors = ['#1A1817', '#5C1D24', '#8C6512', '#78726D', '#B8944D'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl border border-[#EAE5DC] shadow-lg text-xs space-y-1">
          <p className="font-bold text-[#1A1817]">{label}</p>
          <p className="text-[#5C1D24] font-bold font-mono">
            Revenue: ₹{data.sales.toLocaleString('en-IN')}
          </p>
          <p className="text-[#78726D] text-[11px]">
            Volume: <span className="font-semibold text-[#1A1817]">{data.units.toLocaleString()} Units</span> | Margin: <span className="font-semibold text-[#5C1D24]">{data.margin}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            COMMERCIAL PERFORMANCE & FORMULATION ANALYTICS
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#5C1D24]" /> Sales Performance & Product Analytics
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Performance metrics, monthly revenue targets, B2B wholesale distribution, and top-selling Ayurvedic product formulations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#1A1817] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B8944D]" /> FY 2026-27 Active
          </span>
        </div>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Monthly Target Pace</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹{(salesData.monthlySales || 1456000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 92.4% of ₹18L Target Achieved
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Top Revenue Driver</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">Kayam Churna</h3>
          <p className="text-[11px] text-[#8C6512] font-semibold">₹8,40,000 (33.6% Contribution)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Average Order Value</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹58,800</h3>
          <p className="text-[11px] text-[#78726D] font-medium">B2B Wholesale Standard Invoice</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Distributor Growth</span>
          <h3 className="text-2xl font-bold text-[#5C1D24] mt-1">+14.8%</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold">YoY expansion across Gujarat</p>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE5DC] pb-4">
          <div>
            <h3 className="font-bold text-base text-[#1A1817]">Product Formulation Revenue Contribution</h3>
            <p className="text-xs text-[#78726D]">Top 5 commercial manufactured formulations ranked by current period gross sales value.</p>
          </div>
          <span className="text-xs font-semibold text-[#78726D] font-mono">Total Formulation Value: ₹25,00,000</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
              <XAxis dataKey="name" stroke="#78726D" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE5DC' }} />
              <YAxis stroke="#78726D" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE5DC' }} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formulation Performance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <h3 className="font-bold text-sm text-[#1A1817]">Formulation Performance Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#78726D] border-b border-[#EAE5DC] text-[11px] uppercase tracking-wider font-mono">
                <th className="p-3">Product Formulation</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Units Dispatched</th>
                <th className="p-3 text-right">Gross Revenue</th>
                <th className="p-3 text-right">Avg Margin %</th>
                <th className="p-3 text-right">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {chartData.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-3 font-semibold text-[#1A1817] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColors[idx] }}></span>
                    {item.name}
                  </td>
                  <td className="p-3 text-[#78726D]">Ayurvedic Proprietary Medicine</td>
                  <td className="p-3 text-right font-semibold text-[#5A544F]">{item.units.toLocaleString()} Units</td>
                  <td className="p-3 text-right font-bold text-[#1A1817]">₹{item.sales.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-[#5C1D24]">{item.margin}</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                      Top Performer
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

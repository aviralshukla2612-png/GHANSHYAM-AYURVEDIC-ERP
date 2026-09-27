'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { Factory, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';

export default function ProductionRequestsPage() {
  const { data: salesRes } = useQuery({
    queryKey: ['salesDashboard'],
    queryFn: () => apiClient.get('/api/sales/dashboard'),
  });

  const requests = (salesRes as any)?.data?.productionRequests || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Factory className="w-6 h-6 text-ayurveda-700" /> Production Requests Pipeline
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Production requests generated due to finished goods stock shortages during sales order placement.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">Request No</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">BOM Version</th>
                <th className="p-3">Requested Quantity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No production requests generated yet
                  </td>
                </tr>
              ) : (
                requests.map((pr: any) => (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{pr.requestNo}</td>
                    <td className="p-3 font-bold text-gray-800">{pr.product?.name}</td>
                    <td className="p-3 font-mono text-gray-600">{pr.bom?.version || 'v1.0'}</td>
                    <td className="p-3 font-black text-gray-900">{pr.requestedQuantity} units</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                        {pr.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(pr.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

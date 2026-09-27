'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { Layers, ArrowUpRight, ClipboardList, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

export default function RawMaterialRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requestsRes } = useQuery({
    queryKey: ['rmRequests'],
    queryFn: () => apiClient.get('/api/raw-material-requests'),
  });

  const requests = (requestsRes as any)?.data || [];

  const convertPOMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/raw-material-requests/${id}/convert-po`, {}),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['rmRequests'] });
      alert(res.message || 'Purchase Order created successfully!');
    },
    onError: (err: any) => {
      alert(err.message || 'Permission or verification failed');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" /> Raw Material Purchase Requests (Sales Initiated)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Shortage requests initiated by Sales Executives when processing orders. Can be converted to Purchase Orders based on permissions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">Request ID</th>
                <th className="p-3">Linked Sales Order</th>
                <th className="p-3">Requested Raw Materials</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No raw material shortage requests found. Create a Sales Order exceeding available finished stock to generate an automated request.
                  </td>
                </tr>
              ) : (
                requests.map((rm: any) => (
                  <tr key={rm.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{rm.requestNo}</td>
                    <td className="p-3 font-bold text-gray-800">{rm.salesOrder?.orderNumber || 'SO-1024'}</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {rm.items?.map((it: any) => (
                          <div key={it.id} className="font-semibold text-gray-800">
                            {it.rawMaterial?.name}: <span className="text-rose-700 font-bold">Shortage {it.shortageQuantity} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-gray-700">{rm.supplier?.name || 'Saurashtra Herbs & Spices'}</td>
                    <td className="p-3 font-bold text-gray-900">₹{rm.estimatedCost?.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {rm.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10px]">
                        {rm.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {rm.status !== 'ORDERED' && rm.status !== 'RECEIVED' ? (
                        <button
                          onClick={() => convertPOMutation.mutate(rm.id)}
                          disabled={convertPOMutation.isPending}
                          className="px-3 py-1.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Convert to PO
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PO Generated
                        </span>
                      )}
                    </td>
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

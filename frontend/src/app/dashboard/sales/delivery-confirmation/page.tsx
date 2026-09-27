'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';

export default function DeliveryConfirmationPage() {
  const queryClient = useQueryClient();

  const { data: dispatchRes } = useQuery({
    queryKey: ['dispatches'],
    queryFn: () => apiClient.get('/api/dispatch'),
  });

  const dispatches = (dispatchRes as any)?.data || [];

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/dispatch/${id}/deliver`, { customerFeedback: 'Customer confirmed order receipt in pristine condition.' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Customer Delivery Confirmation
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Record customer receipt confirmation, delivery date, feedback, and report shortages/damages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">Dispatch No</th>
                <th className="p-3">Sales Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Delivery Status</th>
                <th className="p-3">Customer Remarks</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No dispatches pending customer confirmation
                  </td>
                </tr>
              ) : (
                dispatches.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{d.dispatchNo}</td>
                    <td className="p-3 font-bold text-gray-800">{d.salesOrder?.orderNumber}</td>
                    <td className="p-3 font-semibold text-gray-800">{d.salesOrder?.customer?.name}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.deliveryConfirmed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {d.deliveryConfirmed ? 'DELIVERY CONFIRMED' : 'PENDING CONFIRMATION'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{d.customerFeedback || 'Awaiting customer feedback call'}</td>
                    <td className="p-3">
                      {!d.deliveryConfirmed && (
                        <button
                          onClick={() => confirmMutation.mutate(d.id)}
                          className="px-3 py-1 bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3" /> Record Customer Confirmation
                        </button>
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

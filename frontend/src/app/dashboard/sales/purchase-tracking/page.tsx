'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { PackageSearch, CheckCircle2, Clock, Truck, ShieldCheck, Factory } from 'lucide-react';

export default function PurchaseTrackingPage() {
  const { data: rmRes } = useQuery({
    queryKey: ['rmRequests'],
    queryFn: () => apiClient.get('/api/raw-material-requests'),
  });

  const requests = (rmRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-ayurveda-700" /> Sales Raw Material Purchase Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time tracking of salesperson-initiated raw material requests from initial order shortage to supplier receipt.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
            No active raw material procurement tracking records.
          </div>
        ) : (
          requests.map((rm: any) => (
            <div key={rm.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Request Ref: {rm.requestNo}</span>
                  <h3 className="text-base font-extrabold text-gray-900">Linked Sales Order: {rm.salesOrder?.orderNumber || 'SO-1024'}</h3>
                  <p className="text-xs text-gray-500">Supplier: <span className="font-bold text-gray-800">{rm.supplier?.name || 'Saurashtra Herbs'}</span> | Est Cost: ₹{rm.estimatedCost?.toLocaleString('en-IN')}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black self-start">
                  Status: {rm.status}
                </span>
              </div>

              {/* Multi-Step Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 text-center text-[11px]">
                {[
                  { step: 'Request Created', icon: Clock, done: true },
                  { step: 'Stock Verified', icon: ShieldCheck, done: true },
                  { step: 'Approved', icon: CheckCircle2, done: rm.status !== 'SUBMITTED' },
                  { step: 'Purchase Ordered', icon: PackageSearch, done: ['ORDERED', 'RECEIVED'].includes(rm.status) },
                  { step: 'In Transit', icon: Truck, done: rm.status === 'ORDERED' },
                  { step: 'Goods Received', icon: CheckCircle2, done: rm.status === 'RECEIVED' },
                  { step: 'Production Available', icon: Factory, done: rm.status === 'RECEIVED' },
                ].map((st, idx) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        st.done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${st.done ? 'text-emerald-700' : 'text-gray-300'}`} />
                      <span className="leading-tight">{st.step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

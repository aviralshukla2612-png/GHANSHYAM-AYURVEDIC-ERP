'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { ListOrdered, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AllOrdersPage() {
  const { data: ordersRes } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => apiClient.get('/api/sales/orders'),
  });

  const orders = (ordersRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-ayurveda-700" /> Sales Orders Registry
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete list of customer orders, lifecycle statuses, and raw-material procurement linkages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">Order No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Order Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Order Date</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No sales orders found
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{o.orderNumber}</td>
                    <td className="p-3 font-bold text-gray-800">{o.customer?.name}</td>
                    <td className="p-3 font-black text-gray-900">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          o.status === 'MATERIAL_REQUIRED'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : o.status === 'PRODUCTION_REQUIRED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : o.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{o.paymentStatus}</td>
                    <td className="p-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/sales/orders/${o.id}`}
                        className="px-3 py-1 bg-ayurveda-700 hover:bg-ayurveda-800 text-white rounded font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        View Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
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

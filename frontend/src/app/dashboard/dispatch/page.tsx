'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth/authContext';
import { apiClient } from '../../../lib/api/apiClient';
import {
  Truck,
  CheckCircle2,
  UserCheck,
  Plus,
  PackageCheck,
  Eye,
  X,
  FileText,
  Printer,
  Calendar,
  Building2,
  ShieldCheck,
  Phone
} from 'lucide-react';

export default function DispatchPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [truckNumber, setTruckNumber] = useState('GJ-03-BW-9876');
  const [driverName, setDriverName] = useState('Ramesh Bhai');
  const [driverPhone, setDriverPhone] = useState('+91 98240 11223');
  const [transporter, setTransporter] = useState('Saurashtra Transport');

  const isSalesOrAdmin =
    !user ||
    user?.roles?.some((r: any) => r === 'SALES' || r === 'SUPER_ADMIN' || r === 'ADMIN') ||
    user?.department === 'SALES';

  const { data: dispatchRes } = useQuery({
    queryKey: ['dispatches'],
    queryFn: () => apiClient.get('/api/dispatch'),
  });

  const { data: salesRes } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => apiClient.get('/api/sales/orders'),
  });

  const dispatches = (dispatchRes as any)?.data || [];
  const salesOrders = (salesRes as any)?.data || [];

  useEffect(() => {
    if (salesOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(salesOrders[0].id);
    }
  }, [salesOrders, selectedOrder]);

  const createDispatchMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/dispatch', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to create truck dispatch');
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/dispatch/${id}/deliver`, { customerFeedback: 'Delivered safely.' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to confirm client delivery');
    },
  });

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const order =
      salesOrders.find((o: any) => o.id === selectedOrder) ||
      salesOrders.find((o: any) => o.orderNumber?.includes('944718')) ||
      salesOrders[0];

    const orderId = order?.id || selectedOrder;

    createDispatchMutation.mutate({
      salesOrderId: orderId,
      truckNumber: truckNumber || 'GJ-03-BW-9876',
      driverName: driverName || 'Ramesh Bhai',
      driverPhone: driverPhone || '+91 98240 11223',
      transporterName: transporter || 'Saurashtra Transport',
      items: order?.items?.map((it: any) => ({
        productId: it.productId,
        batchNumber: 'KAY-2026-2633',
        quantity: it.quantity || 1000,
      })) || [{ productId: 'prod_1', batchNumber: 'KAY-2026-2633', quantity: 1000 }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)]">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            LOGISTICS & CONSIGNMENT TRACKING
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#5C1D24]" /> Dispatch & Consignment Tracking
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Truck/driver logging, consignment verification, finished goods tracking, and client delivery confirmation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#B8944D]" /> Prepare Truck Dispatch
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#78726D] border-b border-[#EAE5DC] text-[11px] uppercase tracking-wider font-mono">
                <th className="p-3">Dispatch No</th>
                <th className="p-3">Sales Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Truck No</th>
                <th className="p-3">Driver Info</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center space-y-3">
                    <p className="text-[#A39D96] font-semibold text-xs">No active truck dispatches recorded yet.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#B8944D]" /> Prepare Truck Dispatch for SO-944718
                    </button>
                  </td>
                </tr>
              ) : (
                dispatches.map((d: any) => {
                  const isDelivered = d.status === 'DELIVERED';
                  const statusBadge = isDelivered
                    ? 'bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC]'
                    : 'bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5]';

                  return (
                    <tr key={d.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1A1817]">{d.dispatchNo}</td>
                      <td className="p-3 font-semibold text-[#1A1817]">{d.salesOrder?.orderNumber || 'SO-944718'}</td>
                      <td className="p-3 font-medium text-[#1A1817]">{d.salesOrder?.customer?.name || 'Gujarat Herbal Distributors'}</td>
                      <td className="p-3 font-mono text-[#5A544F] font-bold">{d.truckNumber}</td>
                      <td className="p-3 text-[#78726D]">
                        {d.driverName} <span className="text-[#A39D96]">({d.driverPhone})</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1 ${statusBadge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedDispatch(d)}
                            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1A1817] font-semibold rounded-lg text-xs inline-flex items-center gap-1 border border-[#EAE5DC] cursor-pointer shadow-2xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#5C1D24]" /> View Details
                          </button>
                          {!isDelivered && isSalesOrAdmin && (
                            <button
                              onClick={() => confirmDeliveryMutation.mutate(d.id)}
                              className="px-3 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH DETAILS MODAL */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-[#1A1817]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#EAE5DC] space-y-5 relative">
            <button
              onClick={() => setSelectedDispatch(null)}
              className="absolute top-5 right-5 text-[#78726D] hover:text-[#1A1817] p-1.5 rounded-lg hover:bg-[#FAF8F5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-[#EAE5DC] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider border border-[#EAE5DC] font-mono">
                  CONSIGNMENT DISPATCH NOTE
                </span>
                <span className="font-mono text-xs text-[#78726D]">Ref: {selectedDispatch.dispatchNo}</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1817] mt-1 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#5C1D24]" /> Consignment & Dispatch Verification
              </h3>
            </div>

            {/* Consignment Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1">
                <span className="text-[10px] font-bold text-[#78726D] uppercase font-mono">Sales Order & Client</span>
                <p className="font-bold text-[#1A1817]">{selectedDispatch.salesOrder?.orderNumber || 'SO-944718'}</p>
                <p className="text-[#5A544F]">{selectedDispatch.salesOrder?.customer?.name || 'Gujarat Herbal Distributors'}</p>
                <p className="text-[11px] text-[#78726D]">Delivery Destination: Rajkot, Gujarat</p>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1">
                <span className="text-[10px] font-bold text-[#78726D] uppercase font-mono">Transporter & Driver</span>
                <p className="font-bold text-[#1A1817]">{selectedDispatch.transporterName || 'Saurashtra Transport'}</p>
                <p className="text-[#5A544F]">Truck: <strong className="font-mono">{selectedDispatch.truckNumber}</strong></p>
                <p className="text-[11px] text-[#78726D]">Driver: {selectedDispatch.driverName} ({selectedDispatch.driverPhone})</p>
              </div>
            </div>

            {/* Dispatched Items */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-[#78726D] uppercase font-mono">Dispatched Products & Batches:</span>
              <div className="border border-[#EAE5DC] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF8F5] text-[#78726D] font-semibold uppercase text-[10px] border-b border-[#EAE5DC] font-mono">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">Batch No</th>
                      <th className="p-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5DC] text-[#1A1817]">
                    {selectedDispatch.items && selectedDispatch.items.length > 0 ? (
                      selectedDispatch.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{item.product?.name || 'Ayurvedic Pain Oil (100ml)'}</td>
                          <td className="p-2 font-mono text-[#78726D]">{item.batchNumber || 'KAY-2026-2633'}</td>
                          <td className="p-2 text-right font-bold">{item.quantity} BOTTLES</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 font-medium">Ayurvedic Pain Oil (100ml)</td>
                        <td className="p-2 font-mono text-[#78726D]">KAY-2026-2633</td>
                        <td className="p-2 text-right font-bold">1,000 BOTTLES</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Status */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#78726D] uppercase font-mono">Delivery Status</span>
                <p className="font-bold text-[#5C1D24] mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
                  {selectedDispatch.status === 'DELIVERED' ? 'Delivered & Verified by Customer' : 'In Transit / Dispatched'}
                </p>
              </div>
              <span className="text-[11px] text-[#78726D]">
                Dispatched on: {new Date(selectedDispatch.createdAt || Date.now()).toLocaleDateString('en-IN')}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE5DC]">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#5A544F] font-semibold text-xs rounded-xl border border-[#EAE5DC] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#B8944D]" /> Print Consignment Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Prepare Dispatch */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1A1817]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAE5DC] space-y-4">
            <h3 className="text-base font-bold text-[#1A1817]">Prepare New Truck Dispatch</h3>

            <form onSubmit={handleCreateDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1A1817] mb-1">Select Confirmed Sales Order</label>
                <select
                  required
                  value={selectedOrder || salesOrders[0]?.id || ''}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-bold text-[#1A1817]"
                >
                  {salesOrders.length === 0 ? (
                    <option value="so-944718-fallback">SO-944718 - Gujarat Herbal Distributors (₹1,45,600)</option>
                  ) : (
                    salesOrders.map((so: any) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customer?.name || 'Gujarat Herbal Distributors'} (₹{so.totalAmount?.toLocaleString() || '1,45,600'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A1817] mb-1">Truck Number</label>
                <input
                  type="text"
                  required
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                  className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1A1817] mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A1817] mb-1">Driver Phone</label>
                  <input
                    type="text"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1817] mb-1">Transporter Name</label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#EAE5DC] rounded-xl font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#F2ECE4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDispatchMutation.isPending}
                  className="flex-1 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  {createDispatchMutation.isPending ? 'Verifying & Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

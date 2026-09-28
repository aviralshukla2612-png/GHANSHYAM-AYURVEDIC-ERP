'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import {
  CheckCircle2,
  Clock,
  ThumbsUp,
  Edit3,
  Truck,
  ShieldCheck,
  Search,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Modal, InfoBlock } from '../../../../components/ui/modal';

export default function DeliveryConfirmationPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispatchForEdit, setSelectedDispatchForEdit] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<'DELIVERED' | 'DISPATCHED' | 'IN_TRANSIT'>('DELIVERED');
  const [editRemarks, setEditRemarks] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { data: dispatchRes } = useQuery({
    queryKey: ['dispatches'],
    queryFn: () => apiClient.get('/api/dispatch'),
  });

  const dispatches = (dispatchRes as any)?.data || [];

  // Quick One-Click Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/dispatch/${id}/deliver`, {
        customerFeedback: 'Customer confirmed order receipt in pristine condition.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      setSuccessToast('✓ Customer Delivery Confirmation recorded successfully!');
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      setErrorToast(err.response?.data?.message || err.message || 'Failed to record delivery');
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  // Edit / Update Dispatch Mutation
  const updateDispatchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/api/dispatch/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      setSelectedDispatchForEdit(null);
      setSuccessToast('✓ Dispatch delivery record updated successfully!');
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      setErrorToast(err.response?.data?.message || err.message || 'Failed to update dispatch record');
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  const handleOpenEdit = (d: any) => {
    setSelectedDispatchForEdit(d);
    setEditStatus(d.status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED');
    setEditRemarks(d.customerFeedback || 'Customer confirmed order receipt in pristine condition.');
    setEditDeliveryDate(
      d.deliveryDate ? new Date(d.deliveryDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
  };

  const handleSaveEdit = () => {
    if (!selectedDispatchForEdit) return;

    updateDispatchMutation.mutate({
      id: selectedDispatchForEdit.id,
      data: {
        status: editStatus,
        deliveryConfirmed: editStatus === 'DELIVERED',
        customerFeedback: editRemarks,
        deliveryDate: editDeliveryDate ? new Date(editDeliveryDate).toISOString() : new Date().toISOString(),
      },
    });
  };

  const filteredDispatches = dispatches.filter((d: any) => {
    const q = searchQuery.toLowerCase();
    return (
      d.dispatchNo?.toLowerCase().includes(q) ||
      d.salesOrder?.orderNumber?.toLowerCase().includes(q) ||
      d.salesOrder?.customer?.name?.toLowerCase().includes(q) ||
      d.truckNumber?.toLowerCase().includes(q) ||
      d.driverName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Last-Mile Logistics & Fulfillment
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <CheckCircle2 className="w-5 h-5 text-[#5C1D24]" /> Customer Delivery Confirmation
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Record customer receipt confirmation, delivery date, feedback, and report shortages or damages.
          </p>
        </div>
      </div>

      {/* TOASTS */}
      {successToast && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#1A1817] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
            {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)} className="text-[#8C857E] hover:text-[#1A1817] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 bg-[#FDF2F4] border border-[#F7D2D9] rounded-xl text-[#8C1D2F] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#8C1D2F]" />
            {errorToast}
          </span>
          <button onClick={() => setErrorToast(null)} className="text-[#8C1D2F] hover:text-[#5C1D24] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Dispatch No, Order, Customer, Truck..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs font-medium text-[#1A1817] focus:outline-none focus:border-[#5C1D24] focus:bg-white"
          />
        </div>
      </div>

      {/* DISPATCHES TABLE */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] border-b border-[#EAE5DC] uppercase text-[11px] font-mono">
                <th className="p-3.5 whitespace-nowrap">Dispatch No</th>
                <th className="p-3.5 whitespace-nowrap">Sales Order</th>
                <th className="p-3.5 whitespace-nowrap">Customer</th>
                <th className="p-3.5 text-center whitespace-nowrap">Delivery Status</th>
                <th className="p-3.5">Customer Remarks</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8C857E] font-medium">
                    No dispatches found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((d: any) => {
                  const isDelivered = d.deliveryConfirmed || d.status === 'DELIVERED';

                  return (
                    <tr key={d.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">{d.dispatchNo}</td>
                      <td className="p-3.5 font-medium text-[#5A544F] whitespace-nowrap">{d.salesOrder?.orderNumber}</td>
                      <td className="p-3.5 font-semibold text-[#1A1817] whitespace-nowrap">{d.salesOrder?.customer?.name}</td>
                      
                      {/* CLEAN NO-WRAP LUXURY STATUS BADGE */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border ${
                            isDelivered
                              ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                              : 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                          }`}
                        >
                          {isDelivered ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24] shrink-0" />
                              <span>DELIVERY CONFIRMED</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-[#B8944D] shrink-0" />
                              <span>PENDING CONFIRMATION</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3.5 text-[#5A544F] max-w-xs">
                        <span className="truncate block">
                          {d.customerFeedback || 'Awaiting customer feedback call'}
                        </span>
                      </td>

                      {/* ACTIONS: ONE-CLICK CONFIRM & EDIT BUTTON */}
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => confirmMutation.mutate(d.id)}
                            disabled={confirmMutation.isPending}
                            className="px-3 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            <ThumbsUp className="w-3 h-3 text-[#D3B878]" /> Confirm Delivery
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d)}
                          className="px-3 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <Edit3 className="w-3 h-3 text-[#B8944D]" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT DELIVERY CONFIRMATION & REMARKS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDispatchForEdit)}
        onClose={() => setSelectedDispatchForEdit(null)}
        category="LOGISTICS MANAGEMENT"
        title={`Edit Delivery: ${selectedDispatchForEdit?.dispatchNo || 'DISP'}`}
        description="Update delivery verification status, customer remarks, and actual delivery date."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedDispatchForEdit(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateDispatchMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8944D]" />
              {updateDispatchMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {selectedDispatchForEdit && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Dispatch No', value: selectedDispatchForEdit.dispatchNo },
                { label: 'Sales Order', value: selectedDispatchForEdit.salesOrder?.orderNumber },
                { label: 'Customer', value: selectedDispatchForEdit.salesOrder?.customer?.name, highlight: true },
                { label: 'Transporter', value: `${selectedDispatchForEdit.transporterName || 'Direct Logistics'} (Truck: ${selectedDispatchForEdit.truckNumber || 'GJ-03-XX-1024'})` },
              ]}
            />

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Delivery Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                >
                  <option value="DELIVERED">✓ DELIVERED (Confirmed by Customer)</option>
                  <option value="DISPATCHED">⏳ DISPATCHED (In Transit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Customer Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Customer received the packages in good condition, seal intact."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <ShieldCheck className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Saving updates will update the official dispatch ledger and sync with accounting revenue recognition.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

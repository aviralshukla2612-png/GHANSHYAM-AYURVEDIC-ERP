'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import { useAuth } from '../../../../lib/auth/authContext';
import Link from 'next/link';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Plus,
  ShieldCheck,
  Check,
  ShieldAlert,
  Clock,
  Boxes
} from 'lucide-react';
import { Modal, InfoBlock } from '../../../../components/ui/modal';

export default function RawMaterialRequestsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSalesOrAdmin = hasRole('SALES') || hasRole('SUPER_ADMIN');

  // Modal States
  const [selectedRequestForPO, setSelectedRequestForPO] = useState<any | null>(null);
  const [createReqModalOpen, setCreateReqModalOpen] = useState(false);
  const [newReqRawMaterialId, setNewReqRawMaterialId] = useState('');
  const [newReqQuantity, setNewReqQuantity] = useState<number>(20);
  const [newReqReason, setNewReqReason] = useState('');

  const { data: requestsRes } = useQuery({
    queryKey: ['rmRequests'],
    queryFn: () => apiClient.get('/api/raw-material-requests'),
  });

  const { data: rawRes } = useQuery({
    queryKey: ['rawMaterialsList'],
    queryFn: () => apiClient.get('/api/raw-materials'),
  });

  const requests = (requestsRes as any)?.data || [];
  const rawMaterials = (rawRes as any)?.data || [];

  // Convert RM Request to Purchase Order Mutation (Sales Executive Only)
  const convertPOMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/raw-material-requests/${id}/convert-po`, {}),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['rmRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchasesList'] });
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      setSelectedRequestForPO(null);
      setSuccessMsg(`✓ Purchase Order ${res.data?.poNumber || 'PO-CREATED'} successfully generated & sent to Supplier!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Permission or verification failed');
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  // Create Direct RM Purchase Request Mutation
  const createReqMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/raw-material-requests', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['rmRequests'] });
      setCreateReqModalOpen(false);
      setSuccessMsg(`✓ Raw Material Request ${res.data?.requestNo || 'RM-REQ'} created successfully!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create request');
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  const handleCreateDirectRequest = () => {
    const selectedMat = rawMaterials.find((r: any) => r.id === newReqRawMaterialId) || rawMaterials[0];
    if (!selectedMat) {
      alert('Please select a raw material');
      return;
    }

    createReqMutation.mutate({
      reason: newReqReason || `Direct Procurement Initiated by Sales Executive (${newReqQuantity} ${selectedMat.unit || 'KG'})`,
      priority: 'HIGH',
      requiredDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      items: [
        {
          rawMaterialId: selectedMat.id,
          requiredQuantity: newReqQuantity,
          availableQuantity: selectedMat.currentStock || 0,
          shortageQuantity: newReqQuantity,
          unit: selectedMat.unit || 'KG',
          estimatedRate: selectedMat.purchasePrice || 120,
        },
      ],
    });
  };

  if (user && !isSalesOrAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[#EAE5DC] shadow-[0_2px_8px_rgba(26,24,23,0.04)] text-center space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-[#FDF2F4] text-[#8C1D2F] border border-[#F7D2D9] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1A1817]">Commercial Payment Restricted to Sales</h2>
        <p className="text-xs text-[#5A544F] leading-relaxed">
          Raw Material Supplier Payment & Purchase Order (PO) creation is managed exclusively by the <strong>Sales Executive</strong> and Commercial Department.
        </p>
        <p className="text-xs text-[#78726D]">
          As <strong>{user?.roles?.[0]}</strong>, you can forward herb deficits and verify incoming deliveries under the Stock & Inventory module.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard/stock"
            className="px-5 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 shadow-xs"
          >
            <Boxes className="w-4 h-4 text-[#B8944D]" /> Go to Stock & Inventory Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Commercial Payment & Fund Clearance
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <Layers className="w-5 h-5 text-[#5C1D24]" /> Raw Material Requisitions & Payment Approval
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Production reports herb deficit → Stock Manager routes payment request here → Sales authorizes payment & issues PO → Bill forwards to Finance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 bg-[#FAF8F5] text-[#5A544F] rounded-xl text-xs font-semibold border border-[#EAE5DC] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B8944D]" />
            Stock Manager Forwarded Queue
          </span>
        </div>
      </div>

      {/* SUCCESS / ERROR TOASTS */}
      {successMsg && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl text-[#1A1817] font-medium text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#8C857E] hover:text-[#1A1817] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-[#FDF2F4] border border-[#F7D2D9] rounded-2xl text-[#8C1D2F] font-medium text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#8C1D2F]" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-[#8C1D2F] hover:text-[#5C1D24] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* REQUESTS TABLE */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#8C857E] font-semibold border-b border-[#EAE5DC] text-[11px] uppercase tracking-wider font-mono">
                <th className="p-3.5 whitespace-nowrap">Request ID</th>
                <th className="p-3.5 whitespace-nowrap">Linked Order / Batch</th>
                <th className="p-3.5">Herbal Material & Shortage</th>
                <th className="p-3.5 whitespace-nowrap">Supplier</th>
                <th className="p-3.5 whitespace-nowrap">Est. Cost</th>
                <th className="p-3.5 whitespace-nowrap">Priority</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#8C857E] font-medium">
                    No pending payment requests. Production shortages forwarded by Stock Manager will appear here for commercial authorization.
                  </td>
                </tr>
              ) : (
                requests.map((rm: any) => (
                  <tr key={rm.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">
                      {rm.requestNo}
                    </td>
                    <td className="p-3.5 font-medium text-[#5A544F] whitespace-nowrap">
                      {rm.salesOrder?.orderNumber || 'Production Shortage'}
                    </td>
                    <td className="p-3.5 min-w-[240px]">
                      <div className="space-y-1.5">
                        {rm.items?.map((it: any) => (
                          <div key={it.id} className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#1A1817]">{it.rawMaterial?.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-[#FDF2F4] border border-[#F7D2D9] text-[#8C1D2F] font-mono text-[11px] font-semibold whitespace-nowrap">
                              Shortage: {it.shortageQuantity} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-[#5A544F] whitespace-nowrap">
                      {rm.supplier?.name || 'Saurashtra Herbs & Spices'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">
                      ₹{Number(rm.estimatedCost || 1200).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#5A544F] font-mono font-semibold text-[10px] uppercase border border-[#EAE5DC]">
                        {rm.priority}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {rm.status === 'ORDERED' ? (
                        <span className="px-2.5 py-1 rounded-full font-medium text-[11px] bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> PO Sent to Supplier
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full font-medium text-[11px] bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5] inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#B8944D]" /> Awaiting Sales Payment
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {rm.status !== 'ORDERED' && rm.status !== 'RECEIVED' ? (
                        <button
                          onClick={() => setSelectedRequestForPO(rm)}
                          className="px-3.5 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#B8944D]" />
                          Pay & Issue PO
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#78726D] border border-[#EAE5DC] text-xs font-medium inline-flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#5C1D24]" />
                          Bill Recorded in Finance
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

      {/* ========================================================================= */}
      {/* MODAL 1: BUY RAW MATERIAL / CREATE PURCHASE ORDER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedRequestForPO)}
        onClose={() => setSelectedRequestForPO(null)}
        category="SALES COMMERCIAL APPROVAL"
        title="Approve Payment & Issue Purchase Order"
        description="Verify supplier details, commercial pricing, and generate the official Purchase Order."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedRequestForPO(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => convertPOMutation.mutate(selectedRequestForPO.id)}
              disabled={convertPOMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#B8944D]" />
              {convertPOMutation.isPending ? 'Generating PO...' : 'Approve Payment & Issue PO'}
            </button>
          </>
        }
      >
        {selectedRequestForPO && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Requisition ID', value: selectedRequestForPO.requestNo },
                { label: 'Supplier', value: selectedRequestForPO.supplier?.name || 'Saurashtra Herbs & Spices' },
                {
                  label: 'Herbal Ingredient',
                  value: selectedRequestForPO.items?.[0]?.rawMaterial?.name || 'Herbal Ingredient',
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Order Quantity',
                  value: `${selectedRequestForPO.items?.[0]?.shortageQuantity || selectedRequestForPO.items?.[0]?.requiredQuantity || 10} ${selectedRequestForPO.items?.[0]?.unit || 'KG'}`,
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Est. Unit Price',
                  value: `₹${selectedRequestForPO.items?.[0]?.rawMaterial?.purchasePrice || 120}/KG`,
                },
                {
                  label: 'Estimated Cost',
                  value: `₹${Number(selectedRequestForPO.estimatedCost || 1200).toLocaleString('en-IN')}`,
                  highlight: true,
                  highlightColor: 'wine',
                },
              ]}
            />

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <ShieldCheck className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Issuing this Purchase Order will record a supplier liability bill for Finance & CA and alert the warehouse Stock Manager for Goods Inward.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DIRECT PURCHASE REQUISITION CREATOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createReqModalOpen}
        onClose={() => setCreateReqModalOpen(false)}
        category="PROCUREMENT MANAGEMENT"
        title="Create Direct Purchase Requisition"
        description="Initiate a raw material procurement requisition directly from the commercial department."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateReqModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateDirectRequest}
              disabled={createReqMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {createReqMutation.isPending ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
              Herbal Raw Material
            </label>
            <select
              value={newReqRawMaterialId}
              onChange={(e) => setNewReqRawMaterialId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
            >
              {rawMaterials.map((rm: any) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name} ({rm.sku}) — In Stock: {rm.currentStock} {rm.unit} (₹{rm.purchasePrice}/{rm.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
              Procurement Quantity (KG / Liters)
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={newReqQuantity}
              onChange={(e) => setNewReqQuantity(Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
              Procurement Notes / Justification
            </label>
            <input
              type="text"
              value={newReqReason}
              onChange={(e) => setNewReqReason(e.target.value)}
              placeholder="e.g. Replenishing botanical stock for upcoming manufacturing schedule"
              className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

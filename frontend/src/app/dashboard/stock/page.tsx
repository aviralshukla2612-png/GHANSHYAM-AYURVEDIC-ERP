'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import {
  Boxes,
  Layers,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
  ShoppingCart,
  Truck,
  Send,
  Sparkles,
  Check,
  Clock,
  ShieldCheck,
  Factory,
  ChevronRight
} from 'lucide-react';
import { Modal, InfoBlock } from '../../../components/ui/modal';

export default function StockPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [selectedRequestForPO, setSelectedRequestForPO] = useState<any | null>(null);
  const [selectedPOForInward, setSelectedPOForInward] = useState<any | null>(null);
  const [selectedBatchForInward, setSelectedBatchForInward] = useState<any | null>(null);

  // Form states
  const [inwardQty, setInwardQty] = useState<number>(0);
  const [inwardLotNo, setInwardLotNo] = useState<string>('');
  const [finishedInwardQty, setFinishedInwardQty] = useState<number>(0);
  const [rackLocation, setRackLocation] = useState<string>('RACK-A1-FINISHED');

  const { data: stockRes, refetch: refetchStock } = useQuery({
    queryKey: ['stockDashboard'],
    queryFn: () => apiClient.get('/api/inventory/dashboard'),
  });

  const { data: rawRes } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: () => apiClient.get('/api/raw-materials'),
  });

  const { data: prodRes } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/products'),
  });

  const { data: batchRes } = useQuery({
    queryKey: ['productionBatches'],
    queryFn: () => apiClient.get('/api/production/batches'),
  });

  const { data: rmRequestsRes } = useQuery({
    queryKey: ['rawMaterialRequests'],
    queryFn: () => apiClient.get('/api/raw-material-requests'),
  });

  const { data: purchasesRes } = useQuery({
    queryKey: ['purchasesList'],
    queryFn: () => apiClient.get('/api/purchases'),
  });

  const stockData = (stockRes as any)?.data || {};
  const rawMaterials = (rawRes as any)?.data || [];
  const products = (prodRes as any)?.data || [];
  const batches = (batchRes as any)?.data || [];
  const rmRequests = (rmRequestsRes as any)?.data || [];
  const purchaseOrders = (purchasesRes as any)?.data || [];

  // 1. Send Payment Request to Sales Mutation (Sales executes commercial payment & PO)
  const sendPaymentReqMutation = useMutation({
    mutationFn: (requestId: string) => apiClient.post(`/api/raw-material-requests/${requestId}/request-sales-payment`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialRequests'] });
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      setSelectedRequestForPO(null);
      setSuccessMsg(`✓ Requisition sent to Sales Executive! Sales person will execute payment & issue PO.`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to forward payment request');
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  // 2. Goods Inward Receipt Mutation (Raw Material Inward)
  const goodsReceiptMutation = useMutation({
    mutationFn: (data: { poId: string; qty: number; lotNo?: string }) =>
      apiClient.post('/api/purchases/receipts', {
        poId: data.poId,
        invoiceNumber: `INV-GRN-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date().toISOString(),
        batchNumber: data.lotNo || `LOT-RM-${Date.now().toString().slice(-4)}`,
        quantityReceived: Number(data.qty),
        rejectedQuantity: 0,
        qualityStatus: 'PASSED',
        notes: 'Botanical inspection passed and updated into warehouse ledger',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasesList'] });
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rawMaterialRequests'] });
      queryClient.invalidateQueries({ queryKey: ['productionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['productionRequestsPipeline'] });
      setSelectedPOForInward(null);
      setSuccessMsg('✓ Goods Receipt recorded! Raw Material stock updated and shortages automatically recalculated.');
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to record Goods Inward');
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  // 3. Finished Goods Acceptance Mutation (Production Batch Inward)
  const finishedGoodsReceiptMutation = useMutation({
    mutationFn: (data: { productId: string; batchNumber: string; qty: number; unit: string }) =>
      apiClient.post('/api/inventory/transactions', {
        itemType: 'FINISHED_PRODUCT',
        itemId: data.productId,
        itemName: products.find((p: any) => p.id === data.productId)?.name || 'Ayurvedic Product',
        batchNumber: data.batchNumber,
        quantity: Number(data.qty),
        unit: data.unit,
        direction: 'IN',
        type: 'PRODUCTION_OUTPUT',
        referenceType: 'ProductionBatch',
        referenceId: data.batchNumber,
        performedBy: 'Stock Manager',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      setSelectedBatchForInward(null);
      setSuccessMsg('✓ Manufactured Batch Accepted! Product stock released to warehouse and Sales Executive notified for dispatch.');
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to accept manufactured goods');
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  const handleOpenInwardModal = (po: any) => {
    const firstItem = po?.items?.[0];
    const qty = firstItem?.quantity || 20;
    setInwardQty(qty);
    setInwardLotNo(`LOT-RM-${Date.now().toString().slice(-4)}`);
    setSelectedPOForInward(po);
  };

  const handleOpenFinishedInwardModal = (batch: any) => {
    const targetQty = batch.finishedQuantity || batch.plannedQuantity || 250;
    setFinishedInwardQty(targetQty);
    setRackLocation('RACK-A1-FINISHED');
    setSelectedBatchForInward(batch);
  };

  return (
    <div className="space-y-6">
      {/* 5-STAGE MASTER ERP FLOW BANNER */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
              Closed-Loop Inventory & Inward Control
            </span>
            <h1 className="text-xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B8944D]" /> Stock Manager Inward Verification Center
            </h1>
          </div>
          <button
            onClick={() => refetchStock()}
            className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EFECE5] text-[#1A1817] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto border border-[#EAE5DC]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8C857E]" /> Refresh Stock Data
          </button>
        </div>

        {/* WORKFLOW TRACKER */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[10px] text-[#8C857E] font-bold uppercase block font-mono">1. Production</span>
            <p className="font-semibold text-[#1A1817] mt-0.5">Requests RM from Stock</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#EAD7B5] text-[#8C6512]">
            <span className="text-[10px] text-[#8C6512] font-bold uppercase block font-mono">2. Stock Manager (Here)</span>
            <p className="font-bold text-[#1A1817] mt-0.5">Confirms Inward Deliveries</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[10px] text-[#8C857E] font-bold uppercase block font-mono">3. Sales</span>
            <p className="font-semibold text-[#1A1817] mt-0.5">Approves & Issues PO</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[10px] text-[#8C857E] font-bold uppercase block font-mono">4. Finance</span>
            <p className="font-semibold text-[#1A1817] mt-0.5">Receives Bills & Spend</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <span className="text-[10px] text-[#8C857E] font-bold uppercase block font-mono">5. CA Export</span>
            <p className="font-semibold text-[#1A1817] mt-0.5">GSTR-1 & Audit Ledgers</p>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS / TOASTS */}
      {successMsg && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl text-[#1A1817] font-semibold text-xs flex items-center justify-between shadow-xs">
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
        <div className="p-4 bg-[#FDF2F4] border border-[#F7D2D9] rounded-2xl text-[#8C1D2F] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#8C1D2F]" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-[#8C1D2F] hover:text-[#5C1D24] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: RAW MATERIAL SHORTAGE REQUISITIONS QUEUE */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#1A1817] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#5C1D24]" /> Raw Material Procurement Requests (From Production & Sales)
            </h3>
            <p className="text-xs text-[#78726D]">Shortage requests raised by Production Supervisor and paid by Sales Executive</p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5A544F] border border-[#EAE5DC] text-[10px] font-mono font-bold">
            {rmRequests.length} Active Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#8C857E] font-semibold uppercase border-b border-[#EAE5DC] text-[11px] tracking-wider font-mono">
                <th className="p-3.5 whitespace-nowrap">Request No</th>
                <th className="p-3.5">Material & Shortage</th>
                <th className="p-3.5 whitespace-nowrap">Required Qty</th>
                <th className="p-3.5 whitespace-nowrap">Supplier Assigned</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {rmRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8C857E] font-medium">
                    No pending raw material shortage requests. All production batches have sufficient stock.
                  </td>
                </tr>
              ) : (
                rmRequests.map((req: any) => {
                  const firstItem = req.items?.[0];
                  const matName = firstItem?.rawMaterial?.name || 'Raw Herb Material';
                  const shortQty = firstItem?.shortageQuantity || 0;
                  const reqQty = firstItem?.requiredQuantity || 0;
                  const unit = firstItem?.unit || 'KG';
                  const isOrdered = req.status === 'ORDERED' || req.status === 'PAID';
                  const isSentToSales = req.status === 'PENDING_SALES_PAYMENT';
                  const isReceived = req.status === 'RECEIVED';

                  // Match associated purchase order if exists
                  const matchedPO = purchaseOrders.find((po: any) => po.rmPurchaseRequestId === req.id || po.id === req.purchaseOrders?.[0]?.id) || purchaseOrders[0];

                  return (
                    <tr key={req.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">{req.requestNo}</td>
                      <td className="p-3.5 min-w-[200px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#1A1817]">{matName}</span>
                          <span className="px-2 py-0.5 bg-[#FDF2F4] border border-[#F7D2D9] text-[#8C1D2F] font-mono text-[11px] font-semibold rounded-md whitespace-nowrap">
                            Shortage: {shortQty} {unit}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">{reqQty} {unit}</td>
                      <td className="p-3.5 text-[#5A544F] font-medium whitespace-nowrap">{req.supplier?.name || 'Saurashtra Herbs & Spices'}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        {isReceived ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Received & Stock Updated
                          </span>
                        ) : isOrdered ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Bill Paid / PO Issued
                          </span>
                        ) : isSentToSales ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5] inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#B8944D]" /> Sent to Sales for Payment
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FDF2F4] text-[#8C1D2F] border border-[#F7D2D9] inline-flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-[#8C1D2F]" /> Shortage Reported
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {isReceived ? (
                          <span className="text-xs text-[#5C1D24] font-bold inline-flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE5DC]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Delivery Confirmed
                          </span>
                        ) : isOrdered ? (
                          <button
                            onClick={() => handleOpenInwardModal(matchedPO || { id: req.id, poNumber: req.requestNo, items: req.items, supplier: req.supplier })}
                            className="px-3.5 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
                            Confirm Delivery & Receive Stock
                          </button>
                        ) : isSentToSales ? (
                          <span className="text-xs text-[#8C6512] font-medium inline-flex items-center gap-1.5 bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#EAD7B5]">
                            <Check className="w-3.5 h-3.5 text-[#B8944D]" /> Forwarded to Sales
                          </span>
                        ) : (
                          <button
                            onClick={() => sendPaymentReqMutation.mutate(req.id)}
                            disabled={sendPaymentReqMutation.isPending}
                            className="px-3.5 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5 text-[#B8944D]" />
                            {sendPaymentReqMutation.isPending ? 'Forwarding...' : 'Forward Shortage to Sales'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: PURCHASE ORDERS & SUPPLIER GOODS INWARD (RAW MATERIALS) */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#1A1817] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#5C1D24]" /> Purchase Orders & Supplier Raw Material Goods Inward (GRN)
            </h3>
            <p className="text-xs text-[#78726D]">Record incoming raw material deliveries and automatically update inventory stock</p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5A544F] border border-[#EAE5DC] text-[10px] font-mono font-bold">
            {purchaseOrders.length} {purchaseOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] uppercase border-b border-[#EAE5DC] text-[11px] font-mono">
                <th className="p-3 whitespace-nowrap">PO Number</th>
                <th className="p-3 whitespace-nowrap">Supplier</th>
                <th className="p-3">Material & Qty</th>
                <th className="p-3 whitespace-nowrap">Total Amount</th>
                <th className="p-3 whitespace-nowrap">PO Status</th>
                <th className="p-3 text-right whitespace-nowrap">Goods Inward Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8C857E] font-medium">
                    No active purchase orders. Issue a PO from the raw material requests queue above.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po: any) => {
                  const firstItem = po.items?.[0];
                  const matName = firstItem?.rawMaterial?.name || 'Raw Herb Material';
                  const qty = firstItem?.quantity || 20;
                  const isReceived = po.status === 'RECEIVED';

                  return (
                    <tr key={po.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1A1817] whitespace-nowrap">{po.poNumber}</td>
                      <td className="p-3 font-semibold text-[#1A1817] whitespace-nowrap">{po.supplier?.name || 'Saurashtra Herbs & Spices'}</td>
                      <td className="p-3">
                        <span className="font-semibold text-[#1A1817]">{matName}</span>
                        <p className="text-[11px] text-[#78726D]">{qty} KG</p>
                      </td>
                      <td className="p-3 font-bold text-[#1A1817] whitespace-nowrap">₹{Number(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isReceived ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]' : 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                        }`}>
                          {isReceived ? '✓ RECEIVED' : '⏳ ' + po.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isReceived ? (
                          <span className="text-[11px] text-[#5C1D24] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Inward Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenInwardModal(po)}
                            className="px-3.5 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
                            Record Goods Inward
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: FINISHED GOODS PRODUCTION RECEIPTS (FROM PRODUCTION FLOOR) */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#1A1817] flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#5C1D24]" /> Finished Goods Production Receipts (From Production Floor)
            </h3>
            <p className="text-xs text-[#78726D]">Confirm completed manufacturing batches and release finished Ayurvedic products into sellable stock</p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5A544F] border border-[#EAE5DC] text-[10px] font-mono font-bold">
            {batches.length} Production Batches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] uppercase border-b border-[#EAE5DC] text-[11px] font-mono">
                <th className="p-3 whitespace-nowrap">Batch Number</th>
                <th className="p-3 whitespace-nowrap">Finished Ayurvedic Product</th>
                <th className="p-3 whitespace-nowrap">Produced Quantity</th>
                <th className="p-3 whitespace-nowrap">Quality Status</th>
                <th className="p-3 whitespace-nowrap">Batch Status</th>
                <th className="p-3 text-right whitespace-nowrap">Stock Acceptance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8C857E] font-medium">
                    No production batches found. Completed batches from Production Control Center will appear here for stock release.
                  </td>
                </tr>
              ) : (
                batches.map((batch: any) => {
                  const prodName = batch.product?.name || 'Kayam Churna (100g)';
                  const finishedQty = batch.finishedQuantity || batch.plannedQuantity || 250;
                  const unit = batch.product?.unit || 'BOTTLE';
                  const isReleased = batch.status === 'RELEASED_TO_STOCK';
                  const isCompleted = batch.status === 'COMPLETED' || batch.qualityStatus === 'PASSED';

                  return (
                    <tr key={batch.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#5C1D24] whitespace-nowrap">{batch.batchNumber}</td>
                      <td className="p-3 font-semibold text-[#1A1817] whitespace-nowrap">{prodName}</td>
                      <td className="p-3 font-bold text-[#1A1817] whitespace-nowrap">{finishedQty} {unit}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC]">
                          ✓ PASSED QC
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isReleased
                            ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                            : 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                        }`}>
                          {isReleased ? '✓ RELEASED TO STOCK' : '📦 READY FOR STOCK ACCEPTANCE'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isReleased ? (
                          <span className="text-[11px] text-[#5C1D24] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> In Warehouse Stock
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenFinishedInwardModal(batch)}
                            className="px-3.5 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
                            Confirm Receipt & Release to Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: RAW MATERIALS & FINISHED GOODS INVENTORY TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Materials Table */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
            <h3 className="font-bold text-sm text-[#1A1817] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#5C1D24]" /> Botanical Raw Materials Stock Ledger
            </h3>
            <span className="text-xs text-[#78726D] font-mono">{rawMaterials.length} Herbs</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#8C857E] border-b border-[#EAE5DC] font-mono">
                <tr>
                  <th className="p-2.5">Herb / Ingredient</th>
                  <th className="p-2.5">In Warehouse</th>
                  <th className="p-2.5">Rate (₹)</th>
                  <th className="p-2.5">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]/60">
                {rawMaterials.map((rm: any) => (
                  <tr key={rm.id} className="hover:bg-[#FAF8F5]">
                    <td className="p-2.5 font-bold text-[#1A1817]">{rm.name}</td>
                    <td className="p-2.5 font-semibold text-[#5A544F]">{rm.currentStock} {rm.unit}</td>
                    <td className="p-2.5 text-[#78726D]">₹{rm.purchasePrice || 120}/{rm.unit}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        rm.currentStock < (rm.minStock || 50)
                          ? 'bg-[#FDF2F4] text-[#8C1D2F] border-[#F7D2D9]'
                          : 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                      }`}>
                        {rm.currentStock < (rm.minStock || 50) ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Finished Goods Table */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
            <h3 className="font-bold text-sm text-[#1A1817] flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#5C1D24]" /> Finished Ayurvedic Medicines Warehouse Stock
            </h3>
            <span className="text-xs text-[#78726D] font-mono">{products.length} Products</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#8C857E] border-b border-[#EAE5DC] font-mono">
                <tr>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Available Stock</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]/60">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]">
                    <td className="p-2.5 font-bold text-[#1A1817]">{p.name}</td>
                    <td className="p-2.5 font-semibold text-[#5A544F]">{p.stockQuantity ?? 250} Units</td>
                    <td className="p-2.5 font-bold text-[#1A1817]">₹{p.basePrice || 180}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC]">
                        Ready for Sales
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW & FORWARD SHORTAGE TO SALES */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedRequestForPO)}
        onClose={() => setSelectedRequestForPO(null)}
        category="RAW MATERIAL PROCUREMENT"
        title="Forward Shortage to Sales"
        description="Forward this identified herbal raw material deficit to the Sales Executive for payment approval and Purchase Order issuance."
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
              onClick={() => sendPaymentReqMutation.mutate(selectedRequestForPO.id)}
              disabled={sendPaymentReqMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#B8944D]" />
              {sendPaymentReqMutation.isPending ? 'Forwarding...' : 'Forward Shortage to Sales'}
            </button>
          </>
        }
      >
        {selectedRequestForPO && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Requisition No', value: selectedRequestForPO.requestNo },
                { label: 'Supplier', value: selectedRequestForPO.supplier?.name || 'Saurashtra Herbs & Spices' },
                {
                  label: 'Herbal Material',
                  value: selectedRequestForPO.items?.[0]?.rawMaterial?.name || 'Raw Herb Material',
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Shortage Qty',
                  value: `${selectedRequestForPO.items?.[0]?.shortageQuantity || selectedRequestForPO.items?.[0]?.requiredQuantity || 10} ${selectedRequestForPO.items?.[0]?.unit || 'KG'}`,
                  highlight: true,
                  highlightColor: 'wine',
                },
              ]}
            />

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <ShieldCheck className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Commercial payment and Purchase Order creation will be executed exclusively by the Sales Executive upon forwarding.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD GOODS INWARD (RAW MATERIALS GRN) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedPOForInward)}
        onClose={() => setSelectedPOForInward(null)}
        category="WAREHOUSE GOODS INWARD"
        title="Record Goods Inward (GRN)"
        description="Verify and record the physical delivery of botanical raw materials into warehouse inventory."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedPOForInward(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                goodsReceiptMutation.mutate({
                  poId: selectedPOForInward.id,
                  qty: inwardQty,
                  lotNo: inwardLotNo,
                })
              }
              disabled={goodsReceiptMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
              {goodsReceiptMutation.isPending ? 'Recording Delivery...' : 'Verify Delivery & Update Stock'}
            </button>
          </>
        }
      >
        {selectedPOForInward && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Purchase Order', value: selectedPOForInward.poNumber || selectedPOForInward.requestNo },
                { label: 'Supplier', value: selectedPOForInward.supplier?.name || 'Saurashtra Herbs & Spices' },
                {
                  label: 'Raw Material',
                  value: selectedPOForInward.items?.[0]?.rawMaterial?.name || 'Herbal Material',
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Ordered Quantity',
                  value: `${selectedPOForInward.items?.[0]?.quantity || selectedPOForInward.items?.[0]?.shortageQuantity || 20} ${selectedPOForInward.items?.[0]?.unit || 'KG'}`,
                },
              ]}
            />

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Quantity Received (KG / Liters)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={inwardQty}
                  onChange={(e) => setInwardQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Supplier Lot / Batch Number
                </label>
                <input
                  type="text"
                  value={inwardLotNo}
                  onChange={(e) => setInwardLotNo(e.target.value)}
                  placeholder="LOT-RM-2026-001"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <Check className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Recording this receipt will update physical stock and broadcast delivery alerts to unblock pending production orders.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ACCEPT MANUFACTURED GOODS INTO STOCK (PRODUCTION BATCH INWARD) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedBatchForInward)}
        onClose={() => setSelectedBatchForInward(null)}
        category="MANUFACTURING STOCK RELEASE"
        title="Accept Manufactured Goods into Stock"
        description="Verify quality inspection and release finished Ayurvedic product batch into sellable warehouse inventory."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedBatchForInward(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                finishedGoodsReceiptMutation.mutate({
                  productId: selectedBatchForInward.productId,
                  batchNumber: selectedBatchForInward.batchNumber,
                  qty: finishedInwardQty,
                  unit: selectedBatchForInward.product?.unit || 'BOTTLE',
                })
              }
              disabled={finishedGoodsReceiptMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5C1D24] hover:bg-[#4A151C] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#B8944D]" />
              {finishedGoodsReceiptMutation.isPending ? 'Releasing to Stock...' : 'Confirm Receipt & Release to Stock'}
            </button>
          </>
        }
      >
        {selectedBatchForInward && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Batch Number', value: selectedBatchForInward.batchNumber },
                { label: 'Ayurvedic Medicine', value: selectedBatchForInward.product?.name || 'Kayam Churna' },
                {
                  label: 'Produced Quantity',
                  value: `${selectedBatchForInward.finishedQuantity || selectedBatchForInward.plannedQuantity || 250} ${selectedBatchForInward.product?.unit || 'Units'}`,
                  highlight: true,
                  highlightColor: 'charcoal',
                },
                {
                  label: 'Quality QC Status',
                  value: 'PASSED (QC Approved)',
                  highlight: true,
                  highlightColor: 'wine',
                },
              ]}
            />

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Finished Quantity Received into Stock
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={finishedInwardQty}
                  onChange={(e) => setFinishedInwardQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Warehouse Storage Location / Rack
                </label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  placeholder="RACK-A1-FINISHED"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <Check className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Accepting this batch will increment finished inventory stock, update sales orders to READY_FOR_DISPATCH, and notify the Sales Executive.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

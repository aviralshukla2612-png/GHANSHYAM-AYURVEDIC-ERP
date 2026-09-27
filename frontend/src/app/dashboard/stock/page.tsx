'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import {
  Boxes,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  History,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
  ShoppingCart,
  Factory,
  Truck,
  Calculator,
  Send,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function StockPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const stockData = (stockRes as any)?.data || {};
  const rawMaterials = (rawRes as any)?.data || [];
  const products = (prodRes as any)?.data || [];
  const batches = (batchRes as any)?.data || [];
  const transactions = stockData.recentTransactions || [];

  // Finished production batches awaiting Stock Manager acceptance
  const pendingInwardBatches = batches.filter((b: any) => b.status === 'QC_PASSED' || b.status === 'COMPLETED');

  // Accept Batch into Stock Mutation
  const acceptBatchMutation = useMutation({
    mutationFn: (batch: any) => {
      const targetProduct = batch.product || products.find((p: any) => p.id === batch.productId) || products[0];
      const qty = batch.finishedQuantity || batch.plannedQuantity || batch.productionOrder?.plannedQuantity || 1000;
      return apiClient.post('/api/inventory/transactions', {
        itemType: 'FINISHED_PRODUCT',
        itemId: targetProduct?.id || batch.productId || products[0]?.id,
        itemName: targetProduct?.name || batch.productName || 'Ayurvedic Pain Oil',
        batchNumber: batch.batchNumber,
        quantity: Number(qty),
        unit: targetProduct?.unit || 'Bottles',
        direction: 'IN',
        type: 'PRODUCTION_RECEIPT',
        performedBy: 'Stock Manager (Inventory Control)',
      });
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['stockDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSuccessMsg(`✓ Batch ${variables.batchNumber} accepted into Finished Goods Stock! Order ready for Sales Dispatch.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    },
  });

  return (
    <div className="space-y-6">
      {/* 5-STAGE MASTER ERP FLOW BANNER */}
      <div className="bg-gradient-to-r from-ayurveda-950 via-ayurveda-900 to-ayurveda-850 p-6 rounded-2xl text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ayurveda-700/60 pb-4">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-gold-400/20 text-gold-300 text-[10px] font-black uppercase tracking-wider border border-gold-400/30">
              Closed-Loop ERP Master Process Flow
            </span>
            <h1 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" /> Sales → Production → Stock Manager → Sales → Finance
            </h1>
          </div>
          <button
            onClick={() => refetchStock()}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Stock Data
          </button>
        </div>

        {/* Visual 5-Stage Step Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <Link href="/dashboard/sales" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 space-y-1 transition-all">
            <div className="flex items-center justify-between text-gold-300 font-bold text-[10px]">
              <span>STAGE 1</span>
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <p className="font-extrabold text-white text-xs">1. Sales Order</p>
            <p className="text-[10px] text-gray-300">Creates 100/500 pcs order & triggers stock check</p>
          </Link>

          <Link href="/dashboard/production" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 space-y-1 transition-all">
            <div className="flex items-center justify-between text-gold-300 font-bold text-[10px]">
              <span>STAGE 2</span>
              <Factory className="w-3.5 h-3.5" />
            </div>
            <p className="font-extrabold text-white text-xs">2. Production</p>
            <p className="text-[10px] text-gray-300">Schedules batch, BOM check, QC inspection</p>
          </Link>

          <div className="p-3 bg-gold-500/20 border-2 border-gold-400 rounded-xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-gold-300 font-bold text-[10px]">
              <span>STAGE 3 (ACTIVE)</span>
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <p className="font-extrabold text-gold-200 text-xs">3. Stock Manager</p>
            <p className="text-[10px] text-gold-100/90">Accepts finished batch into inventory</p>
          </div>

          <Link href="/dashboard/dispatch" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 space-y-1 transition-all">
            <div className="flex items-center justify-between text-gold-300 font-bold text-[10px]">
              <span>STAGE 4</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <p className="font-extrabold text-white text-xs">4. Sales Dispatch</p>
            <p className="text-[10px] text-gray-300">Logs truck/driver & confirms delivery</p>
          </Link>

          <Link href="/dashboard/accounting" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 space-y-1 transition-all">
            <div className="flex items-center justify-between text-gold-300 font-bold text-[10px]">
              <span>STAGE 5</span>
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <p className="font-extrabold text-white text-xs">5. Finance & CA</p>
            <p className="text-[10px] text-gray-300">Auto GSTR-1 Table 4 & WhatsApp send</p>
          </Link>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center justify-between shadow-md">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-black">
            ✕
          </button>
        </div>
      )}

      {/* PRODUCTION BATCH INWARD ACCEPTANCE QUEUE (STAGE 3 INTERACTION) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-ayurveda-700" /> Finished Goods Inward Queue (From Production)
            </h3>
            <p className="text-xs text-gray-500">QC-passed batches waiting for Stock Manager physical acceptance into store</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
            {pendingInwardBatches.length} {pendingInwardBatches.length === 1 ? 'Batch' : 'Batches'} Ready for Acceptance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 uppercase border-b">
                <th className="p-3">Batch No</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Batch Yield</th>
                <th className="p-3">QC Status</th>
                <th className="p-3">Completed Date</th>
                <th className="p-3 text-right">Stock Manager Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingInwardBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-semibold">
                    ✓ No pending production batches waiting for inward acceptance. All finished goods are up to date in stock inventory.
                  </td>
                </tr>
              ) : (
                pendingInwardBatches.map((b: any) => {
                  const prodName = b.product?.name || b.productName || 'Ayurvedic Pain Oil';
                  const qty = b.finishedQuantity || b.plannedQuantity || b.productionOrder?.plannedQuantity || 1000;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-ayurveda-900">{b.batchNumber}</td>
                      <td className="p-3 font-bold text-gray-800">{prodName}</td>
                      <td className="p-3 font-black text-gray-900">{qty} Units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          ✓ {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(b.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => acceptBatchMutation.mutate(b)}
                          disabled={acceptBatchMutation.isPending}
                          className="px-3.5 py-1.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
                          {acceptBatchMutation.isPending ? 'Accepting...' : 'Accept into Finished Stock'}
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

      {/* Raw Materials & Finished Goods Inventory Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Materials Table */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" /> Raw Materials Master Inventory
            </h3>
            <span className="text-xs text-gray-500 font-semibold">{rawMaterials.length} Items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 font-bold text-gray-500 border-b">
                  <th className="p-2.5">Material</th>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawMaterials.map((rm: any) => (
                  <tr key={rm.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-bold text-gray-800">{rm.name}</td>
                    <td className="p-2.5 font-mono text-gray-500">{rm.sku}</td>
                    <td className="p-2.5 text-gray-600">{rm.category?.name}</td>
                    <td className="p-2.5 font-extrabold text-ayurveda-900">
                      {rm.currentStock} {rm.unit}
                    </td>
                    <td className="p-2.5">
                      {rm.currentStock <= rm.minStock ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Finished Goods Inventory Table */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-ayurveda-700" /> Finished Goods Stock
            </h3>
            <span className="text-xs text-gray-500 font-semibold">{products.length} Products</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 font-bold text-gray-500 border-b">
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5">Pack</th>
                  <th className="p-2.5">B2B Price</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-bold text-gray-800">{p.name}</td>
                    <td className="p-2.5 font-mono text-gray-500">{p.sku}</td>
                    <td className="p-2.5 text-gray-600">{p.packSize}</td>
                    <td className="p-2.5 font-bold text-gray-900">₹{p.b2bPrice}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        READY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Immutable Inventory Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-ayurveda-700" /> Immutable Stock Ledger Transactions
            </h3>
            <p className="text-xs text-gray-500">Every stock movement creates a permanent audit record</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 uppercase border-b">
                <th className="p-3">Txn ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    No ledger transactions recorded yet. Start a production batch or purchase receipt.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{tx.transactionId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px] font-bold border">
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{tx.itemName}</td>
                    <td className="p-3 font-mono text-gray-500">{tx.batchNumber || 'N/A'}</td>
                    <td className="p-3 font-bold text-gray-900">
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="p-3">
                      {tx.direction === 'IN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                          <ArrowDownLeft className="w-3 h-3" /> IN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px]">
                          <ArrowUpRight className="w-3 h-3" /> OUT
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{tx.performedBy || 'System'}</td>
                    <td className="p-3 text-gray-400">{new Date(tx.timestamp).toLocaleString()}</td>
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

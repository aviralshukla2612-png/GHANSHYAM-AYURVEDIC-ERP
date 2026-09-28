'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api/apiClient';
import {
  Factory,
  AlertTriangle,
  ShoppingCart,
  Layers,
  Play,
  Check,
  Plus,
  Scale,
  Boxes,
  Beaker,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Modal, InfoBlock } from '../../../../components/ui/modal';

export default function ProductionRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Production Requirement Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planProductId, setPlanProductId] = useState('');
  const [inputMode, setInputMode] = useState<'UNITS' | 'KG'>('UNITS');
  const [planUnits, setPlanUnits] = useState<number>(350);
  const [planKg, setPlanKg] = useState<number>(35);
  const [planNotes, setPlanNotes] = useState('');

  const { data: requestsRes } = useQuery({
    queryKey: ['productionRequestsPipeline'],
    queryFn: () => apiClient.get('/api/production/requests'),
  });

  const { data: productsRes } = useQuery({
    queryKey: ['productsList'],
    queryFn: () => apiClient.get('/api/products'),
  });

  const { data: bomsRes } = useQuery({
    queryKey: ['bomsList'],
    queryFn: () => apiClient.get('/api/bom'),
  });

  const requests = (requestsRes as any)?.data || [];
  const products = (productsRes as any)?.data || [];
  const boms = (bomsRes as any)?.data || [];

  // Selected Product and BOM for custom planning
  const activeProduct = useMemo(() => {
    return products.find((p: any) => p.id === planProductId) || products[0] || null;
  }, [products, planProductId]);

  const activeBom = useMemo(() => {
    if (!activeProduct) return null;
    return boms.find((b: any) => b.productId === activeProduct.id && b.isActive) ||
           boms.find((b: any) => b.productId === activeProduct.id) || null;
  }, [boms, activeProduct]);

  // Pack size helper (in KG per unit, default 0.1 KG for 100g)
  const unitWeightKg = useMemo(() => {
    if (!activeProduct) return 0.1;
    const name = activeProduct.name.toLowerCase();
    if (name.includes('500g') || name.includes('500 gm') || name.includes('500 g')) return 0.5;
    if (name.includes('1kg') || name.includes('1 kg') || name.includes('1000g')) return 1.0;
    if (name.includes('250g') || name.includes('250 gm')) return 0.25;
    if (name.includes('50g') || name.includes('50 gm')) return 0.05;
    return 0.1;
  }, [activeProduct]);

  // Handle Input Mode Changes
  const handleUnitsChange = (val: number) => {
    setPlanUnits(val);
    setPlanKg(Number((val * unitWeightKg).toFixed(2)));
  };

  const handleKgChange = (val: number) => {
    setPlanKg(val);
    const calculatedUnits = unitWeightKg > 0 ? Math.round(val / unitWeightKg) : val * 10;
    setPlanUnits(calculatedUnits);
  };

  // Live BOM Requirement Calculator for custom planning
  const liveBomBreakdown = useMemo(() => {
    if (!activeBom || !activeBom.bomItems) return [];
    const yieldQty = activeBom.expectedYield || 100;
    const factor = (planUnits || 0) / yieldQty;

    return activeBom.bomItems.map((item: any) => {
      const reqQty = Number((item.quantity * factor).toFixed(2));
      const avail = Number(item.rawMaterial?.currentStock || 0);
      const short = Math.max(0, reqQty - avail);
      return {
        rawMaterialId: item.rawMaterialId,
        name: item.rawMaterial?.name || 'Herbal Raw Material',
        unit: item.unit || item.rawMaterial?.unit || 'KG',
        requiredQuantity: reqQty,
        availableQuantity: avail,
        shortageQuantity: Number(short.toFixed(2)),
        isShortage: short > 0,
      };
    });
  }, [activeBom, planUnits]);

  const planHasShortage = liveBomBreakdown.some((item) => item.isShortage);

  // Mutation: Create Direct Production Plan
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/production/requests', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['productionRequestsPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      setPlanModalOpen(false);
      setSuccessMsg(res.data?.message || `✓ Production Requirement for ${planUnits} units of ${activeProduct?.name} created successfully!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to create Production Requirement');
    },
  });

  // Mutation: Request Missing Raw Material from Stock Manager
  const requestMaterialMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/raw-material-requests', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['productionRequestsPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      setSelectedReq(null);
      setSuccessMsg(`✓ Raw Material Request ${res.data?.requestNo || 'RM-REQ'} created & sent to Stock Manager!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to create Raw Material Request');
    },
  });

  // Mutation: Schedule / Start Production Order
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/production/orders', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['productionRequestsPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      setSuccessMsg(`✓ Production Order ${res.data?.productionOrderNo || ''} created & ready for execution!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to schedule production order');
    },
  });

  const handleRequestMaterial = (pr: any, shortItems: any[]) => {
    const items = shortItems.map((it) => ({
      rawMaterialId: it.rawMaterialId,
      requiredQuantity: it.requiredQuantity,
      availableQuantity: it.availableQuantity,
      shortageQuantity: it.shortageQuantity,
      unit: it.unit || 'KG',
      estimatedRate: 120,
    }));

    requestMaterialMutation.mutate({
      productionRequestId: pr.id,
      salesOrderId: pr.salesOrderId,
      reason: `Shortage for Production Request ${pr.requestNo} (${pr.product?.name})`,
      requiredDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      items,
    });
  };

  const handleScheduleBatch = (pr: any) => {
    createOrderMutation.mutate({
      productId: pr.productId,
      bomId: pr.bomId,
      productionRequestId: pr.id,
      plannedQuantity: pr.requestedQuantity,
      startDate: new Date().toISOString(),
      expectedCompletion: new Date(Date.now() + 86400000).toISOString(),
      supervisor: 'Production Supervisor',
      machine: 'LINE_1 (Grinding & Filling)',
    });
  };

  const handleSubmitPlan = () => {
    if (!activeProduct) {
      alert('Please select a product');
      return;
    }
    if (!planUnits || planUnits <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    createPlanMutation.mutate({
      productId: activeProduct.id,
      bomId: activeBom?.id,
      requestedQuantity: planUnits,
      notes: planNotes || `Manual Production Plan: ${planUnits} units (${planKg} KG total yield)`,
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Shop Floor Requisition Engine
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1">
            <Factory className="w-5 h-5 text-[#5C1D24]" /> Production Requests Pipeline
          </h1>
          <p className="text-xs text-[#78726D] mt-0.5">
            Plan production by Units or KG, inspect live BOM ingredient shortages, and coordinate with Stock Manager.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (products.length > 0 && !planProductId) {
                setPlanProductId(products[0].id);
              }
              setPlanModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#B8944D]" /> Add Product Requirement (KG / Units)
          </button>

          <Link
            href="/dashboard/production"
            className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EFECE5] text-[#1A1817] font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-[#EAE5DC]"
          >
            <Layers className="w-4 h-4 text-[#5C1D24]" /> Open Production Floor
          </Link>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {successMsg && (
        <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#1A1817] font-semibold text-xs flex items-center justify-between shadow-xs">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#8C857E] hover:text-[#1A1817] font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* PIPELINE TABLE */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
          <h3 className="text-sm font-bold text-[#1A1817] flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#5C1D24]" /> Active Production Queue & Requisitions ({requests.length})
          </h3>
          <button
            onClick={() => {
              if (products.length > 0 && !planProductId) {
                setPlanProductId(products[0].id);
              }
              setPlanModalOpen(true);
            }}
            className="text-xs font-semibold text-[#5C1D24] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] font-semibold text-[#8C857E] border-b border-[#EAE5DC] uppercase text-[11px] font-mono">
                <th className="p-3.5 whitespace-nowrap">Request No</th>
                <th className="p-3.5 whitespace-nowrap">Product Name</th>
                <th className="p-3.5 whitespace-nowrap">Quantity</th>
                <th className="p-3.5">BOM Material Status</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 whitespace-nowrap">Created Date</th>
                <th className="p-3.5 text-right whitespace-nowrap">Production Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]/60">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8C857E] font-medium">
                    No production requests in queue. Click <strong>"Add Product Requirement"</strong> to plan a batch.
                  </td>
                </tr>
              ) : (
                requests.map((pr: any) => {
                  const bomItems = pr.bom?.bomItems || [];
                  const yieldQty = pr.bom?.expectedYield || 100;
                  const factor = pr.requestedQuantity / yieldQty;

                  const breakdown = bomItems.map((bItem: any) => {
                    const reqQty = Number((bItem.quantity * factor).toFixed(2));
                    const avail = Number(bItem.rawMaterial?.currentStock || 0);
                    const short = Math.max(0, reqQty - avail);
                    return {
                      rawMaterialId: bItem.rawMaterialId,
                      name: bItem.rawMaterial?.name || 'Raw Material',
                      unit: bItem.unit || bItem.rawMaterial?.unit || 'KG',
                      requiredQuantity: reqQty,
                      availableQuantity: avail,
                      shortageQuantity: Number(short.toFixed(2)),
                    };
                  });

                  const shortItems = breakdown.filter((it: any) => it.shortageQuantity > 0);
                  const hasShortage = shortItems.length > 0;
                  const hasActiveRMRequest = pr.rmPurchaseRequests && pr.rmPurchaseRequests.length > 0;

                  return (
                    <tr key={pr.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#1A1817] whitespace-nowrap">{pr.requestNo}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-semibold text-[#1A1817]">{pr.product?.name}</span>
                        <p className="text-[10px] text-[#78726D] font-mono">BOM: {pr.bom?.version || 'v1.0'}</p>
                      </td>
                      <td className="p-3.5 font-bold text-[#1A1817] whitespace-nowrap">
                        {pr.requestedQuantity} units
                        <span className="block text-[10px] text-[#78726D] font-normal">
                          (~{(pr.requestedQuantity * 0.1).toFixed(1)} KG yield)
                        </span>
                      </td>
                      
                      {/* BOM MATERIAL STATUS */}
                      <td className="p-3.5 min-w-[200px]">
                        {hasShortage ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2F4] text-[#8C1D2F] font-bold text-[10px] border border-[#F7D2D9]">
                              <AlertTriangle className="w-3 h-3 text-[#8C1D2F]" /> Shortage: {shortItems.length} {shortItems.length === 1 ? 'herb' : 'herbs'}
                            </span>
                            <p className="text-[10px] text-[#8C1D2F] font-medium">
                              {shortItems.map((s: any) => `${s.name}: -${s.shortageQuantity} ${s.unit}`).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#5C1D24] font-bold text-[10px] border border-[#EAE5DC]">
                            <Check className="w-3 h-3 text-[#5C1D24]" /> All Materials Available
                          </span>
                        )}
                      </td>

                      {/* WORKFLOW STATUS */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          pr.status === 'READY_FOR_PRODUCTION' || pr.status === 'MATERIALS_AVAILABLE'
                            ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                            : pr.status === 'IN_PRODUCTION' || pr.status === 'BATCH_SCHEDULED'
                            ? 'bg-[#FAF8F5] text-[#1A1817] border-[#EAE5DC]'
                            : 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                        }`}>
                          {pr.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-[#5A544F] font-medium whitespace-nowrap">{new Date(pr.createdAt).toLocaleDateString()}</td>

                      {/* ACTIONS */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {hasShortage ? (
                          hasActiveRMRequest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#5A544F] font-medium text-[10px] border border-[#EAE5DC]">
                              <ShoppingCart className="w-3 h-3 text-[#5C1D24]" /> Request Sent to Stock
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedReq({ pr, shortItems })}
                              className="px-3 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-[#B8944D]" /> Request Raw Material
                            </button>
                          )
                        ) : pr.status === 'IN_PRODUCTION' || pr.status === 'BATCH_SCHEDULED' ? (
                          <Link
                            href="/dashboard/production"
                            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFECE5] text-[#1A1817] font-semibold rounded-xl text-xs inline-flex items-center gap-1 border border-[#EAE5DC]"
                          >
                            View Floor Batch
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleScheduleBatch(pr)}
                            disabled={createOrderMutation.isPending}
                            className="px-3 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            <Play className="w-3.5 h-3.5 text-[#B8944D] fill-[#B8944D]" /> Start Batch
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

      {/* ========================================================================= */}
      {/* MODAL 1: ADD PRODUCT & KG REQUIREMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        category="MANUFACTURING BATCH PLANNER"
        title="Add Product Production Requirement"
        description="Configure target finished medicine units or bulk herbal batch weight in KG to calculate bill of materials."
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPlanModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitPlan}
              disabled={createPlanMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-[#B8944D]" />
              {createPlanMutation.isPending ? 'Planning Batch...' : 'Confirm Production Requirement'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
              Select Ayurvedic Formulation / Product
            </label>
            <select
              value={planProductId || (activeProduct?.id || '')}
              onChange={(e) => setPlanProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
            >
              {products.map((p: any) => {
                const name = p.name.toLowerCase();
                const form = name.includes('oil') || name.includes('taila')
                  ? 'Classical Taila (Medicated Herbal Oil)'
                  : name.includes('syrup') || name.includes('asava')
                  ? 'Herbal Asava / Syrup'
                  : name.includes('tablet') || name.includes('vati')
                  ? 'Herbal Vati / Tablets'
                  : name.includes('soap')
                  ? 'Botanical Ayurvedic Soap'
                  : 'Classical Herbal Churna (Powder)';
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {form}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Unit Mode Switcher: Units vs Total KG */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#1A1817] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5 text-[#5C1D24]" /> Output Mode:
              </label>
              <div className="flex items-center bg-white border border-[#EAE5DC] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setInputMode('UNITS')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    inputMode === 'UNITS'
                      ? 'bg-[#1A1817] text-white shadow-2xs'
                      : 'text-[#5A544F] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Finished Units
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('KG')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    inputMode === 'KG'
                      ? 'bg-[#1A1817] text-white shadow-2xs'
                      : 'text-[#5A544F] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Herbal Weight (KG)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Finished Product Units
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={planUnits || ''}
                    onChange={(e) => handleUnitsChange(Number(e.target.value))}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#8C857E]">
                    Units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Total Herb Batch Weight (KG)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={planKg || ''}
                    onChange={(e) => handleKgChange(Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#8C857E]">
                    KG
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#5A544F] font-medium">
              Formulation standard: <strong>{(unitWeightKg * 1000).toFixed(0)}g per finished unit</strong>. Mixing <strong>{planKg} KG</strong> of raw herbs will produce <strong>{planUnits} units</strong> of finished medicine.
            </p>
          </div>

          {/* LIVE BOM RECIPE & RAW MATERIAL INVENTORY BREAKDOWN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Beaker className="w-3.5 h-3.5 text-[#5C1D24]" /> Botanical Formula & Required Raw Herbs:
              </label>
              <span className="text-[10px] text-[#78726D] font-mono">
                BOM: {activeBom?.version || 'v1.0'}
              </span>
            </div>

            <div className="border border-[#EAE5DC] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#8C857E] font-semibold border-b border-[#EAE5DC] text-[10px] uppercase font-mono">
                  <tr>
                    <th className="p-2.5">Herbal Raw Material</th>
                    <th className="p-2.5">Required For Batch</th>
                    <th className="p-2.5">In Raw Herb Warehouse</th>
                    <th className="p-2.5 text-right">Shortage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DC]/50 bg-white">
                  {liveBomBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-[#78726D]">
                        No herbal BOM configuration found for this formulation.
                      </td>
                    </tr>
                  ) : (
                    liveBomBreakdown.map((item: any) => (
                      <tr key={item.rawMaterialId} className="hover:bg-[#FAF8F5]">
                        <td className="p-2.5 font-semibold text-[#1A1817]">
                          {item.name}
                        </td>
                        <td className="p-2.5 font-bold text-[#1A1817]">
                          {item.requiredQuantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-[#5A544F]">
                          {item.availableQuantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-right">
                          {item.isShortage ? (
                            <span className="px-2 py-0.5 bg-[#FDF2F4] text-[#8C1D2F] border border-[#F7D2D9] rounded-md font-mono font-bold text-[10px]">
                              Shortage: {item.shortageQuantity} {item.unit}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] rounded-md font-semibold text-[10px]">
                              ✓ In Stock
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

          {/* Status Alert */}
          {planHasShortage ? (
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs text-[#1A1817] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B8944D] shrink-0 mt-0.5" />
              <span>
                <strong>Material Shortage Detected:</strong> Creating this requirement will place it in <code>MATERIAL_SHORTAGE</code> so you can instantly send a purchase requisition to the Stock Manager.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs text-[#1A1817] flex items-start gap-2">
              <Check className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                <strong>All Raw Materials Available:</strong> This batch can immediately be marked <code>READY_FOR_PRODUCTION</code> and launched on the production floor.
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RAW MATERIAL REQUISITION CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        category="PRODUCTION REQUISITION"
        title="Request Raw Material from Stock"
        description="Create an official material requisition for botanical shortages identified in this production batch."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedReq(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleRequestMaterial(selectedReq.pr, selectedReq.shortItems)}
              disabled={requestMaterialMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#B8944D]" />
              {requestMaterialMutation.isPending ? 'Sending Requisition...' : 'Request Material'}
            </button>
          </>
        }
      >
        {selectedReq && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'Production Request', value: selectedReq.pr.requestNo },
                {
                  label: 'Target Product',
                  value: `${selectedReq.pr.product?.name} (${selectedReq.pr.requestedQuantity} units)`,
                },
              ]}
            />

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#8C857E] uppercase tracking-wider block font-mono">
                Identified Herb Shortages (Calculated from BOM)
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedReq.shortItems.map((item: any) => (
                  <div
                    key={item.rawMaterialId}
                    className="p-3 bg-white border border-[#EAE5DC] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#1A1817]">{item.name}</p>
                      <p className="text-[11px] text-[#78726D]">
                        Required: {item.requiredQuantity} {item.unit} • In Stock: {item.availableQuantity} {item.unit}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FDF2F4] border border-[#F7D2D9] text-[#8C1D2F] font-mono font-bold text-xs rounded-md">
                      Shortage: {item.shortageQuantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2 text-xs text-[#5A544F]">
              <Info className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Submitting this requisition will alert the <strong>Stock Manager</strong> to review warehouse supply and forward payment requests to Sales.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

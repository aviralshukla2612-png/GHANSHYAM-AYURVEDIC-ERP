'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import {
  PackageCheck,
  Layers,
  Edit,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Modal, InfoBlock } from '../../../components/ui/modal';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editB2bPrice, setEditB2bPrice] = useState<number>(0);
  const [editDistributorPrice, setEditDistributorPrice] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(50);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { data: prodRes } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/products'),
  });

  const products = (prodRes as any)?.data || [];

  // Edit Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/api/products/${id}`, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductForEdit(null);
      setSuccessToast(`✓ Product "${res.data?.name || 'Item'}" updated successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      setErrorToast(err.response?.data?.message || err.message || 'Failed to update product');
      setTimeout(() => setErrorToast(null), 5000);
    },
  });

  const handleOpenEdit = (p: any) => {
    setSelectedProductForEdit(p);
    setEditName(p.name || '');
    setEditMrp(p.mrp || 0);
    setEditB2bPrice(p.b2bPrice || 0);
    setEditDistributorPrice(p.distributorPrice || 0);
    setEditMinStock(p.minStock || 50);
    setEditIsActive(p.isActive !== undefined ? p.isActive : true);
  };

  const handleSaveProduct = () => {
    if (!selectedProductForEdit) return;

    updateProductMutation.mutate({
      id: selectedProductForEdit.id,
      data: {
        name: editName,
        mrp: Number(editMrp),
        b2bPrice: Number(editB2bPrice),
        distributorPrice: Number(editDistributorPrice),
        minStock: Number(editMinStock),
        isActive: editIsActive,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
            Product Catalog & BOM Master
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] flex items-center gap-2 mt-1.5">
            <PackageCheck className="w-5 h-5 text-[#5C1D24]" /> Products Master & BOM Formulations
          </h1>
          <p className="text-xs text-[#78726D] mt-1">
            Ayurvedic product registry, MRP/B2B/Distributor price tiers, HSN codes, and active multi-version BOM formulations.
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

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p: any) => {
          const bom = p.boms?.[0];
          return (
            <div
              key={p.id}
              className="bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] space-y-4 flex flex-col justify-between hover:border-[#D6D0C4] transition-all"
            >
              <div className="space-y-3">
                {/* Header with Title and Status */}
                <div className="flex items-start justify-between border-b border-[#EAE5DC] pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
                      {p.category?.name || 'HERBAL FORMULATION'}
                    </span>
                    <h3 className="text-base font-bold text-[#1A1817] leading-snug mt-0.5">{p.name}</h3>
                    <p className="text-xs text-[#78726D] mt-0.5">
                      SKU: <span className="font-mono text-[#1A1817] font-semibold">{p.sku}</span> | Pack: {p.packSize || '100g'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold border border-[#EAE5DC] whitespace-nowrap">
                    {p.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Price Tiers in Warm Surface */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE5DC] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#8C857E] font-semibold uppercase tracking-wider block font-mono">MRP</span>
                    <span className="font-bold text-[#1A1817] text-sm">₹{p.mrp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C857E] font-semibold uppercase tracking-wider block font-mono">B2B Price</span>
                    <span className="font-bold text-[#5C1D24] text-sm">₹{p.b2bPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C857E] font-semibold uppercase tracking-wider block font-mono">Distributor</span>
                    <span className="font-bold text-[#B8944D] text-sm">₹{p.distributorPrice}</span>
                  </div>
                </div>

                {/* Active BOM Details */}
                {bom ? (
                  <div className="space-y-2 border-t border-[#EAE5DC] pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1A1817] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#B8944D]" /> Active BOM: {bom.version}
                      </span>
                      <span className="text-[10px] text-[#78726D] font-mono">Yield: {bom.expectedYield} units</span>
                    </div>

                    <div className="space-y-1 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE5DC] text-xs">
                      <p className="font-bold text-[#1A1817] text-[11px] mb-1">Required Ingredients (per yield):</p>
                      <ul className="space-y-1 text-[#5A544F]">
                        {bom.bomItems?.map((bi: any) => (
                          <li key={bi.id} className="flex items-center justify-between text-[11px]">
                            <span>• {bi.rawMaterial?.name}</span>
                            <span className="font-bold text-[#1A1817] font-mono">{bi.quantity} {bi.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#78726D] italic pt-1">No active BOM formulation configured</div>
                )}
              </div>

              {/* CARD FOOTER WITH EDIT BUTTON */}
              <div className="pt-2 flex items-center justify-end border-t border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className="px-4 py-2 bg-[#1A1817] hover:bg-[#2E2927] text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5 text-[#B8944D]" /> Edit Product & Pricing
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PRODUCT & PRICING */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedProductForEdit)}
        onClose={() => setSelectedProductForEdit(null)}
        category="PRODUCT MASTER MANAGEMENT"
        title={`Edit Product: ${selectedProductForEdit?.name || 'Product'}`}
        description="Update formulation name, pricing tiers (MRP, B2B, Distributor), and inventory thresholds."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedProductForEdit(null)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={updateProductMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8944D]" />
              {updateProductMutation.isPending ? 'Saving...' : 'Save Product Changes'}
            </button>
          </>
        }
      >
        {selectedProductForEdit && (
          <div className="space-y-4">
            <InfoBlock
              items={[
                { label: 'SKU Code', value: selectedProductForEdit.sku },
                { label: 'Category', value: selectedProductForEdit.category?.name || 'Ayurvedic Products' },
                { label: 'Pack Size', value: selectedProductForEdit.packSize || '100g' },
                { label: 'HSN Code', value: selectedProductForEdit.hsnCode || '30049011' },
              ]}
            />

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                  Product Formulation Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                />
              </div>

              {/* Price Tier Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editMrp}
                    onChange={(e) => setEditMrp(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                    B2B Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editB2bPrice}
                    onChange={(e) => setEditB2bPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                    Distributor (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editDistributorPrice}
                    onChange={(e) => setEditDistributorPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Minimum Stock & Active status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                    Minimum Stock (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1A1817] uppercase tracking-wider mb-1 font-mono">
                    Catalog Status
                  </label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2 bg-white border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#1A1817] focus:border-[#5C1D24] focus:outline-none transition-all"
                  >
                    <option value="active">Active in Catalog</option>
                    <option value="inactive">Inactive / Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5 text-xs text-[#5A544F]">
              <ShieldCheck className="w-4 h-4 text-[#5C1D24] shrink-0 mt-0.5" />
              <span>
                Saving changes will immediately update the sales invoice calculator, quotation creator, and price lists.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

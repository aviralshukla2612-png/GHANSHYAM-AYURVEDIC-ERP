'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { PackageCheck, Layers, FileText, CheckCircle2 } from 'lucide-react';

export default function ProductsPage() {
  const { data: prodRes } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/products'),
  });

  const products = (prodRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-ayurveda-700" /> Products Master & BOM Formulations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Ayurvedic product registry, MRP/B2B/B2C price tiers, HSN codes, and active multi-version BOM formulations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p: any) => {
          const bom = p.boms?.[0];
          return (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold text-ayurveda-700 uppercase tracking-wider">{p.category?.name}</span>
                  <h3 className="text-base font-extrabold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500">SKU: <span className="font-mono text-gray-800">{p.sku}</span> | Pack: {p.packSize}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                  Active
                </span>
              </div>

              {/* Price Tiers */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">MRP</span>
                  <span className="font-black text-gray-900">₹{p.mrp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">B2B Price</span>
                  <span className="font-black text-ayurveda-800">₹{p.b2bPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Distributor</span>
                  <span className="font-black text-blue-800">₹{p.distributorPrice}</span>
                </div>
              </div>

              {/* Active BOM Details */}
              {bom ? (
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gold-600" /> Active BOM: {bom.version}
                    </span>
                    <span className="text-[10px] text-gray-500">Yield: {bom.expectedYield} units</span>
                  </div>

                  <div className="space-y-1 bg-ayurveda-50/60 p-3 rounded-xl border border-ayurveda-100 text-xs">
                    <p className="font-bold text-ayurveda-900 text-[11px] mb-1">Required Ingredients (per yield):</p>
                    <ul className="space-y-1 text-gray-700">
                      {bom.bomItems?.map((bi: any) => (
                        <li key={bi.id} className="flex items-center justify-between text-[11px]">
                          <span>• {bi.rawMaterial?.name}</span>
                          <span className="font-bold">{bi.quantity} {bi.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic pt-2">No active BOM formulation configured</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

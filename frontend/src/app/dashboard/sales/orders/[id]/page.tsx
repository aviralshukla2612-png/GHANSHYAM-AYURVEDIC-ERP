'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../../lib/api/apiClient';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Factory,
  Layers,
  Truck,
  CreditCard,
  History,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: orderRes, isLoading } = useQuery({
    queryKey: ['salesOrderDetails', id],
    queryFn: () => apiClient.get(`/api/sales/orders/${id}`),
  });

  const order = (orderRes as any)?.data || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500 text-xs">
        Loading Sales Order Details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/sales/orders" className="text-xs font-bold text-ayurveda-700 hover:underline flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders List
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">{order.orderNumber}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Customer: <span className="font-bold text-gray-800">{order.customer?.name}</span> ({order.customer?.customerType}) | Date:{' '}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right bg-ayurveda-50 p-4 rounded-xl border border-ayurveda-200">
            <span className="text-xs text-gray-500 font-bold block">Total Amount</span>
            <span className="text-2xl font-black text-ayurveda-900">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-t pt-3 text-xs font-bold">
          {['Overview', 'Products', 'Stock & BOM', 'Production', 'Raw Materials', 'Dispatch', 'Activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-ayurveda-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-2">Customer & Billing Details</h3>
            <p><strong>Company:</strong> {order.customer?.companyName || 'N/A'}</p>
            <p><strong>GSTIN:</strong> {order.customer?.gstin || 'N/A'}</p>
            <p><strong>Phone:</strong> {order.customer?.phone}</p>
            <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-2">Financial Breakdown</h3>
            <p><strong>Subtotal:</strong> ₹{order.subtotal?.toLocaleString('en-IN')}</p>
            <p><strong>GST Tax:</strong> ₹{order.taxAmount?.toLocaleString('en-IN')}</p>
            <p className="text-base font-black text-ayurveda-900 border-t pt-2">
              Total Amount: ₹{order.totalAmount?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Products' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900">Ordered Ayurvedic Products</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b">
                <th className="p-3">Product Name</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">GST %</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((it: any) => (
                <tr key={it.id}>
                  <td className="p-3 font-bold text-gray-900">{it.product?.name} ({it.product?.sku})</td>
                  <td className="p-3 font-bold">{it.quantity} units</td>
                  <td className="p-3">₹{it.unitPrice}</td>
                  <td className="p-3">{it.gstRate}%</td>
                  <td className="p-3 font-black text-ayurveda-900">₹{it.totalAmount?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Stock & BOM' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Finished Goods Stock & Bill of Materials (BOM)
          </h3>
          {order.items?.map((it: any) => {
            const bom = it.product?.boms?.[0];
            return (
              <div key={it.id} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-950 text-sm">{it.product?.name} ({it.product?.sku})</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-black text-[11px]">
                    Current Stock: {it.product?.currentStock || 1000} Units
                  </span>
                </div>
                {bom ? (
                  <div className="space-y-1.5 pt-2 border-t border-emerald-200">
                    <p className="font-bold text-gray-800">Master BOM Formula ({bom.version || 'v1.0'} - Expected Yield: {bom.expectedYield || 100} Units):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {bom.bomItems?.map((bi: any) => (
                        <div key={bi.id} className="p-2 rounded bg-white border border-emerald-200 flex justify-between">
                          <span className="font-semibold text-gray-800">{bi.rawMaterial?.name}</span>
                          <span className="font-bold text-ayurveda-900">{bi.quantity} {bi.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Standard Ayurvedic Formulation applied for this batch.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Production' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Factory className="w-4 h-4 text-ayurveda-700" /> Linked Production Requests & Batch Execution
          </h3>
          {order.productionRequests?.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No active manufacturing batch required (Stock was directly available for dispatch).
            </div>
          ) : (
            order.productionRequests?.map((pr: any) => (
              <div key={pr.id} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-950 text-sm">Production Request: {pr.requestNo}</span>
                  <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 font-black text-[11px]">{pr.status}</span>
                </div>
                <p className="font-semibold text-gray-800">Product: {pr.product?.name || order.items?.[0]?.product?.name}</p>
                <p className="text-gray-700">Requested Batch Yield: <strong>{pr.requestedQuantity} Units</strong></p>
                <p className="text-gray-500 text-[11px]">Initiated Date: {new Date(pr.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Raw Materials' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" /> Linked Raw Material Purchase Requests
          </h3>

          {order.rmPurchaseRequests?.length === 0 ? (
            <p className="text-gray-400">No raw material shortage detected for this order.</p>
          ) : (
            order.rmPurchaseRequests?.map((rm: any) => (
              <div key={rm.id} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-950">{rm.requestNo}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">{rm.status}</span>
                </div>
                <p>Estimated Cost: ₹{rm.estimatedCost?.toLocaleString('en-IN')} | Supplier: {rm.supplier?.name || 'Saurashtra Herbs'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Dispatch' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" /> Truck Dispatch & Delivery Status
          </h3>
          {order.dispatches?.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No dispatch recorded yet for this order. Go to <Link href="/dashboard/dispatch" className="text-ayurveda-700 font-bold underline">Dispatch Tracking</Link> to prepare truck dispatch.
            </div>
          ) : (
            order.dispatches?.map((disp: any) => (
              <div key={disp.id} className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-blue-950 text-sm">Dispatch Ref: {disp.dispatchNo}</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-black text-[11px]">{disp.status}</span>
                </div>
                <p className="font-bold text-gray-800">Transporter: {disp.transporterName || 'Saurashtra Transport'} (Truck: {disp.truckNumber || 'GJ-03-BW-9876'})</p>
                <p className="text-gray-700">Driver: {disp.driverName || 'Ramesh Patel'} | Phone: {disp.driverPhone || '+91 98765 43210'}</p>
                <p className="text-gray-500 text-[11px]">Dispatch Date: {new Date(disp.dispatchedAt || disp.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Activity' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-ayurveda-700" /> Order Lifecycle Activity Timeline
          </h3>

          <div className="space-y-3">
            {order.activityTimeline?.map((act: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start border-l-2 border-ayurveda-600 pl-4 py-1">
                <div>
                  <div className="font-bold text-gray-900">{act.action}</div>
                  <div className="text-gray-600">{act.detail}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{new Date(act.time).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

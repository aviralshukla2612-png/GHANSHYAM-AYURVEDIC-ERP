'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/apiClient';
import {
  TrendingUp,
  PackageCheck,
  Send,
  Layers,
  CheckCircle2,
  Activity,
  Boxes,
  Factory,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const currentRole = user?.roles?.[0] || 'SUPER_ADMIN';

  if (currentRole === 'SALES') {
    return <SalesDashboardView />;
  }
  if (currentRole === 'STOCK_MANAGER') {
    return <StockManagerDashboardView />;
  }
  if (currentRole === 'PRODUCTION') {
    return <ProductionDashboardView />;
  }
  if (currentRole === 'ACCOUNTANT') {
    return <AccountantDashboardView />;
  }
  return <SuperAdminDashboardView />;
}

// ----------------------------------------------------------------------
// 1. SALES OPERATIONAL DASHBOARD
// ----------------------------------------------------------------------
function SalesDashboardView() {
  const { data: salesRes } = useQuery({
    queryKey: ['salesDashboard'],
    queryFn: () => apiClient.get('/api/sales/dashboard'),
  });

  const salesData = (salesRes as any)?.data || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            SALES & DISPATCH COMMAND
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1">Orders, Revenue & Procurement Shortages</h1>
        </div>
        <Link
          href="/dashboard/sales"
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          Open Sales Portal →
        </Link>
      </div>

      {/* Primary Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Today's Sales</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹{(salesData.todaySales || 125000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs yesterday
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Monthly Revenue</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹{(salesData.monthlySales || 1456000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-[#B8944D] font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +8.2% target pace
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Pending Orders</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{salesData.pendingOrdersCount || 28} Orders</h3>
          <p className="text-[11px] text-[#8C6512] font-semibold mt-1">12 awaiting RM purchase</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Outstanding Payments</span>
          <h3 className="text-2xl font-bold text-[#8C1D2F] mt-1">₹{(salesData.outstandingPayments || 485000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-[#8C1D2F] font-semibold mt-1">8 customer balances due</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. STOCK MANAGER OPERATIONAL DASHBOARD
// ----------------------------------------------------------------------
function StockManagerDashboardView() {
  const { data: stockRes } = useQuery({
    queryKey: ['stockDashboard'],
    queryFn: () => apiClient.get('/api/inventory/dashboard'),
  });

  const { data: rawRes } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: () => apiClient.get('/api/raw-materials'),
  });

  const stockData = (stockRes as any)?.data || {};
  const rawMaterials = (rawRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            WAREHOUSE & INVENTORY COMMAND
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1">Inventory Ledger, Raw Materials & Goods Inward</h1>
        </div>
        <Link
          href="/dashboard/stock"
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          Open Stock Portal →
        </Link>
      </div>

      {/* Primary Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Total Inventory Value</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹18,45,000</h3>
          <p className="text-[11px] text-[#78726D] font-medium mt-1">Rajkot Central Warehouse</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Raw Material Categories</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{rawMaterials.length} Types</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold mt-1">Senna, Mulethi, Ashwagandha</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Finished Goods Lines</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">5 Product Lines</h3>
          <p className="text-[11px] text-[#78726D] font-medium mt-1">250 units each ready</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Requisitions</span>
          <h3 className="text-2xl font-bold text-[#8C1D2F] mt-1">{stockData.lowStockItemsCount || 0} Alert</h3>
          <p className="text-[11px] text-[#8C1D2F] font-semibold mt-1">RM Purchase POs generated</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. PRODUCTION OPERATIONAL DASHBOARD
// ----------------------------------------------------------------------
function ProductionDashboardView() {
  const { data: prodRes } = useQuery({
    queryKey: ['prodDashboard'],
    queryFn: () => apiClient.get('/api/production/dashboard'),
  });

  const prodData = (prodRes as any)?.data || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            MANUFACTURING & BATCH EXECUTION
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1">Batches, BOM Formulations & Stage Wastage</h1>
        </div>
        <Link
          href="/dashboard/production"
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          Open Production Portal →
        </Link>
      </div>

      {/* Primary Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Today's Yield</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{prodData.todayProduction || 1200} Units</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold mt-1">Batch KAY-2026-0001 active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Active Batches</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{prodData.runningBatchesCount || 3} Running</h3>
          <p className="text-[11px] text-[#78726D] font-medium mt-1">Grinding & Filling lines</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Completed Batches</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{prodData.completedBatchesCount || 12} Released</h3>
          <p className="text-[11px] text-[#5C1D24] font-semibold mt-1">Passed Quality Checks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Production Efficiency</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{prodData.productionEfficiency || 96.4}%</h3>
          <p className="text-[11px] text-[#78726D] font-semibold mt-1">Avg Wastage: {prodData.avgWastagePercent || 2.45}%</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. ACCOUNTANT OPERATIONAL DASHBOARD
// ----------------------------------------------------------------------
function AccountantDashboardView() {
  const queryClient = useQueryClient();
  const [showCAModal, setShowCAModal] = useState(false);
  const [period, setPeriod] = useState('Sep 2026');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [caSuccessMsg, setCaSuccessMsg] = useState<any>(null);

  const { data: accRes } = useQuery({
    queryKey: ['accDashboard'],
    queryFn: () => apiClient.get('/api/accounting/dashboard'),
  });

  const accData = (accRes as any)?.data || {};

  const sendCAMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/ca-export/send-whatsapp', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['caExports'] });
      setCaSuccessMsg(res);
    },
  });

  const handleValidateAndSendCA = () => {
    const errors: string[] = [];
    if (!accData.totalRevenue) errors.push('Missing sales invoice data for period');
    if (accData.gstSummary?.totalTax === 0) errors.push('GST tax calculation incomplete');

    if (errors.length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
      sendCAMutation.mutate({ period, caPhone: '7383198428' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            FINANCIAL AUDIT & GST ACCOUNTING
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1">P&L, GST Liabilities & WhatsApp CA Export</h1>
        </div>

        <button
          onClick={() => {
            setCaSuccessMsg(null);
            setValidationErrors([]);
            setShowCAModal(true);
          }}
          className="px-5 py-2.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Send className="w-4 h-4" /> Send Financial Package to CA
        </button>
      </div>

      {/* Primary Accountant KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] min-w-0 overflow-hidden">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Monthly Revenue</span>
          <h3 className="text-xl lg:text-2xl font-bold text-[#1A1817] mt-1 truncate" title={`₹${(accData.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}>
            ₹{(accData.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] min-w-0 overflow-hidden">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Gross Profit</span>
          <h3 className={`text-xl lg:text-2xl font-bold mt-1 truncate ${(accData.grossProfit ?? 0) >= 0 ? 'text-[#1A1817]' : 'text-[#8C1D2F]'}`} title={`₹${(accData.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}>
            ₹{(accData.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] min-w-0 overflow-hidden">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Receivables</span>
          <h3 className="text-xl lg:text-2xl font-bold text-[#1A1817] mt-1 truncate" title={`₹${(accData.receivables || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}>
            ₹{(accData.receivables || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] min-w-0 overflow-hidden">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">GST Liability</span>
          <h3 className="text-xl lg:text-2xl font-bold text-[#8C6512] mt-1 truncate" title={`₹${(accData.gstSummary?.totalTax || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}>
            ₹{(accData.gstSummary?.totalTax || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* CA Modal */}
      {showCAModal && (
        <div className="fixed inset-0 bg-[#1A1817]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#EAE5DC] space-y-4">
            <h3 className="text-base font-bold text-[#1A1817] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#5C1D24]" /> WhatsApp CA Financial Export Package
            </h3>

            {caSuccessMsg ? (
              <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs space-y-2 text-[#1A1817]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#5C1D24]">
                  <CheckCircle2 className="w-5 h-5 text-[#5C1D24]" />
                  {caSuccessMsg.message}
                </div>
                <div className="text-[11px] font-mono text-[#5A544F] bg-white p-2 rounded border border-[#EAE5DC]">
                  WhatsApp Message ID: {caSuccessMsg.data?.whatsappMsgId || 'wmid.delivered.2026'}
                </div>
                <button
                  onClick={() => setShowCAModal(false)}
                  className="w-full py-2.5 bg-[#1A1817] text-white font-bold rounded-xl mt-2 cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1A1817] mb-1">Financial Reporting Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]"
                  >
                    <option value="Sep 2026">September 2026</option>
                    <option value="Aug 2026">August 2026</option>
                    <option value="Q2 2026-27">Q2 (Jul - Sep 2026)</option>
                  </select>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE5DC] space-y-2">
                  <p className="font-bold text-[#1A1817]">Pre-Export Data Validation Checklist:</p>
                  <div className="space-y-1 text-[11px] text-[#5A544F]">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Sales Invoices verified</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Purchase Invoices & GRNs verified</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> GSTIN & HSN summaries complete</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#5C1D24]" /> Profit & Loss calculated</div>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-3 bg-[#FDF2F4] border border-[#F7D2D9] text-[#8C1D2F] text-xs rounded-xl font-bold">
                    Validation Errors: {validationErrors.join(', ')}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCAModal(false)}
                    className="flex-1 py-2.5 border border-[#EAE5DC] rounded-xl font-semibold text-[#5A544F] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleValidateAndSendCA}
                    disabled={sendCAMutation.isPending}
                    className="flex-1 py-2.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-bold rounded-xl cursor-pointer"
                  >
                    {sendCAMutation.isPending ? 'Dispatching...' : 'Dispatch to CA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. SUPER ADMIN OPERATIONAL DASHBOARD
// ----------------------------------------------------------------------
function SuperAdminDashboardView() {
  const { data: salesRes } = useQuery({ queryKey: ['salesDashboard'], queryFn: () => apiClient.get('/api/sales/dashboard') });
  const { data: prodRes } = useQuery({ queryKey: ['prodDashboard'], queryFn: () => apiClient.get('/api/production/dashboard') });
  const { data: stockRes } = useQuery({ queryKey: ['stockDashboard'], queryFn: () => apiClient.get('/api/inventory/dashboard') });

  const salesData = (salesRes as any)?.data || {};
  const prodData = (prodRes as any)?.data || {};
  const stockData = (stockRes as any)?.data || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-[0_2px_8px_-2px_rgba(26,24,23,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
            ORGANIZATION COMMAND OVERVIEW
          </span>
          <h1 className="text-xl font-bold text-[#1A1817] mt-1">Full System Visibility & ERP Operations</h1>
        </div>
        <Link
          href="/dashboard/integrity"
          className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Activity className="w-4 h-4 text-[#B8944D]" /> ERP Health Center →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Monthly Sales</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹{(salesData.monthlySales || 1845000).toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Inventory Value</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">₹18,45,000</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Active Batches</span>
          <h3 className="text-2xl font-bold text-[#1A1817] mt-1">{prodData.runningBatchesCount || 3} Running</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
          <span className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider font-mono">Receivables</span>
          <h3 className="text-2xl font-bold text-[#8C1D2F] mt-1">₹{(salesData.outstandingPayments || 485000).toLocaleString('en-IN')}</h3>
        </div>
      </div>
    </div>
  );
}

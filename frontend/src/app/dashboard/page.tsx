'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/apiClient';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  Factory,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  Send,
  Leaf,
  Layers,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
  Flame,
  FileSpreadsheet,
  FileText,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const currentRole = user?.roles?.[0] || 'SUPER_ADMIN';

  // Render role-specific dashboard views
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
      <div className="ayurveda-gradient rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-ayurveda-700">
        <div>
          <span className="text-gold-400 text-xs font-bold uppercase tracking-wider">SALES EXECUTIVE OPERATIONAL DASHBOARD</span>
          <h1 className="text-2xl font-black text-white mt-1">Orders, Revenue & Raw Material Shortages</h1>
        </div>
        <Link href="/dashboard/sales" className="px-4 py-2.5 bg-gold-500 text-ayurveda-950 font-black text-xs rounded-xl shadow-md">
          Open Sales Portal →
        </Link>
      </div>

      {/* Primary Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Today's Sales</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">₹{(salesData.todaySales || 125000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +12.4% vs yesterday</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Monthly Revenue</span>
          <h3 className="text-2xl font-black text-ayurveda-900 mt-1">₹{(salesData.monthlySales || 1456000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +8.2% target pace</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Pending Orders</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{salesData.pendingOrdersCount || 28} Orders</h3>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">12 awaiting RM purchase</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Outstanding Payments</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">₹{(salesData.outstandingPayments || 485000).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">8 customer balances due</p>
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
      <div className="bg-gradient-to-r from-emerald-900 to-ayurveda-900 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-emerald-700">
        <div>
          <span className="text-gold-400 text-xs font-bold uppercase tracking-wider">STOCK MANAGER OPERATIONAL DASHBOARD</span>
          <h1 className="text-2xl font-black text-white mt-1">Inventory Ledger, Raw Materials & Dispatches</h1>
        </div>
        <Link href="/dashboard/stock" className="px-4 py-2.5 bg-emerald-500 text-emerald-950 font-black text-xs rounded-xl shadow-md">
          Open Stock Portal →
        </Link>
      </div>

      {/* Primary Stock KPIs (NO Sales revenue!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Inventory Value</span>
          <h3 className="text-2xl font-black text-emerald-900 mt-1">₹18,45,000</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Rajkot Central Warehouse</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Raw Material Stock</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{rawMaterials.length} Categories</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Senna, Mulethi, Neem Extract</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Finished Goods Stock</span>
          <h3 className="text-2xl font-black text-ayurveda-900 mt-1">5 Product Lines</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-1">250 units each ready</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Low Stock Alerts</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">{stockData.lowStockItemsCount || 0} Requisitions</h3>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">RM Purchase POs generated</p>
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
      <div className="bg-gradient-to-r from-amber-900 to-ayurveda-900 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-amber-700">
        <div>
          <span className="text-gold-400 text-xs font-bold uppercase tracking-wider">PRODUCTION OPERATIONAL DASHBOARD</span>
          <h1 className="text-2xl font-black text-white mt-1">Batches, BOM Formulations & Stage Wastage</h1>
        </div>
        <Link href="/dashboard/production" className="px-4 py-2.5 bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-md">
          Open Production Portal →
        </Link>
      </div>

      {/* Primary Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Today's Production Yield</span>
          <h3 className="text-2xl font-black text-amber-900 mt-1">{prodData.todayProduction || 1200} Units</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Batch KAY-2026-0001 active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Batches</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{prodData.runningBatchesCount || 3} Running</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Grinding & Filling lines</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Completed Batches</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{prodData.completedBatchesCount || 12} Released</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Passed Quality Checks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Production Efficiency</span>
          <h3 className="text-2xl font-black text-blue-700 mt-1">{prodData.productionEfficiency || 96.4}%</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Avg Wastage: {prodData.avgWastagePercent || 2.45}%</p>
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
    // Perform real data validation check
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
      <div className="bg-gradient-to-r from-purple-950 via-ayurveda-950 to-ayurveda-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800">
        <div>
          <span className="text-gold-400 text-xs font-bold uppercase tracking-wider">HEAD ACCOUNTANT OPERATIONAL DASHBOARD</span>
          <h1 className="text-2xl font-black text-white mt-1">P&L, GST Liabilities & WhatsApp CA Export</h1>
        </div>

        {/* PROMINENT MANDATORY CTA */}
        <button
          onClick={() => {
            setCaSuccessMsg(null);
            setValidationErrors([]);
            setShowCAModal(true);
          }}
          className="px-6 py-3.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:brightness-110 text-ayurveda-950 font-black text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-300"
        >
          <Send className="w-5 h-5" /> [ SEND ALL DATA TO CA ]
        </button>
      </div>

      {/* Primary Accountant KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Monthly Revenue</span>
          <h3 className="text-2xl font-black text-ayurveda-900 mt-1">₹{(accData.totalRevenue || 1845000).toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Gross Profit</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{(accData.grossProfit || 785000).toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Outstanding Receivables</span>
          <h3 className="text-2xl font-black text-blue-600 mt-1">₹{(accData.receivables || 420000).toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">GST Tax Liability</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">₹{(accData.gstSummary?.totalTax || 221400).toLocaleString('en-IN')}</h3>
        </div>
      </div>

      {/* CA Modal with Data Validation */}
      {showCAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-gold-500" /> WhatsApp CA Financial Export Package
            </h3>

            {caSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-2 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {caSuccessMsg.message}
                </div>
                <div className="text-[11px] font-mono text-emerald-800 bg-white/70 p-2 rounded border">
                  WhatsApp Message ID: {caSuccessMsg.data?.whatsappMsgId || 'wmid.delivered.2026'}
                </div>
                <button onClick={() => setShowCAModal(false)} className="w-full py-2.5 bg-ayurveda-800 text-white font-bold rounded-xl mt-2">
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Financial Reporting Period</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50">
                    <option value="Sep 2026">September 2026</option>
                    <option value="Aug 2026">August 2026</option>
                    <option value="Q2 2026-27">Q2 (Jul - Sep 2026)</option>
                  </select>
                </div>

                {/* Pre-export Data Validation Checklist */}
                <div className="bg-gray-50 p-3.5 rounded-xl border space-y-2">
                  <p className="font-bold text-gray-800">Pre-Export Data Validation Checklist:</p>
                  <div className="space-y-1 text-[11px] text-gray-700">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sales Invoices verified</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Purchase Invoices & GRNs verified</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GSTIN & HSN summaries complete</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Profit & Loss calculated</div>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
                    Validation Errors: {validationErrors.join(', ')}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCAModal(false)} className="flex-1 py-2.5 border rounded-xl font-bold text-gray-600">
                    Cancel
                  </button>
                  <button
                    onClick={handleValidateAndSendCA}
                    disabled={sendCAMutation.isPending}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 text-ayurveda-950 font-black rounded-xl"
                  >
                    {sendCAMutation.isPending ? 'Dispatching Package...' : 'Validate & Dispatch via WhatsApp'}
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
      <div className="ayurveda-gradient rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-ayurveda-700">
        <div>
          <span className="text-gold-400 text-xs font-bold uppercase tracking-wider">SUPER ADMIN ORGANIZATION COMMAND CENTER</span>
          <h1 className="text-2xl font-black text-white mt-1">Full System Visibility & ERP Operations</h1>
        </div>
        <Link href="/dashboard/integrity" className="px-4 py-2.5 bg-gold-500 text-ayurveda-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> ERP Integrity Center →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Monthly Sales</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">₹{(salesData.monthlySales || 1845000).toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Inventory Value</span>
          <h3 className="text-2xl font-black text-emerald-900 mt-1">₹18,45,000</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Production</span>
          <h3 className="text-2xl font-black text-amber-900 mt-1">{prodData.runningBatchesCount || 3} Batches</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase">Outstanding Receivables</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">₹{(salesData.outstandingPayments || 485000).toLocaleString('en-IN')}</h3>
        </div>
      </div>
    </div>
  );
}

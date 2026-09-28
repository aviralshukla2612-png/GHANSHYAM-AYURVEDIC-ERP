'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import {
  Factory,
  Play,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Scale,
  ClipboardList,
  Layers,
  Search,
  Filter,
  TrendingUp,
  Clock,
  ChevronRight,
  PackageCheck,
  Truck,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  UserCheck,
  Check,
  XCircle,
  AlertCircle,
  Eye,
  Grid,
  List,
  RotateCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ProductionPage() {
  const queryClient = useQueryClient();

  // Layout View Toggles
  const [activeTab, setActiveTab] = useState<
    'all' | 'queue' | 'batches' | 'readiness' | 'schedule' | 'analytics' | 'quality' | 'output'
  >('all');
  const [batchViewMode, setBatchViewMode] = useState<'table' | 'cards'>('table');
  const [scheduleTab, setScheduleTab] = useState<'today' | 'week' | 'month'>('today');

  // Modals & Traceability state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState<string | null>(null);
  const [showQCModal, setShowQCModal] = useState<string | null>(null);
  const [traceBatchId, setTraceBatchId] = useState<string | null>(null);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [plannedQty, setPlannedQty] = useState(250);
  const [wasteStage, setWasteStage] = useState('Grinding');
  const [inputQty, setInputQty] = useState(100);
  const [outputQty, setOutputQty] = useState(97);
  const [inspectorName, setInspectorName] = useState('Dr. Sharma (QC Lead)');
  const [qcResult, setQcResult] = useState('PASSED');
  const [qcRemarks, setQcRemarks] = useState('Met all Ayurvedic Pharmacopoeia Standards');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const {
    data: dashboardRes,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['productionDashboard'],
    queryFn: () => apiClient.get('/api/production/dashboard'),
  });

  const { data: ordersRes } = useQuery({
    queryKey: ['productionOrders'],
    queryFn: () => apiClient.get('/api/production/orders'),
  });

  const { data: requestsRes } = useQuery({
    queryKey: ['productionRequests'],
    queryFn: () => apiClient.get('/api/production/requests'),
  });

  const { data: batchesRes } = useQuery({
    queryKey: ['productionBatches'],
    queryFn: () => apiClient.get('/api/production/batches'),
  });

  const { data: wastageRes } = useQuery({
    queryKey: ['productionWastage'],
    queryFn: () => apiClient.get('/api/production/wastage'),
  });

  const { data: analyticsRes } = useQuery({
    queryKey: ['productionAnalytics'],
    queryFn: () => apiClient.get('/api/production/analytics'),
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/products'),
  });

  const { data: traceRes } = useQuery({
    queryKey: ['batchTrace', traceBatchId],
    queryFn: () => apiClient.get(`/api/production/batches/trace/${traceBatchId}`),
    enabled: !!traceBatchId,
  });

  const dashboardData = (dashboardRes as any)?.data || {};
  const kpis = dashboardData.kpis || {};
  const orders = (ordersRes as any)?.data || dashboardData.activeOrders || [];
  const requests = (requestsRes as any)?.data || dashboardData.productionQueue || [];
  const batches = (batchesRes as any)?.data || dashboardData.runningBatches || [];
  const wastageData = (wastageRes as any)?.data || { wastes: [], stageBreakdown: [] };
  const analytics = (analyticsRes as any)?.data || {};
  const products = (productsRes as any)?.data || [];
  const traceData = (traceRes as any)?.data || null;

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/production/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['productionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      setShowOrderModal(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to schedule production order');
    },
  });

  const startBatchMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/production/orders/${id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to start production batch');
    },
  });

  const recordWasteMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.post(`/api/production/orders/${id}/record-waste`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionWastage'] });
      setShowWasteModal(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to record wastage');
    },
  });

  const recordQCMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.post(`/api/production/orders/${id}/quality-check`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      setShowQCModal(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to record quality check');
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      apiClient.post(`/api/production/orders/${id}/complete`, { finishedQuantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to complete production order');
    },
  });

  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const requestMaterialMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/raw-material-requests', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['productionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['productionDashboard'] });
      setRequestSuccess(`✓ Material Request ${res.data?.requestNo || 'RM-REQ'} sent to Stock Manager!`);
      setTimeout(() => setRequestSuccess(null), 5000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to request material');
    },
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct =
      products.find((p: any) => p.id === selectedProduct) ||
      products.find((p: any) => p.name?.toLowerCase().includes('pain oil')) ||
      products[0];

    if (!targetProduct) {
      return alert('No product available for production');
    }

    const bomId = targetProduct.boms?.[0]?.id || targetProduct.id;
    const matchingReq = requests.find((r: any) => r.productId === targetProduct.id || r.product?.id === targetProduct.id);

    createOrderMutation.mutate({
      productId: targetProduct.id,
      bomId,
      productionRequestId: matchingReq?.id,
      plannedQuantity: Number(plannedQty) || 1000,
      startDate: new Date().toISOString(),
      expectedCompletion: new Date(Date.now() + 86400000).toISOString(),
      supervisor: 'Production Supervisor',
      machine: 'LINE_1 (Grinding & Filling)',
    });
  };

  const filteredOrders = orders.filter(
    (o: any) =>
      o.productionOrderNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.batch?.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock Trend Chart Data
  const trendData = [
    { date: '21 Sep', units: 980 },
    { date: '22 Sep', units: 1100 },
    { date: '23 Sep', units: 1050 },
    { date: '24 Sep', units: 1280 },
    { date: '25 Sep', units: 1150 },
    { date: '26 Sep', units: 1200 },
  ];

  const productData = [
    { name: 'Kayam Churna', units: 500 },
    { name: 'Cough Syrup', units: 350 },
    { name: 'Neem Soap', units: 200 },
    { name: 'Hair Oil', units: 150 },
  ];

  const yieldData = [
    { name: 'Kayam Churna', expected: 97, actual: 96.8 },
    { name: 'Cough Syrup', expected: 98, actual: 97.5 },
    { name: 'Neem Soap', expected: 95, actual: 95.2 },
    { name: 'Hair Oil', expected: 96, actual: 96.0 },
  ];

  if (isDashboardLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-6 gap-4 h-28">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 h-64">
          <div className="bg-gray-200 rounded-2xl"></div>
          <div className="bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 my-8">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="font-extrabold text-base text-rose-900">Unable to load Production Control Center</h3>
        <p className="text-xs text-rose-700">Failed to connect to the backend REST API server.</p>
        <button
          onClick={() => refetchDashboard()}
          className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
              Manufacturing Operations
            </span>
            <span className="text-xs text-[#8C857E]">•</span>
            <span className="text-xs font-semibold text-[#78726D]">Ghanshyam Ayurvedic Pharmacy</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
            <Factory className="w-6 h-6 text-[#5C1D24]" /> Production Control Center
          </h1>
          <p className="text-xs text-[#78726D] mt-1 max-w-3xl">
            Plan production, manage batches (`KAY-2026-XXXX`), monitor material consumption, track stage-wise wastage and release finished goods to sellable inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B8944D]" /> + Schedule Production
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B8944D]" /> + Create Production Order
          </button>
        </div>
      </div>

      {/* SECONDARY QUICK ACTIONS BAR */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#EAE5DC] overflow-x-auto shadow-2xs no-scrollbar">
        {[
          { id: 'all', label: 'All Operational Sections' },
          { id: 'queue', label: 'Production Requests Queue' },
          { id: 'batches', label: 'Active Batches & Floor Status' },
          { id: 'readiness', label: 'Raw Material Readiness' },
          { id: 'quality', label: 'Quality Control Queue' },
          { id: 'analytics', label: 'Yield & Wastage Analytics' },
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => setActiveTab(action.id as any)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === action.id
                ? 'bg-[#1A1817] text-white shadow-xs'
                : 'text-[#5A544F] hover:bg-[#FAF8F5] hover:text-[#1A1817]'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 6 TOP OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* CARD 1: TODAY'S PRODUCTION */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">TODAY'S PRODUCTION</span>
            <Factory className="w-4 h-4 text-[#5C1D24]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">
            {(kpis.todayProduction || 1200).toLocaleString()} <span className="text-xs font-semibold text-[#78726D]">Units</span>
          </p>
          <div className="text-[10px] font-bold text-[#78726D] flex justify-between pt-1 truncate">
            <span>Target: {kpis.todayTarget || 1500}</span>
            <span className="text-[#5C1D24] font-bold bg-[#FAF8F5] border border-[#EAE5DC] px-1.5 py-0.5 rounded">{kpis.todayAchievementPct || 80}%</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE BATCHES */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">ACTIVE BATCHES</span>
            <Layers className="w-4 h-4 text-[#8C6512]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">{kpis.activeBatchesCount || 3} Running</p>
          <p className="text-[10px] font-medium text-[#78726D] truncate">
            Grinding: 1 • Mixing: 1 • Filling: 1
          </p>
        </div>

        {/* CARD 3: PENDING PRODUCTION */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">PENDING ORDERS</span>
            <Clock className="w-4 h-4 text-[#78726D]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">{kpis.pendingProductionOrdersCount || 8} Orders</p>
          <p className="text-[10px] font-bold text-[#8C1D2F] truncate">
            {kpis.highPriorityPendingCount || 3} High Priority • {kpis.normalPendingCount || 5} Normal
          </p>
        </div>

        {/* CARD 4: PRODUCTION EFFICIENCY */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">EFFICIENCY RATE</span>
            <TrendingUp className="w-4 h-4 text-[#5C1D24]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">{kpis.productionEfficiencyPct || 96.4}%</p>
          <p className="text-[10px] font-medium text-[#78726D] truncate">Target: {kpis.targetEfficiencyPct || 95.0}%</p>
        </div>

        {/* CARD 5: AVERAGE YIELD */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">AVERAGE YIELD</span>
            <Scale className="w-4 h-4 text-[#8C6512]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">{kpis.averageYieldPct || 97.2}%</p>
          <p className="text-[10px] font-medium text-[#78726D] truncate">Expected: {kpis.expectedYieldPct || 97.0}%</p>
        </div>

        {/* CARD 6: TODAY'S WASTAGE */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C857E] font-mono">
            <span className="truncate">TODAY'S WASTAGE</span>
            <Flame className="w-4 h-4 text-[#5C1D24]" />
          </div>
          <p className="text-xl font-bold text-[#1A1817] truncate">{kpis.todayWastagePct || 2.5}%</p>
          <span className="text-[10px] font-bold text-[#5C1D24] bg-[#FAF8F5] border border-[#EAE5DC] px-1.5 py-0.5 rounded inline-block truncate">
            {kpis.wastageStatus || 'Within tolerance'} (Max: {kpis.allowedWastagePct || 3.0}%)
          </span>
        </div>
      </div>

      {/* PRIMARY OPERATIONAL AREA: QUEUE & RAW MATERIAL READINESS */}
      {(activeTab === 'all' || activeTab === 'queue') && (
        <div className={activeTab === 'all' ? '' : 'w-full'}>
          {/* PRODUCTION QUEUE CARD */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">MANUFACTURING ALLOCATION</span>
                <h3 className="font-bold text-base text-[#1A1817]">PRODUCTION QUEUE</h3>
                <p className="text-xs text-[#78726D]">Sales orders & requests requiring manufacturing allocation</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-xs font-mono">
                {requests.length} Requests
              </span>
            </div>

            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-[#8C857E] text-xs space-y-2">
                  <ClipboardList className="w-8 h-8 mx-auto text-[#A39D96]" />
                  <p>No sales production requests pending.</p>
                </div>
              ) : (
                requests.slice(0, activeTab === 'queue' ? 10 : 3).map((req: any, idx: number) => {
                  const isShort = req.materialStatus === 'SHORT' || idx === 1;
                  return (
                    <div
                      key={req.id || idx}
                      className={`p-4 rounded-xl space-y-3 text-xs transition-all ${
                        isShort
                          ? 'bg-[#FFFDFC] border-2 border-[#DC2626] shadow-2xs'
                          : 'bg-white border border-[#EAE5DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#5C1D24]">{req.requestNo || `PR-2026-00${idx + 1}`}</span>
                          <span className="px-2 py-0.5 bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] rounded font-mono text-[10px] font-bold">
                            Order: {req.salesOrder?.orderNumber || `SO-102${idx + 4}`}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            idx === 0
                              ? 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                              : 'bg-[#FAF8F5] text-[#5A544F] border-[#EAE5DC]'
                          }`}
                        >
                          {idx === 0 ? 'HIGH PRIORITY' : 'NORMAL'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#1A1817]">{req.product?.name || (idx === 0 ? 'Kayam Churna' : idx === 1 ? 'Ayurvedic Cough Syrup' : 'Neem Soap')}</h4>
                        <p className="text-[#78726D]">Customer: <strong className="text-[#1A1817]">{req.salesOrder?.customer?.name || 'Gujarat Herbal Distributors'}</strong></p>
                      </div>

                      <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border ${
                        isShort ? 'bg-[#FEF2F2] border-[#DC2626]' : 'bg-[#FAF8F5] border-[#EAE5DC]'
                      }`}>
                        <div>
                          <span className="text-[10px] text-[#78726D] font-bold block font-mono">Production Required</span>
                          <span className="font-bold text-[#1A1817]">{req.requestedQuantity || (idx === 0 ? 250 : idx === 1 ? 500 : 1000)} {idx === 1 ? 'Bottles' : 'Units'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#78726D] font-bold block font-mono">Material Status</span>
                          <span className={`font-bold ${isShort ? 'text-[#DC2626]' : 'text-[#5C1D24]'}`}>
                            {isShort ? '⚠ PARTIAL (Short: 2 RMs)' : '✓ READY FOR PRODUCTION'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#78726D] font-medium">Required By: 28 Sep 2026</span>
                        {isShort ? (
                          <button
                            onClick={() => setActiveTab('readiness')}
                            className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            View Material Requirement
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedProduct(req.productId);
                              setPlannedQty(req.requestedQuantity);
                              setShowOrderModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            Schedule Batch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'readiness') && (
        <div className={activeTab === 'all' ? '' : 'w-full'}>
          {/* RAW MATERIAL READINESS & SHORTAGES CARD */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">BOM VERIFICATION</span>
                <h3 className="font-bold text-base text-[#1A1817]">RAW MATERIAL SHORTAGES & READINESS</h3>
                <p className="text-xs text-[#78726D]">BOM formulation stock verification & procurement requests</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-xs font-mono">
                Live BOM Check
              </span>
            </div>

            {requestSuccess && (
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#1A1817] font-semibold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5C1D24]" />
                {requestSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs max-h-[550px] overflow-y-auto">
              {(!dashboardData.materialReadiness || dashboardData.materialReadiness.length === 0) ? (
                <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#5C1D24] font-semibold text-center">
                  ✓ All raw materials are sufficient for current scheduled production orders.
                </div>
              ) : (
                dashboardData.materialReadiness.map((mReq: any) => {
                  const hasShortage = mReq.readinessPct < 100;
                  return (
                    <div
                      key={mReq.id}
                      className={`p-3.5 rounded-xl space-y-2 transition-all ${
                        hasShortage
                          ? 'bg-[#FFFDFC] border-2 border-[#DC2626] shadow-2xs'
                          : 'bg-white border border-[#EAE5DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-1.5">
                        <div>
                          <h4 className="font-bold text-[#1A1817]">{mReq.productName}</h4>
                          <p className="text-[11px] text-[#78726D]">Target: {mReq.requestedQuantity} Units</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          mReq.readinessPct >= 100
                            ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                            : 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]'
                        }`}>
                          {mReq.readinessPct}% Ready
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {mReq.breakdown.map((item: any) => {
                          const isShort = item.shortageQuantity > 0;
                          return (
                            <div
                              key={item.rawMaterialId}
                              className={`rounded-xl flex items-center justify-between transition-all overflow-hidden ${
                                isShort
                                  ? 'border-2 border-[#DC2626] shadow-[0_0_0_1px_rgba(220,38,38,0.15)] bg-[#FEF2F2]'
                                  : 'border border-[#EAE5DC] bg-[#FAF8F5]'
                              }`}
                            >
                              {isShort && (
                                <div className="w-1.5 self-stretch bg-[#DC2626] shrink-0" />
                              )}
                              <div className="flex items-center justify-between w-full p-2.5 gap-2">
                                <div>
                                  <p className={`font-bold text-xs ${isShort ? 'text-[#7F1D1D]' : 'text-[#1A1817]'}`}>
                                    {isShort && <span className="mr-1">⚠</span>}{item.name}
                                  </p>
                                  <p className="text-[11px] text-[#78726D] mt-0.5">
                                    Req: <strong>{item.requiredQuantity}</strong> | Avail: <strong>{item.availableQuantity}</strong>
                                    {isShort && (
                                      <strong className="text-[#DC2626] ml-1 font-bold">
                                        (Short: {item.shortageQuantity})
                                      </strong>
                                    )}
                                  </p>
                                </div>

                                {isShort ? (
                                  <button
                                    onClick={() =>
                                      requestMaterialMutation.mutate({
                                        productionRequestId: mReq.id,
                                        reason: `Shortage of ${item.shortageQuantity} for ${mReq.productName}`,
                                        requiredDate: new Date(Date.now() + 5 * 86400000).toISOString(),
                                        items: [
                                          {
                                            rawMaterialId: item.rawMaterialId,
                                            requiredQuantity: item.requiredQuantity,
                                            availableQuantity: item.availableQuantity,
                                            shortageQuantity: item.shortageQuantity,
                                            unit: 'KG',
                                            estimatedRate: 100,
                                          },
                                        ],
                                      })
                                    }
                                    disabled={requestMaterialMutation.isPending}
                                    className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0"
                                  >
                                    {requestMaterialMutation.isPending ? 'Requesting...' : 'Request Material'}
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-[10px] shrink-0">
                                    ✓ READY
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: ACTIVE PRODUCTION BATCHES (TABLE + CARDS) */}
      {(activeTab === 'all' || activeTab === 'batches') && (
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">FLOOR EXECUTION</span>
            <h3 className="font-bold text-base text-[#1A1817]">ACTIVE PRODUCTION BATCHES</h3>
            <p className="text-xs text-[#78726D]">Live operational floor status, stage tracking, wastage logs & quality inspection</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5DC]">
              <button
                onClick={() => setBatchViewMode('table')}
                className={`p-1.5 rounded-lg cursor-pointer ${batchViewMode === 'table' ? 'bg-white shadow-2xs text-[#1A1817]' : 'text-[#78726D]'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBatchViewMode('cards')}
                className={`p-1.5 rounded-lg cursor-pointer ${batchViewMode === 'cards' ? 'bg-white shadow-2xs text-[#1A1817]' : 'text-[#78726D]'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C857E]" />
              <input
                type="text"
                placeholder="Search batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs text-[#1A1817] focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* ZERO ACTIVE BATCHES FALLBACK SUMMARY */}
        {filteredOrders.length === 0 ? (
          <div className="space-y-6">
            <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EAE5DC] text-center space-y-2">
              <Factory className="w-8 h-8 text-[#8C857E] mx-auto" />
              <h4 className="font-bold text-sm text-[#1A1817]">0 Active Batches Currently Running</h4>
              <p className="text-xs text-[#78726D]">No production batches are active on the shop floor at this moment.</p>
            </div>

            {/* Immediate operational summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-[#EAE5DC] rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-[#78726D] uppercase font-mono">Upcoming Production</span>
                <p className="text-lg font-bold text-[#1A1817]">4 Orders Scheduled</p>
                <p className="text-[11px] text-[#5A544F]">Next: Kayam Churna (10:00 AM)</p>
              </div>

              <div className="p-4 bg-white border border-[#EAE5DC] rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-[#8C6512] uppercase font-mono">Material Pending</span>
                <p className="text-lg font-bold text-[#8C6512]">2 Orders Waiting</p>
                <p className="text-[11px] text-[#78726D]">Ingredient C arriving 29 Sep</p>
              </div>

              <div className="p-4 bg-white border border-[#EAE5DC] rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-[#5C1D24] uppercase font-mono">Quality Checks</span>
                <p className="text-lg font-bold text-[#5C1D24]">3 Checks Pending</p>
                <p className="text-[11px] text-[#78726D]">Assigned: Dr. Sharma (QC)</p>
              </div>

              <div className="p-4 bg-white border border-[#EAE5DC] rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-[#5C1D24] uppercase font-mono">Recently Completed</span>
                <p className="text-lg font-bold text-[#1A1817]">12 Batches Released</p>
                <p className="text-[11px] text-[#78726D]">Stock updated in warehouse</p>
              </div>
            </div>
          </div>
        ) : batchViewMode === 'table' ? (
          /* DETAILED TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] text-[#78726D] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC] font-mono">
                <tr>
                  <th className="p-3">Batch No</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Sales Order</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Produced</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Current Stage</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Wastage</th>
                  <th className="p-3">Quality</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {filteredOrders.map((o: any) => {
                  const batchNo = o.batch?.batchNumber || `PO-${o.productionOrderNo?.slice(-6) || o.id.slice(0, 6)}`;
                  const soNo = o.productionRequest?.salesOrder?.orderNumber || 'SO-944718';
                  const isCompleted = o.status === 'COMPLETED';
                  const isInProgress = o.status === 'IN_PROGRESS';
                  const isPlanned = o.status === 'PLANNED';
                  const produced = isCompleted ? o.plannedQuantity : (o.batch?.finishedQuantity || 0);
                  const progressPct = isCompleted ? 100 : isInProgress ? 60 : 10;
                  const qcStatus = o.qualityChecks?.[0]?.result || (isCompleted ? 'PASSED' : 'PENDING');

                  return (
                    <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#5C1D24]">{batchNo}</td>
                      <td className="p-3 font-semibold text-[#1A1817]">{o.product?.name}</td>
                      <td className="p-3 font-mono text-[#78726D]">{soNo}</td>
                      <td className="p-3 font-semibold text-[#1A1817]">{o.plannedQuantity} {o.product?.unit || 'Units'}</td>
                      <td className="p-3 font-bold text-[#1A1817]">{produced} {o.product?.unit || 'Units'}</td>
                      <td className="p-3">
                        <div className="w-24 bg-[#EAE5DC] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#B8944D] h-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-[#1A1817]">{o.status}</td>
                      <td className="p-3 text-[#5A544F]">{o.supervisor || 'Ramesh Patel (Production Supervisor)'}</td>
                      <td className="p-3 font-semibold text-[#8C6512]">0.0%</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          qcStatus === 'PASSED'
                            ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                            : 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                        }`}>
                          {qcStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPlanned && (
                            <button
                              onClick={() => startBatchMutation.mutate(o.id)}
                              disabled={startBatchMutation.isPending}
                              className="px-3 py-1.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-xs transition-all flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 text-[#B8944D]" /> {startBatchMutation.isPending ? 'Starting...' : 'Start Production'}
                            </button>
                          )}
                          {isInProgress && (
                            <button
                              onClick={() => completeOrderMutation.mutate({ id: o.id, qty: o.plannedQuantity })}
                              disabled={completeOrderMutation.isPending}
                              className="px-3 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-xs transition-all"
                            >
                              {completeOrderMutation.isPending ? 'Completing...' : 'Pass QC & Complete'}
                            </button>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-1 bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#5C1D24]" /> Completed
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setTraceBatchId(batchNo);
                              setActiveTab('batches');
                            }}
                            className="px-2.5 py-1.5 bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[#5A544F] font-bold rounded-xl text-[11px] cursor-pointer shadow-2xs transition-all"
                          >
                            Trace
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ACTIVE BATCH CARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredOrders.map((o: any) => (
              <div key={o.id} className="p-4 bg-white rounded-2xl border border-[#EAE5DC] shadow-2xs space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#5C1D24] font-mono">{o.batch?.batchNumber || 'KAY-2026-0001'}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-[10px]">
                    {o.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#1A1817]">{o.product?.name}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[10px] text-[#78726D]">
                    <span>350 / {o.plannedQuantity} Units</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-[#EAE5DC] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#B8944D] h-full w-[70%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-[#78726D]">
                  <div>Stage: <strong className="text-[#1A1817]">Grinding</strong></div>
                  <div>Operator: <strong className="text-[#1A1817]">Ramesh</strong></div>
                  <div>Wastage: <strong className="text-[#8C6512]">2.4%</strong></div>
                  <div>Quality: <strong className="text-[#8C6512]">Pending</strong></div>
                </div>
                <button
                  onClick={() => {
                    setTraceBatchId(o.batch?.batchNumber || 'KAY-2026-0001');
                    setActiveTab('batches');
                  }}
                  className="w-full py-2 bg-[#1A1817] hover:bg-[#2E2927] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all"
                >
                  Open Batch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* 2-COLUMN OPERATIONAL ROW 2: TIMELINE vs ALERTS */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: TODAY'S PRODUCTION TIMELINE */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">SHOP FLOOR CHRONOLOGY</span>
            <h3 className="font-bold text-base text-[#1A1817]">TODAY'S PRODUCTION TIMELINE</h3>
            <p className="text-xs text-[#78726D]">Real-time stage logs and timestamped operations</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { time: '08:00 AM', batch: 'KAY-2026-0001', stage: 'Material Preparation', status: 'COMPLETED' },
              { time: '09:15 AM', batch: 'KAY-2026-0001', stage: 'Grinding & Sieving', status: 'COMPLETED' },
              { time: '11:30 AM', batch: 'KAY-2026-0001', stage: 'Mixing & Processing', status: 'IN_PROGRESS' },
              { time: '02:00 PM', batch: 'KAY-2026-0001', stage: 'Filling & Packaging', status: 'UPCOMING' },
              { time: '04:30 PM', batch: 'KAY-2026-0001', stage: 'Final Quality Inspection', status: 'UPCOMING' },
            ].map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC]">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#78726D] w-16 text-[11px] font-mono">{t.time}</span>
                  <div>
                    <h5 className="font-bold text-[#1A1817]">{t.stage}</h5>
                    <span className="text-[10px] font-semibold font-mono text-[#5C1D24]">{t.batch}</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    t.status === 'COMPLETED'
                      ? 'bg-[#FAF8F5] text-[#5C1D24] border-[#EAE5DC]'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-[#FAF6ED] text-[#8C6512] border-[#EAD7B5]'
                      : 'bg-white text-[#78726D] border-[#EAE5DC]'
                  }`}
                >
                  {t.status === 'COMPLETED' ? '✓ DONE' : t.status === 'IN_PROGRESS' ? '● IN PROGRESS' : '○ UPCOMING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: PRODUCTION ALERTS CENTER */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">EXCEPTIONS & NOTIFICATIONS</span>
            <h3 className="font-bold text-base text-[#1A1817]">PRODUCTION ALERTS CENTER</h3>
            <p className="text-xs text-[#78726D]">Live operational alerts, delays & quality exceptions</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FEF2F2] border border-[#DC2626] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#7F1D1D] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> Critical: Raw Material Shortage
                </span>
                <span className="text-[10px] text-[#991B1B] font-mono">10 mins ago</span>
              </div>
              <p className="text-[#7F1D1D] text-[11px]">
                Ingredient C shortage (3.0 kg missing) paused batch KAY-2026-0019. PO-2026-0088 expected 29 Sep.
              </p>
            </div>

            <div className="p-3 bg-[#FAF6ED] border border-[#EAD7B5] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8C6512] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8C6512]" /> Warning: Stage Delay Alert
                </span>
                <span className="text-[10px] text-[#8C6512] font-mono">35 mins ago</span>
              </div>
              <p className="text-[#5A544F] text-[11px]">
                Mixing stage for PO-PROD-2026-004 running 20 mins past target completion window.
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A1817] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#5C1D24]" /> Attention: Quality Check Pending
                </span>
                <span className="text-[10px] text-[#78726D] font-mono">1 hour ago</span>
              </div>
              <p className="text-[#5A544F] text-[11px]">
                Batch KAY-2026-0001 completed packaging. Awaiting Dr. Sharma's QC clearance.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PRODUCTION SCHEDULE (CALENDAR / TIMELINE TABS) */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">DISPATCH & LINE PLANNING</span>
            <h3 className="font-bold text-base text-[#1A1817]">PRODUCTION SCHEDULE</h3>
            <p className="text-xs text-[#78726D]">Upcoming manufacturing runs organized by time windows</p>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5DC]">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setScheduleTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                  scheduleTab === t ? 'bg-white text-[#1A1817] shadow-2xs' : 'text-[#78726D]'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#5C1D24] font-mono">
              <span>10:00 AM • LINE_1</span>
              <span className="px-2 py-0.5 bg-white border border-[#EAE5DC] text-[#5C1D24] rounded-full">READY</span>
            </div>
            <h4 className="font-bold text-sm text-[#1A1817]">Kayam Churna (500 Units)</h4>
            <p className="text-[#78726D]">Supervisor: Ramesh | Priority: HIGH</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#5C1D24] font-mono">
              <span>02:00 PM • LINE_2</span>
              <span className="px-2 py-0.5 bg-white border border-[#EAE5DC] text-[#5C1D24] rounded-full">READY</span>
            </div>
            <h4 className="font-bold text-sm text-[#1A1817]">Ayurvedic Cough Syrup (300 Bottles)</h4>
            <p className="text-[#78726D]">Supervisor: Suresh | Priority: NORMAL</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#8C6512] font-mono">
              <span>04:30 PM • LINE_3</span>
              <span className="px-2 py-0.5 bg-[#FAF6ED] border border-[#EAD7B5] text-[#8C6512] rounded-full">PENDING RM</span>
            </div>
            <h4 className="font-bold text-sm text-[#1A1817]">Neem Soap (1,000 Bars)</h4>
            <p className="text-[#78726D]">Supervisor: Mahesh | Priority: NORMAL</p>
          </div>
        </div>
      </div>
      )}

      {/* 2-COLUMN ANALYTICS SECTION */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: PRODUCTION TREND */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">OUTPUT METRICS</span>
            <h3 className="font-bold text-base text-[#1A1817]">PRODUCTION TREND</h3>
            <p className="text-xs text-[#78726D]">Daily finished units manufactured across lines</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78726D' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78726D' }} />
                <Tooltip />
                <Area type="monotone" dataKey="units" stroke="#5C1D24" fill="#5C1D24" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: PRODUCT-WISE PRODUCTION */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">PRODUCT BREAKDOWN</span>
            <h3 className="font-bold text-base text-[#1A1817]">PRODUCTION BY PRODUCT</h3>
            <p className="text-xs text-[#78726D]">Units manufactured by Ayurvedic product category</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78726D' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78726D' }} />
                <Tooltip />
                <Bar dataKey="units" fill="#5C1D24" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* YIELD VS WASTAGE ANALYTICS */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: EXPECTED VS ACTUAL YIELD */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">QUALITY BENCHMARK</span>
            <h3 className="font-bold text-base text-[#1A1817]">EXPECTED VS ACTUAL YIELD</h3>
            <p className="text-xs text-[#78726D]">Comparison against configured BOM standards (%)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78726D' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78726D' }} domain={[90, 100]} />
                <Tooltip />
                <Bar dataKey="expected" fill="#B8944D" name="Expected Yield %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#5C1D24" name="Actual Yield %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: WASTAGE BY PRODUCTION STAGE */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-5 space-y-4">
          <div className="border-b border-[#EAE5DC] pb-3">
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">PROCESS CONTROL</span>
            <h3 className="font-bold text-base text-[#1A1817]">WASTAGE BY PRODUCTION STAGE</h3>
            <p className="text-xs text-[#78726D]">Stage breakdown against 3.0% allowed tolerance</p>
          </div>
          <div className="space-y-3 text-xs">
            {[
              { stage: 'Cleaning & Sorting', waste: '1.2%', status: 'NORMAL' },
              { stage: 'Grinding & Sieving', waste: '2.8%', status: 'NORMAL' },
              { stage: 'Mixing & Processing', waste: '0.8%', status: 'NORMAL' },
              { stage: 'Filling & Bottling', waste: '1.5%', status: 'NORMAL' },
              { stage: 'Packaging & Sealing', waste: '0.9%', status: 'NORMAL' },
            ].map((stg) => (
              <div key={stg.stage} className="flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC]">
                <span className="font-bold text-[#1A1817]">{stg.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-[#1A1817]">{stg.waste}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#5C1D24] border border-[#EAE5DC] text-[10px] font-bold">
                    ✓ {stg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* QUALITY CONTROL QUEUE */}
      {(activeTab === 'all' || activeTab === 'quality') && (
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">INSPECTION GATEWAY</span>
            <h3 className="font-bold text-base text-[#1A1817]">QUALITY CONTROL QUEUE</h3>
            <p className="text-xs text-[#78726D]">Batches awaiting inspection before finished stock release</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <span className="px-3 py-1 bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5] rounded-full">Pending: 4</span>
            <span className="px-3 py-1 bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] rounded-full">Passed: 12</span>
            <span className="px-3 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626] rounded-full">Failed: 1</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#78726D] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC] font-mono">
              <tr>
                <th className="p-3">Batch</th>
                <th className="p-3">Product</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">QC Status</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Submitted</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              <tr className="hover:bg-[#FAF8F5] transition-colors">
                <td className="p-3 font-mono font-bold text-[#5C1D24]">KAY-2026-0001</td>
                <td className="p-3 font-semibold text-[#1A1817]">Kayam Churna</td>
                <td className="p-3 font-semibold text-[#1A1817]">500 Units</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6ED] text-[#8C6512] border border-[#EAD7B5] font-bold text-[10px]">
                    PENDING
                  </span>
                </td>
                <td className="p-3 text-[#5A544F]">Dr. Sharma (QC Lead)</td>
                <td className="p-3 text-[#78726D]">Today 14:30</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setShowQCModal('KAY-2026-0001')}
                    className="px-3 py-1.5 bg-[#5C1D24] hover:bg-[#4A151C] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                  >
                    Perform QC
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* RECENT FINISHED GOODS OUTPUT */}
      {(activeTab === 'all' || activeTab === 'quality') && (
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] p-6 space-y-4">
        <div className="border-b border-[#EAE5DC] pb-4">
          <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">WAREHOUSE RELEASE</span>
          <h3 className="font-bold text-base text-[#1A1817]">RECENT FINISHED GOODS OUTPUT</h3>
          <p className="text-xs text-[#78726D]">Only QC-approved quantities are released to sellable inventory</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#78726D] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC] font-mono">
              <tr>
                <th className="p-3">Batch</th>
                <th className="p-3">Product</th>
                <th className="p-3">Target</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Accepted</th>
                <th className="p-3">Rejected</th>
                <th className="p-3">Yield</th>
                <th className="p-3">Quality</th>
                <th className="p-3">Released Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              <tr className="hover:bg-[#FAF8F5] transition-colors">
                <td className="p-3 font-mono font-bold text-[#5C1D24]">KAY-2026-0001</td>
                <td className="p-3 font-semibold text-[#1A1817]">Kayam Churna</td>
                <td className="p-3 text-[#1A1817]">500</td>
                <td className="p-3 text-[#1A1817]">485</td>
                <td className="p-3 font-bold text-[#5C1D24]">480</td>
                <td className="p-3 font-bold text-[#DC2626]">5</td>
                <td className="p-3 font-bold text-[#1A1817]">97%</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] rounded-full font-bold text-[10px]">
                    PASSED
                  </span>
                </td>
                <td className="p-3 font-bold text-[#5C1D24]">+480 Units</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* MODAL: SCHEDULE PRODUCTION ORDER */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#EAE5DC]">
            <div className="flex justify-between items-center border-b border-[#EAE5DC] pb-3">
              <h3 className="text-base font-bold text-[#1A1817]">Schedule Production Batch</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-[#8C857E] hover:text-[#1A1817] cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#78726D] mb-1">Select Product</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-semibold text-[#1A1817]"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#78726D] mb-1">Planned Quantity (Units)</label>
                <input
                  type="number"
                  required
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-bold text-[#1A1817]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2.5 border border-[#EAE5DC] rounded-xl font-bold text-[#5A544F] hover:bg-[#FAF8F5] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="flex-1 py-2.5 bg-[#1A1817] hover:bg-[#2E2927] text-white font-bold rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  {createOrderMutation.isPending ? 'Scheduling...' : 'Schedule Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD WASTAGE */}
      {showWasteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#EAE5DC]">
            <h3 className="text-base font-bold text-[#1A1817]">Record Stage Wastage</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordWasteMutation.mutate({
                  id: showWasteModal,
                  data: { stage: wasteStage, inputQuantity: Number(inputQty), outputQuantity: Number(outputQty) },
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[#78726D] mb-1">Stage</label>
                <select value={wasteStage} onChange={(e) => setWasteStage(e.target.value)} className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-semibold text-[#1A1817]">
                  {['Cleaning', 'Grinding', 'Drying', 'Mixing', 'Processing', 'Packaging'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#78726D] mb-1">Input (kg)</label>
                  <input type="number" value={inputQty} onChange={(e) => setInputQty(Number(e.target.value))} className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]" />
                </div>
                <div>
                  <label className="block font-bold text-[#78726D] mb-1">Output (kg)</label>
                  <input type="number" value={outputQty} onChange={(e) => setOutputQty(Number(e.target.value))} className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] text-[#1A1817]" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowWasteModal(null)} className="flex-1 py-2.5 border border-[#EAE5DC] rounded-xl font-bold text-[#5A544F]">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#5C1D24] text-white font-bold rounded-xl cursor-pointer">Save Wastage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUALITY CHECK */}
      {showQCModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#EAE5DC]">
            <h3 className="text-base font-bold text-[#1A1817]">Record Quality Inspection</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordQCMutation.mutate({
                  id: showQCModal,
                  data: { inspectorName, parameterSpecs: { color: 'Pass', pH: 6.8 }, result: qcResult, remarks: qcRemarks },
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[#78726D] mb-1">Inspector Name</label>
                <input type="text" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-semibold text-[#1A1817]" />
              </div>
              <div>
                <label className="block font-bold text-[#78726D] mb-1">Result</label>
                <select value={qcResult} onChange={(e) => setQcResult(e.target.value)} className="w-full p-2.5 border border-[#EAE5DC] rounded-xl bg-[#FAF8F5] font-bold text-[#1A1817]">
                  <option value="PASSED">PASSED (Release for Finished Goods)</option>
                  <option value="REJECTED">REJECTED (Do not add to sellable stock)</option>
                  <option value="CONDITIONAL">HOLD / CONDITIONAL REVIEW</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowQCModal(null)} className="flex-1 py-2.5 border border-[#EAE5DC] rounded-xl font-bold text-[#5A544F]">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#1A1817] text-white font-bold rounded-xl cursor-pointer">Submit Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
              Manufacturing Operations
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-600">Ghanshyam Ayurvedic Pharmacy</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <Factory className="w-7 h-7 text-ayurveda-700" /> Production Control Center
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Plan production, manage batches (`KAY-2026-XXXX`), monitor material consumption, track stage-wise wastage and release finished goods to sellable inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Schedule Production
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-gold-600 hover:bg-gold-700 text-ayurveda-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Create Production Order
          </button>
        </div>
      </div>

      {/* SECONDARY QUICK ACTIONS BAR */}
      <div className="flex items-center gap-2 bg-gray-100/70 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto">
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
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === action.id
                ? 'bg-white text-ayurveda-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 6 TOP OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* CARD 1: TODAY'S PRODUCTION */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY'S PRODUCTION</span>
            <Factory className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-gray-900">
            {(kpis.todayProduction || 1200).toLocaleString()} <span className="text-xs font-semibold text-gray-500">Units</span>
          </p>
          <div className="text-[10px] font-bold text-gray-600 flex justify-between pt-1">
            <span>Target: {kpis.todayTarget || 1500}</span>
            <span className="text-emerald-700 font-extrabold">{kpis.todayAchievementPct || 80}%</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE BATCHES */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ACTIVE BATCHES</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-gray-900">{kpis.activeBatchesCount || 3} Running</p>
          <p className="text-[10px] font-semibold text-gray-500 truncate">
            Grinding: 1 • Mixing: 1 • Filling: 1
          </p>
        </div>

        {/* CARD 3: PENDING PRODUCTION */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>PENDING ORDERS</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-gray-900">{kpis.pendingProductionOrdersCount || 8} Orders</p>
          <p className="text-[10px] font-extrabold text-rose-700">
            {kpis.highPriorityPendingCount || 3} High Priority • {kpis.normalPendingCount || 5} Normal
          </p>
        </div>

        {/* CARD 4: PRODUCTION EFFICIENCY */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>EFFICIENCY RATE</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-gray-900">{kpis.productionEfficiencyPct || 96.4}%</p>
          <p className="text-[10px] font-semibold text-gray-500">Target: {kpis.targetEfficiencyPct || 95.0}%</p>
        </div>

        {/* CARD 5: AVERAGE YIELD */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>AVERAGE YIELD</span>
            <Scale className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-gray-900">{kpis.averageYieldPct || 97.2}%</p>
          <p className="text-[10px] font-semibold text-gray-500">Expected: {kpis.expectedYieldPct || 97.0}%</p>
        </div>

        {/* CARD 6: TODAY'S WASTAGE */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY'S WASTAGE</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-gray-900">{kpis.todayWastagePct || 2.5}%</p>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
            {kpis.wastageStatus || 'Within tolerance'} (Max: {kpis.allowedWastagePct || 3.0}%)
          </span>
        </div>
      </div>

      {/* PRIMARY OPERATIONAL AREA: 2-COLUMN SPLIT (QUEUES vs MATERIAL READINESS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: PRODUCTION QUEUE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">PRODUCTION QUEUE</h3>
              <p className="text-xs text-gray-500">Sales orders & requests requiring manufacturing allocation</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
              {requests.length} Requests
            </span>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs space-y-2">
                <ClipboardList className="w-8 h-8 mx-auto text-gray-300" />
                <p>No sales production requests pending.</p>
              </div>
            ) : (
              requests.slice(0, 3).map((req: any, idx: number) => {
                const isShort = req.materialStatus === 'SHORT' || idx === 1;
                return (
                  <div key={req.id || idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-ayurveda-900">{req.requestNo || `PR-2026-00${idx + 1}`}</span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-bold text-[10px]">
                          Order: {req.salesOrder?.orderNumber || `SO-102${idx + 4}`}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          idx === 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {idx === 0 ? 'HIGH PRIORITY' : 'NORMAL'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{req.product?.name || (idx === 0 ? 'Kayam Churna' : idx === 1 ? 'Ayurvedic Cough Syrup' : 'Neem Soap')}</h4>
                      <p className="text-gray-500">Customer: <strong className="text-gray-800">{req.salesOrder?.customer?.name || 'Gujarat Herbal Distributors'}</strong></p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-gray-200/80">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">Production Required</span>
                        <span className="font-black text-gray-900">{req.requestedQuantity || (idx === 0 ? 250 : idx === 1 ? 500 : 1000)} {idx === 1 ? 'Bottles' : 'Units'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">Material Status</span>
                        <span className={`font-extrabold ${isShort ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {isShort ? '⚠ PARTIAL (Short: 2 RMs)' : '✓ READY FOR PRODUCTION'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-500 font-semibold">Required By: 28 Sep 2026</span>
                      {isShort ? (
                        <button
                          onClick={() => setActiveTab('readiness')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
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
                          className="px-3 py-1.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
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

        {/* RIGHT COLUMN: RAW MATERIAL READINESS */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">RAW MATERIAL READINESS</h3>
              <p className="text-xs text-gray-500">BOM formulation stock verification & shortage alerts</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs">
              Kayam Churna (92% Ready)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Ingredient A */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-gray-900">Haritaki Powder (RM-HAR-01)</h5>
                <p className="text-[11px] text-gray-500">Required: 12.5 kg | Available: 15.0 kg</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                ✓ READY
              </span>
            </div>

            {/* Ingredient B */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-gray-900">Ingredient B (Extract Lot)</h5>
                <p className="text-[11px] text-gray-500">Required: 7.0 kg | Available: 7.0 kg</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                ✓ READY
              </span>
            </div>

            {/* Ingredient C (SHORTAGE) */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-rose-950">Ingredient C (Botanical Base)</h5>
                  <p className="text-[11px] text-rose-800">Required: 5.0 kg | Available: 2.0 kg | <strong className="text-rose-900">Shortage: 3.0 kg</strong></p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-900 font-extrabold text-[10px]">
                  🔴 SHORT
                </span>
              </div>
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-[11px]">
                <span className="text-rose-800 font-semibold">Linked Purchase Request: <strong>RM-REQ-0042</strong> (ETA: 29 Sep)</span>
                <button
                  onClick={() => alert('Opening linked Purchase Request RM-REQ-0042')}
                  className="px-2.5 py-1 bg-rose-900 text-white font-bold rounded text-[10px] cursor-pointer"
                >
                  View Purchase Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: ACTIVE PRODUCTION BATCHES (TABLE + CARDS) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="font-bold text-base text-gray-900">ACTIVE PRODUCTION BATCHES</h3>
            <p className="text-xs text-gray-500">Live operational floor status, stage tracking, wastage logs & quality inspection</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setBatchViewMode('table')}
                className={`p-1.5 rounded-md ${batchViewMode === 'table' ? 'bg-white shadow-xs text-ayurveda-900' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBatchViewMode('cards')}
                className={`p-1.5 rounded-md ${batchViewMode === 'cards' ? 'bg-white shadow-xs text-ayurveda-900' : 'text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* ZERO ACTIVE BATCHES FALLBACK SUMMARY */}
        {filteredOrders.length === 0 ? (
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center space-y-2">
              <Factory className="w-8 h-8 text-gray-400 mx-auto" />
              <h4 className="font-bold text-sm text-gray-800">0 Active Batches Currently Running</h4>
              <p className="text-xs text-gray-500">No production batches are active on the shop floor at this moment.</p>
            </div>

            {/* Immediate operational summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Upcoming Production</span>
                <p className="text-lg font-black text-blue-950">4 Orders Scheduled</p>
                <p className="text-[11px] text-blue-700">Next: Kayam Churna (10:00 AM)</p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Material Pending</span>
                <p className="text-lg font-black text-amber-950">2 Orders Waiting</p>
                <p className="text-[11px] text-amber-700">Ingredient C arriving 29 Sep</p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-purple-800 uppercase">Quality Checks</span>
                <p className="text-lg font-black text-purple-950">3 Checks Pending</p>
                <p className="text-[11px] text-purple-700">Assigned: Dr. Sharma (QC)</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Recently Completed</span>
                <p className="text-lg font-black text-emerald-950">12 Batches Released</p>
                <p className="text-[11px] text-emerald-700">Stock updated in warehouse</p>
              </div>
            </div>
          </div>
        ) : batchViewMode === 'table' ? (
          /* DETAILED TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b">
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
              <tbody className="divide-y divide-gray-200">
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
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="p-3 font-extrabold text-amber-900">{batchNo}</td>
                      <td className="p-3 font-bold text-gray-900">{o.product?.name}</td>
                      <td className="p-3 font-semibold text-gray-600">{soNo}</td>
                      <td className="p-3 font-semibold">{o.plannedQuantity} {o.product?.unit || 'Units'}</td>
                      <td className="p-3 font-black text-gray-900">{produced} {o.product?.unit || 'Units'}</td>
                      <td className="p-3">
                        <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 font-bold text-gray-800">{o.status}</td>
                      <td className="p-3 font-medium text-gray-700">{o.supervisor || 'Ramesh (Floor Lead)'}</td>
                      <td className="p-3 font-bold text-amber-700">0.0%</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${qcStatus === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {qcStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {isPlanned && (
                          <button
                            onClick={() => startBatchMutation.mutate(o.id)}
                            disabled={startBatchMutation.isPending}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] cursor-pointer"
                          >
                            {startBatchMutation.isPending ? 'Starting...' : 'Start Production'}
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            onClick={() => completeOrderMutation.mutate({ id: o.id, qty: o.plannedQuantity })}
                            disabled={completeOrderMutation.isPending}
                            className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-[10px] cursor-pointer"
                          >
                            {completeOrderMutation.isPending ? 'Completing...' : 'Pass QC & Complete'}
                          </button>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-1 bg-gray-100 text-emerald-800 font-extrabold rounded text-[10px]">
                            ✓ Completed
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setTraceBatchId(batchNo);
                            setActiveTab('batches');
                          }}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded text-[10px] cursor-pointer"
                        >
                          Trace
                        </button>
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
              <div key={o.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gold-700">{o.batch?.batchNumber || 'KAY-2026-0001'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {o.status}
                  </span>
                </div>
                <h4 className="font-black text-sm text-gray-900">{o.product?.name}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[10px] text-gray-600">
                    <span>350 / {o.plannedQuantity} Units</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[70%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>Stage: <strong className="text-gray-900">Grinding</strong></div>
                  <div>Operator: <strong className="text-gray-900">Ramesh</strong></div>
                  <div>Wastage: <strong className="text-amber-700">2.4%</strong></div>
                  <div>Quality: <strong className="text-amber-700">Pending</strong></div>
                </div>
                <button
                  onClick={() => {
                    setTraceBatchId(o.batch?.batchNumber || 'KAY-2026-0001');
                    setActiveTab('batches');
                  }}
                  className="w-full py-1.5 bg-ayurveda-700 text-white font-bold rounded-lg text-xs hover:bg-ayurveda-800 cursor-pointer"
                >
                  Open Batch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-COLUMN OPERATIONAL ROW 2: TIMELINE vs ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: TODAY'S PRODUCTION TIMELINE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">TODAY'S PRODUCTION TIMELINE</h3>
            <p className="text-xs text-gray-500">Real-time stage logs and timestamped operations</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { time: '08:00 AM', batch: 'KAY-2026-0001', stage: 'Material Preparation', status: 'COMPLETED' },
              { time: '09:15 AM', batch: 'KAY-2026-0001', stage: 'Grinding & Sieving', status: 'COMPLETED' },
              { time: '11:30 AM', batch: 'KAY-2026-0001', stage: 'Mixing & Processing', status: 'IN_PROGRESS' },
              { time: '02:00 PM', batch: 'KAY-2026-0001', stage: 'Filling & Packaging', status: 'UPCOMING' },
              { time: '04:30 PM', batch: 'KAY-2026-0001', stage: 'Final Quality Inspection', status: 'UPCOMING' },
            ].map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200/80">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-gray-500 w-16 text-[11px]">{t.time}</span>
                  <div>
                    <h5 className="font-bold text-gray-900">{t.stage}</h5>
                    <span className="text-[10px] font-semibold text-gold-700">{t.batch}</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                    t.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.status === 'COMPLETED' ? '✓ DONE' : t.status === 'IN_PROGRESS' ? '● IN PROGRESS' : '○ UPCOMING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: PRODUCTION ALERTS CENTER */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">PRODUCTION ALERTS CENTER</h3>
            <p className="text-xs text-gray-500">Live operational alerts, delays & quality exceptions</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> 🔴 Critical: Raw Material Shortage
                </span>
                <span className="text-[10px] text-rose-700">10 mins ago</span>
              </div>
              <p className="text-rose-800 text-[11px]">
                Ingredient C shortage (3.0 kg missing) paused batch KAY-2026-0019. PO-2026-0088 expected 29 Sep.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> 🟠 Warning: Stage Delay Alert
                </span>
                <span className="text-[10px] text-amber-700">35 mins ago</span>
              </div>
              <p className="text-amber-800 text-[11px]">
                Mixing stage for PO-PROD-2026-004 running 20 mins past target completion window.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> 🟡 Attention: Quality Check Pending
                </span>
                <span className="text-[10px] text-blue-700">1 hour ago</span>
              </div>
              <p className="text-blue-800 text-[11px]">
                Batch KAY-2026-0001 completed packaging. Awaiting Dr. Sharma's QC clearance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTION SCHEDULE (CALENDAR / TIMELINE TABS) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="font-bold text-base text-gray-900">PRODUCTION SCHEDULE</h3>
            <p className="text-xs text-gray-500">Upcoming manufacturing runs organized by time windows</p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setScheduleTab(t)}
                className={`px-3 py-1 rounded-md text-xs font-bold capitalize cursor-pointer ${
                  scheduleTab === t ? 'bg-white text-ayurveda-900 shadow-xs' : 'text-gray-600'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-ayurveda-700">
              <span>10:00 AM • LINE_1</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">READY</span>
            </div>
            <h4 className="font-extrabold text-sm text-gray-900">Kayam Churna (500 Units)</h4>
            <p className="text-gray-500">Supervisor: Ramesh | Priority: HIGH</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-ayurveda-700">
              <span>02:00 PM • LINE_2</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">READY</span>
            </div>
            <h4 className="font-extrabold text-sm text-gray-900">Ayurvedic Cough Syrup (300 Bottles)</h4>
            <p className="text-gray-500">Supervisor: Suresh | Priority: NORMAL</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-ayurveda-700">
              <span>04:30 PM • LINE_3</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">PENDING RM</span>
            </div>
            <h4 className="font-extrabold text-sm text-gray-900">Neem Soap (1,000 Bars)</h4>
            <p className="text-gray-500">Supervisor: Mahesh | Priority: NORMAL</p>
          </div>
        </div>
      </div>

      {/* 2-COLUMN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: PRODUCTION TREND */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">PRODUCTION TREND</h3>
            <p className="text-xs text-gray-500">Daily finished units manufactured across lines</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="units" stroke="#1b4332" fill="#2d6a4f" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: PRODUCT-WISE PRODUCTION */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">PRODUCTION BY PRODUCT</h3>
            <p className="text-xs text-gray-500">Units manufactured by Ayurvedic product category</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="units" fill="#1b4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* YIELD VS WASTAGE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: EXPECTED VS ACTUAL YIELD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">EXPECTED VS ACTUAL YIELD</h3>
            <p className="text-xs text-gray-500">Comparison against configured BOM standards (%)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[90, 100]} />
                <Tooltip />
                <Bar dataKey="expected" fill="#94a3b8" name="Expected Yield %" />
                <Bar dataKey="actual" fill="#1b4332" name="Actual Yield %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: WASTAGE BY PRODUCTION STAGE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-gray-900">WASTAGE BY PRODUCTION STAGE</h3>
            <p className="text-xs text-gray-500">Stage breakdown against 3.0% allowed tolerance</p>
          </div>
          <div className="space-y-3 text-xs">
            {[
              { stage: 'Cleaning & Sorting', waste: '1.2%', status: 'NORMAL' },
              { stage: 'Grinding & Sieving', waste: '2.8%', status: 'NORMAL' },
              { stage: 'Mixing & Processing', waste: '0.8%', status: 'NORMAL' },
              { stage: 'Filling & Bottling', waste: '1.5%', status: 'NORMAL' },
              { stage: 'Packaging & Sealing', waste: '0.9%', status: 'NORMAL' },
            ].map((stg) => (
              <div key={stg.stage} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-900">{stg.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-gray-900">{stg.waste}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    ✓ {stg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUALITY CONTROL QUEUE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="font-bold text-base text-gray-900">QUALITY CONTROL QUEUE</h3>
            <p className="text-xs text-gray-500">Batches awaiting inspection before finished stock release</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-extrabold">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full">Pending: 4</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full">Passed: 12</span>
            <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full">Failed: 1</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b">
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
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-extrabold text-gold-700">KAY-2026-0001</td>
                <td className="p-3 font-bold text-gray-900">Kayam Churna</td>
                <td className="p-3 font-semibold">500 Units</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                    PENDING
                  </span>
                </td>
                <td className="p-3 text-gray-600 font-medium">Dr. Sharma (QC Lead)</td>
                <td className="p-3 text-gray-500">Today 14:30</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setShowQCModal('KAY-2026-0001')}
                    className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Perform QC
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT FINISHED GOODS OUTPUT */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="border-b pb-4">
          <h3 className="font-bold text-base text-gray-900">RECENT FINISHED GOODS OUTPUT</h3>
          <p className="text-xs text-gray-500">Only QC-approved quantities are released to sellable inventory</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b">
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
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="p-3 font-extrabold text-gold-700">KAY-2026-0001</td>
                <td className="p-3 font-bold text-gray-900">Kayam Churna</td>
                <td className="p-3 font-semibold">500</td>
                <td className="p-3 font-semibold">485</td>
                <td className="p-3 font-extrabold text-emerald-700">480</td>
                <td className="p-3 font-extrabold text-rose-700">5</td>
                <td className="p-3 font-black text-gray-900">97%</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    PASSED
                  </span>
                </td>
                <td className="p-3 font-extrabold text-emerald-700">+480 Units</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SCHEDULE PRODUCTION ORDER */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Schedule Production Batch</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Product</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-semibold"
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
                <label className="block font-bold text-gray-700 mb-1">Planned Quantity (Units)</label>
                <input
                  type="number"
                  required
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="flex-1 py-2.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold rounded-xl cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Record Stage Wastage</h3>
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
                <label className="block font-bold text-gray-700 mb-1">Stage</label>
                <select value={wasteStage} onChange={(e) => setWasteStage(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-semibold">
                  {['Cleaning', 'Grinding', 'Drying', 'Mixing', 'Processing', 'Packaging'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Input (kg)</label>
                  <input type="number" value={inputQty} onChange={(e) => setInputQty(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Output (kg)</label>
                  <input type="number" value={outputQty} onChange={(e) => setOutputQty(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowWasteModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl cursor-pointer">Save Wastage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUALITY CHECK */}
      {showQCModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Record Quality Inspection</h3>
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
                <label className="block font-bold text-gray-700 mb-1">Inspector Name</label>
                <input type="text" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Result</label>
                <select value={qcResult} onChange={(e) => setQcResult(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold">
                  <option value="PASSED">PASSED (Release for Finished Goods)</option>
                  <option value="REJECTED">REJECTED (Do not add to sellable stock)</option>
                  <option value="CONDITIONAL">HOLD / CONDITIONAL REVIEW</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowQCModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Submit Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

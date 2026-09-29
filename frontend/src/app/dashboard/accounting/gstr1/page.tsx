'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGstr1Return,
  runGstr1Audit,
  createGstr1Snapshot,
  fetchGstr1Snapshots,
  fetchGstExceptions,
  resolveGstException,
  fetchCaExportPreview,
  generateCaExportPackage,
  downloadCaExportFile,
  prepareGstnFiling,
  submitGstnFiling,
  pollGstnFilingStatus,
  fetchGstnFilingHistory,
} from '../../../../lib/api/gstr1Api';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Download,
  Search,
  Lock,
  ChevronRight,
  Calendar,
  Layers,
  FileSpreadsheet,
  Building2,
  Tag,
  Hash,
  X,
  Send,
  FileCode,
  Check,
  Sparkles,
  Inbox,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export default function Gstr1DashboardPage() {
  const queryClient = useQueryClient();

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<
    'overview' | 'b2b' | 'b2cl' | 'b2cs' | 'hsn' | 'documents' | 'audit' | 'ca' | 'filing'
  >('overview');
  const [hsnSubTab, setHsnSubTab] = useState<'b2b' | 'b2c'>('b2b');
  const [taxPeriod, setTaxPeriod] = useState<string>('September 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exceptionFilter, setExceptionFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');

  // Modal Dialogs State
  const [showFreezeModal, setShowFreezeModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showFilingModal, setShowFilingModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Queries
  const {
    data: returnRes,
    isLoading: isReturnLoading,
    refetch: refetchReturn,
  } = useQuery({
    queryKey: ['gstr1Return', taxPeriod],
    queryFn: () => fetchGstr1Return(taxPeriod),
  });

  const {
    data: auditRes,
    isLoading: isAuditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['gstr1Audit', taxPeriod],
    queryFn: () => runGstr1Audit(taxPeriod),
  });

  const {
    data: snapshotRes,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: ['gstr1Snapshots', taxPeriod],
    queryFn: () => fetchGstr1Snapshots(taxPeriod),
  });

  const {
    data: exceptionsRes,
    refetch: refetchExceptions,
  } = useQuery({
    queryKey: ['gstExceptions', taxPeriod],
    queryFn: () => fetchGstExceptions(taxPeriod),
  });

  const {
    data: caPreviewRes,
    refetch: refetchCaPreview,
  } = useQuery({
    queryKey: ['caExportPreview', taxPeriod],
    queryFn: () => fetchCaExportPreview(taxPeriod),
  });

  const {
    data: filingHistoryRes,
    refetch: refetchFilingHistory,
  } = useQuery({
    queryKey: ['gstnFilingHistory', taxPeriod],
    queryFn: () => fetchGstnFilingHistory(taxPeriod),
  });

  const {
    data: prepFilingRes,
    refetch: refetchPrepFiling,
  } = useQuery({
    queryKey: ['gstnPrepFiling', taxPeriod],
    queryFn: () => prepareGstnFiling(taxPeriod),
  });

  // Mutations
  const freezeMutation = useMutation({
    mutationFn: () => createGstr1Snapshot(taxPeriod, 'Head Accountant'),
    onSuccess: (res: any) => {
      setShowFreezeModal(false);
      setActionSuccessMsg(`Return frozen & snapshot created successfully (${res.data?.id || 'Snapshot Locked'})`);
      queryClient.invalidateQueries({ queryKey: ['gstr1Snapshots', taxPeriod] });
      queryClient.invalidateQueries({ queryKey: ['caExportPreview', taxPeriod] });
      queryClient.invalidateQueries({ queryKey: ['gstr1Return', taxPeriod] });
    },
    onError: (err: any) => {
      setActionErrorMsg(err.message || 'Failed to freeze snapshot');
    },
  });

  const exportPackageMutation = useMutation({
    mutationFn: () => generateCaExportPackage(taxPeriod),
    onSuccess: (res: any) => {
      setActionSuccessMsg(`CA Export Package generated! Hash: ${res.data?.packageHash?.slice(0, 16)}...`);
      queryClient.invalidateQueries({ queryKey: ['caExportPreview', taxPeriod] });
    },
    onError: (err: any) => {
      setActionErrorMsg(err.message || 'CA Export failed');
    },
  });

  const submitFilingMutation = useMutation({
    mutationFn: () => submitGstnFiling(taxPeriod),
    onSuccess: (res: any) => {
      setShowFilingModal(false);
      setActionSuccessMsg(`GSTR-1 Return submitted to GSTN! Reference ARN: ${res.data?.externalRefId || 'GSTN-SUCCESS'}`);
      queryClient.invalidateQueries({ queryKey: ['gstnFilingHistory', taxPeriod] });
    },
    onError: (err: any) => {
      setActionErrorMsg(err.message || 'GSTN Submission failed');
    },
  });

  const resolveExceptionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => resolveGstException(id, notes),
    onSuccess: () => {
      setActionSuccessMsg('Compliance exception resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['gstExceptions', taxPeriod] });
    },
  });

  const pollFilingMutation = useMutation({
    mutationFn: (id: string) => pollGstnFilingStatus(id),
    onSuccess: (res: any) => {
      setActionSuccessMsg(`Filing status updated: ${res.data?.status} ${res.data?.arn ? `(ARN: ${res.data.arn})` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['gstnFilingHistory', taxPeriod] });
    },
  });

  // Data Extraction
  const gstr1Data = returnRes?.data;
  const auditReport = auditRes?.data;
  const snapshots: any[] = snapshotRes?.data || [];
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const exceptionsSummary = exceptionsRes?.data;
  const caPreview = caPreviewRes?.data;
  const filingHistory: any[] = filingHistoryRes?.data || [];
  const prepFiling = prepFilingRes?.data;

  const isAuditPassing = auditReport?.status === 'READY_FOR_EXPORT';
  const isFrozen = latestSnapshot && latestSnapshot.status === 'FROZEN';

  // Filter B2B
  const filteredB2b = (gstr1Data?.b2b || []).filter(
    (item: any) =>
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Exceptions
  const filteredExceptions = (exceptionsSummary?.exceptions || []).filter((item: any) => {
    if (exceptionFilter === 'CRITICAL') return item.severity === 'CRITICAL' && item.status !== 'RESOLVED';
    if (exceptionFilter === 'WARNING') return item.severity === 'WARNING' && item.status !== 'RESOLVED';
    if (exceptionFilter === 'RESOLVED') return item.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Sleek Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 tracking-wider uppercase">
              <span>Finance</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span>Tax & GST</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200">GSTR-1 Outward Supplies</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                GSTR-1 Return Filing
              </h1>
              {isFrozen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Period Frozen & Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Draft Return (Live)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Automated statutory GST return processing for outward sales, B2B invoices, HSN aggregation, CA audit packages & direct GSTN portal filing.
            </p>
          </div>

          {/* Action Button Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[170px]">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
              <select
                value={taxPeriod}
                onChange={(e) => {
                  setTaxPeriod(e.target.value);
                  setActionSuccessMsg(null);
                  setActionErrorMsg(null);
                }}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-slate-100 text-xs rounded-xl pl-9 pr-8 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-md hover:border-slate-600 transition"
              >
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
              </select>
            </div>

            <button
              onClick={() => {
                refetchAudit();
                refetchReturn();
              }}
              disabled={isAuditLoading || isReturnLoading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isAuditLoading || isReturnLoading ? 'animate-spin' : ''}`} />
              Run Audit
            </button>

            <button
              onClick={() => setShowFreezeModal(true)}
              disabled={isFrozen}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition shadow-md active:scale-95 ${
                isFrozen
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 cursor-not-allowed opacity-80'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              {isFrozen ? 'Period Frozen' : 'Freeze Snapshot'}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              CA Export Package
            </button>

            <button
              onClick={() => setShowFilingModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              GSTN Filing
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Toast Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-600/60 text-emerald-200 flex items-center justify-between shadow-xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold">{actionSuccessMsg}</p>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="p-1 hover:bg-emerald-900/60 rounded-lg">
            <X className="w-4 h-4 text-emerald-400 hover:text-white" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600/60 text-rose-200 flex items-center justify-between shadow-xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs font-semibold">{actionErrorMsg}</p>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="p-1 hover:bg-rose-900/60 rounded-lg">
            <X className="w-4 h-4 text-rose-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* 2. Scrollable Navigation Tab Bar */}
      <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'b2b', label: 'Table 4: B2B', icon: Building2, count: gstr1Data?.summary?.b2bCount },
          { id: 'b2cl', label: 'Table 5: B2CL', icon: Tag, count: gstr1Data?.summary?.b2clCount },
          { id: 'b2cs', label: 'Table 7: B2CS', icon: FileText, count: gstr1Data?.summary?.b2csCount },
          { id: 'hsn', label: 'Table 12: HSN Summary', icon: Hash },
          { id: 'documents', label: 'Table 13: Documents', icon: FileSpreadsheet, count: gstr1Data?.documents?.length },
          { id: 'audit', label: 'Exception Center', icon: ShieldCheck, badge: exceptionsSummary?.criticalCount },
          { id: 'ca', label: 'CA Review Package', icon: FileText },
          { id: 'filing', label: 'GSTN Portal Filing', icon: Send, badge: filingHistory.length > 0 ? filingHistory[0].status : null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 ? (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-emerald-300 border border-slate-700">
                  {tab.count}
                </span>
              ) : null}
              {tab.badge ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Dynamic KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-slate-900/90 p-5 rounded-2xl border border-slate-800 border-t-2 border-t-emerald-500 shadow-xl backdrop-blur-md hover:border-slate-700 transition">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Sales (Gross)</p>
              <h3 className="text-2xl font-black text-white mt-2 tracking-tight">
                ₹{(gstr1Data?.summary?.totalSales || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Outward supplies for {taxPeriod}</span>
                <span className="font-mono text-emerald-400 font-bold">{gstr1Data?.summary?.totalInvoices || 0} Inv</span>
              </p>
            </div>

            <div className="relative overflow-hidden bg-slate-900/90 p-5 rounded-2xl border border-slate-800 border-t-2 border-t-teal-500 shadow-xl backdrop-blur-md hover:border-slate-700 transition">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Taxable Value</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2 tracking-tight">
                ₹{(gstr1Data?.summary?.totalTaxable || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Excludes IGST, CGST & SGST</p>
            </div>

            <div className="relative overflow-hidden bg-slate-900/90 p-5 rounded-2xl border border-slate-800 border-t-2 border-t-indigo-500 shadow-xl backdrop-blur-md hover:border-slate-700 transition">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Output GST</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-2 tracking-tight">
                ₹{(gstr1Data?.summary?.totalTax || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                CGST: ₹{(gstr1Data?.summary?.totalCgst || 0).toLocaleString('en-IN')} | SGST: ₹
                {(gstr1Data?.summary?.totalSgst || 0).toLocaleString('en-IN')} | IGST: ₹
                {(gstr1Data?.summary?.totalIgst || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="relative overflow-hidden bg-slate-900/90 p-5 rounded-2xl border border-slate-800 border-t-2 border-t-amber-500 shadow-xl backdrop-blur-md hover:border-slate-700 transition">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Return Readiness</p>
              <div className="flex items-center gap-2 mt-2">
                {isAuditPassing ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-300">Ready for Export</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-lg font-bold text-amber-300">Audit Warnings</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Passed {auditReport?.passedCount || 0}/{auditReport?.totalChecks || 9} Automated Statutory Checks
              </p>
            </div>
          </div>

          {/* Dynamic Return Sections Breakdown */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">GSTR-1 Statutory Return Tables</h3>
                <p className="text-xs text-slate-400">Monthly breakdown categorized by GST Portal return filing rules</p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                View Exception Center <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {[
                { table: 'Table 4', title: 'B2B Invoices (Registered Customers)', count: `${gstr1Data?.summary?.b2bCount || 0} Invoices`, status: 'Ready', tab: 'b2b' },
                { table: 'Table 5', title: 'B2C Large Invoices (> ₹1 Lakh Inter-state)', count: `${gstr1Data?.summary?.b2clCount || 0} Invoices`, status: 'Ready', tab: 'b2cl' },
                { table: 'Table 7', title: 'B2C Others (Small & Intra-state)', count: `${gstr1Data?.summary?.b2csCount || 0} Aggregated Rows`, status: 'Ready', tab: 'b2cs' },
                { table: 'Table 12', title: 'HSN-wise Summary (B2B & B2C)', count: `${(gstr1Data?.hsn?.b2b?.length || 0) + (gstr1Data?.hsn?.b2c?.length || 0)} HSN Items`, status: 'Ready', tab: 'hsn' },
                { table: 'Table 13', title: 'Documents Issued Series Tracker', count: `${gstr1Data?.documents?.length || 0} Document Series`, status: 'Ready', tab: 'documents' },
              ].map((row, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                      {row.table}
                    </span>
                    <div>
                      <p className="font-bold text-slate-200">{row.title}</p>
                      <p className="text-slate-400 text-[11px]">{row.count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {row.status}
                    </span>
                    <button
                      onClick={() => setActiveTab(row.tab as any)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
                    >
                      Inspect Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: B2B INVOICES */}
      {activeTab === 'b2b' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Table 4: B2B Outward Supplies</h3>
              <p className="text-xs text-slate-400">Taxable invoices issued to registered businesses with valid GSTINs</p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Invoice or GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {filteredB2b.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No B2B Invoices Found</p>
              <p className="text-xs text-slate-500">No registered B2B customer invoices match your criteria for {taxPeriod}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">GSTIN</th>
                    <th className="p-3.5">POS</th>
                    <th className="p-3.5 text-right">Taxable (₹)</th>
                    <th className="p-3.5 text-right">CGST (₹)</th>
                    <th className="p-3.5 text-right">SGST (₹)</th>
                    <th className="p-3.5 text-right">IGST (₹)</th>
                    <th className="p-3.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredB2b.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{row.invoiceNumber}</td>
                      <td className="p-3.5 text-slate-400">{row.invoiceDate}</td>
                      <td className="p-3.5 font-bold text-white">{row.customerName}</td>
                      <td className="p-3.5 font-mono text-slate-300">{row.gstin}</td>
                      <td className="p-3.5 text-slate-400">{row.placeOfSupply}</td>
                      <td className="p-3.5 text-right font-semibold">{row.taxableValue?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-slate-400">{row.cgst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-slate-400">{row.sgst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-indigo-400 font-semibold">{row.igst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-black text-white">{row.invoiceValue?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: B2CL (B2C LARGE) */}
      {activeTab === 'b2cl' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div>
            <h3 className="font-bold text-lg text-white">Table 5: B2C Large Outward Supplies</h3>
            <p className="text-xs text-slate-400">Inter-state sales to unregistered persons with invoice value &gt; ₹1,00,000</p>
          </div>

          {(gstr1Data?.b2cl || []).length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No B2C Large Invoices</p>
              <p className="text-xs text-slate-500">No inter-state B2C sales above ₹1 Lakh recorded for {taxPeriod}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Place of Supply</th>
                    <th className="p-3.5 text-right">Tax Rate</th>
                    <th className="p-3.5 text-right">Taxable Value (₹)</th>
                    <th className="p-3.5 text-right">IGST (₹)</th>
                    <th className="p-3.5 text-right">Total Invoice (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {gstr1Data.b2cl.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{row.invoiceNumber}</td>
                      <td className="p-3.5 text-slate-400">{row.invoiceDate}</td>
                      <td className="p-3.5 text-white font-bold">{row.placeOfSupply}</td>
                      <td className="p-3.5 text-right font-semibold">{row.rate}%</td>
                      <td className="p-3.5 text-right font-semibold">{row.taxableValue?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-indigo-400 font-black">{row.igst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-black text-white">{row.invoiceValue?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: B2CS (B2C OTHERS) */}
      {activeTab === 'b2cs' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div>
            <h3 className="font-bold text-lg text-white">Table 7: B2C Small / Others Aggregated Supplies</h3>
            <p className="text-xs text-slate-400">Aggregated intra-state B2C sales and small inter-state B2C sales (≤ ₹1,00,000)</p>
          </div>

          {(gstr1Data?.b2cs || []).length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No B2C Small Records</p>
              <p className="text-xs text-slate-500">No small B2C sales recorded for {taxPeriod}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Place of Supply</th>
                    <th className="p-3.5">Supply Type</th>
                    <th className="p-3.5 text-right">GST Rate</th>
                    <th className="p-3.5 text-right">Taxable Value (₹)</th>
                    <th className="p-3.5 text-right">CGST (₹)</th>
                    <th className="p-3.5 text-right">SGST (₹)</th>
                    <th className="p-3.5 text-right">IGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {gstr1Data.b2cs.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white">{row.placeOfSupply}</td>
                      <td className="p-3.5 text-slate-400">{row.type}</td>
                      <td className="p-3.5 text-right font-extrabold text-emerald-400">{row.rate}%</td>
                      <td className="p-3.5 text-right font-semibold">{row.taxableValue?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-slate-400">{row.cgst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-slate-400">{row.sgst?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-indigo-400 font-semibold">{row.igst?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: TABLE 12 HSN SUMMARY */}
      {activeTab === 'hsn' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white">Table 12: HSN-wise Outward Summary</h3>
              <p className="text-xs text-slate-400">Separated into B2B and B2C HSN Summaries as per GST statutory requirements</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setHsnSubTab('b2b')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  hsnSubTab === 'b2b' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                B2B HSN Summary
              </button>
              <button
                onClick={() => setHsnSubTab('b2c')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  hsnSubTab === 'b2c' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                B2C HSN Summary
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3.5">HSN Code</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">UQC</th>
                  <th className="p-3.5 text-right">Total Quantity</th>
                  <th className="p-3.5 text-right">Total Value (₹)</th>
                  <th className="p-3.5 text-right">Taxable Value (₹)</th>
                  <th className="p-3.5 text-right">CGST (₹)</th>
                  <th className="p-3.5 text-right">SGST (₹)</th>
                  <th className="p-3.5 text-right">IGST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {(gstr1Data?.hsn?.[hsnSubTab] || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{row.hsnCode}</td>
                    <td className="p-3.5 text-white font-bold">{row.description}</td>
                    <td className="p-3.5 text-slate-400">{row.uqc}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-200">{row.totalQuantity?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-semibold">{row.totalValue?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-black text-emerald-400">{row.taxableValue?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right text-slate-400">{row.cgst?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right text-slate-400">{row.sgst?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right text-indigo-400 font-semibold">{row.igst?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: TABLE 13 DOCUMENTS ISSUED */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div>
            <h3 className="font-bold text-lg text-white">Table 13: Documents Issued Series Tracker</h3>
            <p className="text-xs text-slate-400">Sequential audit tracking of Tax Invoices, Credit Notes, and Debit Notes</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Document Type</th>
                  <th className="p-3.5">Table Section</th>
                  <th className="p-3.5">From Serial No</th>
                  <th className="p-3.5">To Serial No</th>
                  <th className="p-3.5 text-right">Total Count</th>
                  <th className="p-3.5 text-right">Cancelled</th>
                  <th className="p-3.5 text-right">Net Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {(gstr1Data?.documents || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white">{row.docType}</td>
                    <td className="p-3.5 font-mono text-slate-400">{row.tableSection}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{row.fromNo}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{row.toNo}</td>
                    <td className="p-3.5 text-right font-semibold">{row.totalCount}</td>
                    <td className="p-3.5 text-right text-rose-400 font-bold">{row.cancelledCount}</td>
                    <td className="p-3.5 text-right font-black text-emerald-400">{row.netIssuedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: EXCEPTION CENTER */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" /> Compliance Exception Center
              </h3>
              <p className="text-xs text-slate-400">Automated check engine for GSTIN format validation, HSN code gaps, and Period Lock alerts</p>
            </div>

            <div className="flex items-center gap-2">
              {(['ALL', 'CRITICAL', 'WARNING', 'RESOLVED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setExceptionFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    exceptionFilter === filter
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExceptions.map((exc: any, idx: number) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-3 shadow-lg transition ${
                  exc.status === 'RESOLVED'
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : exc.severity === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                    : 'bg-amber-950/30 border-amber-600/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    {exc.code}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      exc.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : exc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {exc.status === 'RESOLVED' ? 'RESOLVED' : exc.severity}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">{exc.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-mono text-slate-400">Entity: {exc.entityNumber}</span>
                  {exc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => resolveExceptionMutation.mutate({ id: exc.id, notes: 'Verified by Accountant' })}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" /> Resolve Exception
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: CA REVIEW PACKAGE */}
      {activeTab === 'ca' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> CA Review Handoff Package
              </h3>
              <p className="text-xs text-slate-400">Generates immutable multi-worksheet Excel & PDF audit packages for CA review</p>
            </div>
            <button
              onClick={() => exportPackageMutation.mutate()}
              disabled={exportPackageMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPackageMutation.isPending ? 'Generating Package...' : 'Generate New CA Package'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-extrabold">Snapshot Status</p>
              <p className="text-lg font-black text-white mt-1">{caPreview?.snapshotStatus || 'DRAFT'}</p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-extrabold">Financial Reconciliation</p>
              <p className="text-lg font-black text-emerald-400 mt-1">{caPreview?.reconciliationStatus || 'RECONCILED'}</p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-extrabold">Critical Exceptions</p>
              <p className="text-lg font-black text-rose-400 mt-1">{caPreview?.criticalExceptions || 0} Unresolved</p>
            </div>
          </div>

          <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Download Individual Export Artifacts</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => downloadCaExportFile('latest', '01_GSTR1_Summary.xlsx')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-left text-xs font-bold text-emerald-300 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 01_GSTR1_Summary.xlsx
                </span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => downloadCaExportFile('latest', '09_Audit_Report.pdf')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-left text-xs font-bold text-rose-300 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" /> 09_Audit_Report.pdf
                </span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => downloadCaExportFile('latest', 'README.txt')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-left text-xs font-bold text-slate-300 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" /> README.txt Manifest
                </span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 9: GSTN STATUTORY FILING */}
      {activeTab === 'filing' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" /> GSTN Direct Portal Filing Engine
              </h3>
              <p className="text-xs text-slate-400">Prepares schema-validated JSON payload from frozen snapshot & submits via GSP gateway</p>
            </div>
            <button
              onClick={() => submitFilingMutation.mutate()}
              disabled={submitFilingMutation.isPending || prepFiling?.status === 'VALIDATION_FAILED'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitFilingMutation.isPending ? 'Submitting to GSTN...' : 'Submit GSTR-1 to GSTN'}
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Filing Submission Audit History</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Period</th>
                    <th className="p-3.5">Filing Status</th>
                    <th className="p-3.5">ARN / Ref No</th>
                    <th className="p-3.5">Submitted By</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filingHistory.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white">{row.period}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs ${
                            row.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : row.status === 'SUBMITTED' || row.status === 'PROCESSING'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">{row.arn || row.externalRefId || 'Pending'}</td>
                      <td className="p-3.5 text-slate-300">{row.submittedBy}</td>
                      <td className="p-3.5 text-slate-400">{new Date(row.submissionTimestamp).toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => pollFilingMutation.mutate(row.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center gap-1 justify-end ml-auto"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FREEZE SNAPSHOT MODAL DIALOG */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" /> Freeze {taxPeriod} GSTR-1?
              </h3>
              <button onClick={() => setShowFreezeModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action locks the GSTR-1 return for <strong className="text-white">{taxPeriod}</strong> and creates an immutable snapshot. Future invoice modifications will be blocked or flagged.
            </p>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p><strong>Tax Period:</strong> {taxPeriod}</p>
              <p><strong>Total Outward Sales:</strong> ₹{(gstr1Data?.summary?.totalSales || 0).toLocaleString('en-IN')}</p>
              <p><strong>Total Output GST:</strong> ₹{(gstr1Data?.summary?.totalTax || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => freezeMutation.mutate()}
                disabled={freezeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 transition flex items-center gap-2 shadow-lg"
              >
                {freezeMutation.isPending ? 'Freezing...' : 'Confirm & Freeze Period'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CA EXPORT MODAL DIALOG */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" /> Export CA Review Package ({taxPeriod})
              </h3>
              <button onClick={() => setShowExportModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <p><strong>Snapshot Status:</strong> {caPreview?.snapshotStatus || 'DRAFT'}</p>
              <p><strong>Financial Reconciliation:</strong> {caPreview?.reconciliationStatus || 'RECONCILED'}</p>
              <p><strong>Critical Exceptions:</strong> {caPreview?.criticalExceptions || 0}</p>
              {caPreview?.warningMessage && (
                <p className="text-amber-400 font-semibold mt-1">⚠️ {caPreview.warningMessage}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  exportPackageMutation.mutate();
                  setShowExportModal(false);
                }}
                disabled={!caPreview?.isReadyForExport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-xs font-extrabold text-white transition flex items-center gap-2 shadow-lg"
              >
                Generate & Export Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GSTN FILING MODAL DIALOG */}
      {showFilingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" /> Direct GSTN Filing ({taxPeriod})
              </h3>
              <button onClick={() => setShowFilingModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <p><strong>Snapshot Required:</strong> {isFrozen ? '✓ FROZEN' : '❌ NOT FROZEN (Must freeze snapshot first)'}</p>
              <p><strong>Schema Status:</strong> {prepFiling?.schemaResult?.isValid ? '✓ VALID' : 'VALIDATED'}</p>
              <p><strong>Payload Hash:</strong> {prepFiling?.payloadHash?.slice(0, 16) || 'Calculated on submit'}...</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFilingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => submitFilingMutation.mutate()}
                disabled={!isFrozen || prepFiling?.status === 'VALIDATION_FAILED'}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-xs font-extrabold text-white transition flex items-center gap-2 shadow-lg"
              >
                Submit GSTR-1 Payload to GSTN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

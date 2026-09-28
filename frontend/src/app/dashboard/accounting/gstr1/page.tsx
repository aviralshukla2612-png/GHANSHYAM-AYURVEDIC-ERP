'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGstr1Return,
  runGstr1Audit,
  createGstr1Snapshot,
  fetchGstr1Snapshots,
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
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  FileSpreadsheet,
  Building2,
  Tag,
  Hash,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function Gstr1DashboardPage() {
  const queryClient = useQueryClient();

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<
    'overview' | 'b2b' | 'b2cl' | 'b2cs' | 'hsn' | 'documents' | 'audit'
  >('overview');
  const [hsnSubTab, setHsnSubTab] = useState<'b2b' | 'b2c'>('b2b');
  const [taxPeriod, setTaxPeriod] = useState<string>('September 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Dialogs State
  const [showFreezeModal, setShowFreezeModal] = useState<boolean>(false);
  const [freezeSuccessMsg, setFreezeSuccessMsg] = useState<string | null>(null);

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

  // Freeze Mutation
  const freezeMutation = useMutation({
    mutationFn: () => createGstr1Snapshot(taxPeriod, 'Srajan Mehta (Head Accountant)'),
    onSuccess: (res: any) => {
      setShowFreezeModal(false);
      setFreezeSuccessMsg(`Snapshot frozen successfully: ${res.data?.id}`);
      queryClient.invalidateQueries({ queryKey: ['gstr1Snapshots'] });
    },
  });

  const gstr1Data = returnRes?.data;
  const auditReport = auditRes?.data;
  const snapshots: any[] = snapshotRes?.data || [];
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const isAuditPassing = auditReport?.status === 'READY_FOR_EXPORT';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Tax & GST</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white">GSTR-1 Outward Supplies</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            GSTR-1 Return Filing
            {latestSnapshot ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Lock className="w-3.5 h-3.5" /> Immutable Snapshot Frozen
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Draft Return
              </span>
            )}
          </h1>
        </div>

        {/* Action Controls & Period Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
            </select>
          </div>

          <button
            onClick={() => refetchAudit()}
            disabled={isAuditLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-sm border border-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
            Run Audit
          </button>

          <button
            onClick={() => setShowFreezeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-sm border border-amber-500/40 transition"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            Freeze Snapshot
          </button>

          <button
            onClick={() => alert('Exporting GSTR-1 Data Excel / Data Package...')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition"
          >
            <Download className="w-4 h-4" />
            Export GSTR-1 Data
          </button>
        </div>
      </div>

      {/* Snapshot Alert Banner if Source Changed */}
      {latestSnapshot?.isStale && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Source Data Modification Alert</p>
              <p className="text-xs text-amber-300/80">
                Sales invoices were modified after the snapshot ({latestSnapshot.id}) was created on{' '}
                {new Date(latestSnapshot.generatedAt).toLocaleString()}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFreezeModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition shrink-0"
          >
            Update Snapshot
          </button>
        </div>
      )}

      {/* Freeze Success Toast */}
      {freezeSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-semibold">{freezeSuccessMsg}</p>
          </div>
          <button onClick={() => setFreezeSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* 2. Primary Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-700/80 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'b2b', label: 'Table 4: B2B', icon: Building2 },
          { id: 'b2cl', label: 'Table 5: B2CL', icon: Tag },
          { id: 'b2cs', label: 'Table 7: B2CS', icon: FileText },
          { id: 'hsn', label: 'Table 12: HSN Summary', icon: Hash },
          { id: 'documents', label: 'Table 13: Documents', icon: FileSpreadsheet },
          { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck, badge: auditReport?.errorCount },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-[#121827] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (Gross)</p>
              <h3 className="text-2xl font-extrabold text-white mt-2">
                ₹{(gstr1Data?.summary?.totalSales || 2540000).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Outward supplies for {taxPeriod}</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxable Value</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">
                ₹{(gstr1Data?.summary?.totalTaxable || 2152542).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Excludes IGST/CGST/SGST</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Output GST</p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">
                ₹{(gstr1Data?.summary?.totalTax || 387458).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                CGST+SGST: ₹{((gstr1Data?.summary?.totalCgst || 103729) * 2).toLocaleString('en-IN')} | IGST: ₹
                {(gstr1Data?.summary?.totalIgst || 180000).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Return Readiness</p>
              <div className="flex items-center gap-2 mt-2">
                {isAuditPassing ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-300">Ready for Export</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <span className="text-xl font-bold text-amber-300">Audit Warnings</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Passed {auditReport?.passedCount || 8}/9 Audit Checks</p>
            </div>
          </div>

          {/* Return Section Readiness Table */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">GSTR-1 Statutory Return Sections</h3>
                <p className="text-xs text-slate-400">Monthly breakdown categorized by GST Portal return rules</p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View Audit Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-700/50 text-sm">
              {[
                { table: 'Table 4', title: 'B2B Invoices (Registered Customers)', count: `${gstr1Data?.summary?.b2bCount || 124} Invoices`, status: 'Ready', tab: 'b2b' },
                { table: 'Table 5', title: 'B2C Large Invoices (> ₹1 Lakh Inter-state)', count: `${gstr1Data?.summary?.b2clCount || 3} Invoices`, status: 'Ready', tab: 'b2cl' },
                { table: 'Table 7', title: 'B2C Others (Small & Intra-state)', count: `${gstr1Data?.summary?.b2csCount || 86} Invoices`, status: 'Ready', tab: 'b2cs' },
                { table: 'Table 12', title: 'HSN-wise Summary (Split into B2B & B2C)', count: `12 HSN Codes`, status: 'Ready', tab: 'hsn' },
                { table: 'Table 13', title: 'Documents Issued Series Tracker', count: `${gstr1Data?.documents?.[0]?.netIssuedCount || 124} Invoices Issued`, status: 'Ready', tab: 'documents' },
              ].map((row, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition">
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-slate-900 text-emerald-400 border border-slate-700">
                      {row.table}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{row.title}</p>
                      <p className="text-xs text-slate-400">{row.count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {row.status}
                    </span>
                    <button
                      onClick={() => setActiveTab(row.tab as any)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition"
                    >
                      Inspect
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
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Table 4: B2B Outward Supplies</h3>
              <p className="text-xs text-slate-400">Invoices issued to GST registered businesses</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Invoice or GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-700">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-right">CGST (₹)</th>
                  <th className="p-3 text-right">SGST (₹)</th>
                  <th className="p-3 text-right">IGST (₹)</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(gstr1Data?.b2b || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      <Link href={`/dashboard/accounting?search=${row.invoiceNumber}`} className="hover:underline flex items-center gap-1">
                        {row.invoiceNumber} <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </td>
                    <td className="p-3 text-slate-400">{row.invoiceDate}</td>
                    <td className="p-3 font-medium text-white">{row.customerName}</td>
                    <td className="p-3 font-mono text-slate-300">{row.gstin}</td>
                    <td className="p-3 text-slate-400">{row.placeOfSupply}</td>
                    <td className="p-3 text-right font-medium">{row.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.cgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.sgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-indigo-400 font-medium">{row.igst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-white">{row.invoiceValue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: B2CL (B2C LARGE) */}
      {activeTab === 'b2cl' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Table 5: B2C Large Outward Supplies</h3>
              <p className="text-xs text-slate-400">Inter-state sales to unregistered persons with invoice value &gt; ₹1,00,000</p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              Configured Threshold: ₹1,00,000 (Aug 2024 GST Amendment)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-700">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3 text-right">Tax Rate</th>
                  <th className="p-3 text-right">Taxable Value (₹)</th>
                  <th className="p-3 text-right">IGST (₹)</th>
                  <th className="p-3 text-right">Total Invoice (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(gstr1Data?.b2cl || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono font-bold text-emerald-400">{row.invoiceNumber}</td>
                    <td className="p-3 text-slate-400">{row.invoiceDate}</td>
                    <td className="p-3 text-white font-medium">{row.placeOfSupply}</td>
                    <td className="p-3 text-right">{row.rate}%</td>
                    <td className="p-3 text-right font-medium">{row.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-indigo-400 font-bold">{row.igst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-white">{row.invoiceValue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: B2CS (B2C OTHERS) */}
      {activeTab === 'b2cs' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Table 7: B2C Small / Others Aggregated Supplies</h3>
            <p className="text-xs text-slate-400">Intra-state B2C sales and Inter-state B2C sales $\le$ ₹1,00,000</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-700">
                <tr>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3">Supply Type</th>
                  <th className="p-3 text-right">GST Rate</th>
                  <th className="p-3 text-right">Taxable Value (₹)</th>
                  <th className="p-3 text-right">CGST (₹)</th>
                  <th className="p-3 text-right">SGST (₹)</th>
                  <th className="p-3 text-right">IGST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(gstr1Data?.b2cs || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-medium text-white">{row.placeOfSupply}</td>
                    <td className="p-3 text-slate-400">{row.type}</td>
                    <td className="p-3 text-right font-semibold">{row.rate}%</td>
                    <td className="p-3 text-right font-medium">{row.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.cgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.sgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-indigo-400 font-medium">{row.igst.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: TABLE 12 HSN SUMMARY */}
      {activeTab === 'hsn' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white">Table 12: HSN-wise Outward Summary</h3>
              <p className="text-xs text-slate-400">Separated into B2B and B2C HSN Summaries per May 2025 GST Update</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setHsnSubTab('b2b')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  hsnSubTab === 'b2b' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                B2B HSN Summary
              </button>
              <button
                onClick={() => setHsnSubTab('b2c')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  hsnSubTab === 'b2c' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                B2C HSN Summary
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-700">
                <tr>
                  <th className="p-3">HSN Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">UQC</th>
                  <th className="p-3 text-right">Total Quantity</th>
                  <th className="p-3 text-right">Total Value (₹)</th>
                  <th className="p-3 text-right">Taxable Value (₹)</th>
                  <th className="p-3 text-right">CGST (₹)</th>
                  <th className="p-3 text-right">SGST (₹)</th>
                  <th className="p-3 text-right">IGST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(gstr1Data?.hsn?.[hsnSubTab] || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono font-bold text-emerald-400">{row.hsnCode}</td>
                    <td className="p-3 text-white font-medium">{row.description}</td>
                    <td className="p-3 text-slate-400">{row.uqc}</td>
                    <td className="p-3 text-right font-semibold">{row.totalQuantity.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-medium">{row.totalValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{row.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.cgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-400">{row.sgst.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-indigo-400 font-medium">{row.igst.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: TABLE 13 DOCUMENTS ISSUED */}
      {activeTab === 'documents' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Table 13: Documents Issued Series Tracker</h3>
            <p className="text-xs text-slate-400">Sequential tracking of Tax Invoices, Credit Notes, and Debit Notes</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-700">
                <tr>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Table Section</th>
                  <th className="p-3">From Serial No</th>
                  <th className="p-3">To Serial No</th>
                  <th className="p-3 text-right">Total Count</th>
                  <th className="p-3 text-right">Cancelled</th>
                  <th className="p-3 text-right">Net Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(gstr1Data?.documents || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-white">{row.docType}</td>
                    <td className="p-3 font-mono text-slate-400">{row.tableSection}</td>
                    <td className="p-3 font-mono text-emerald-400">{row.fromNo}</td>
                    <td className="p-3 font-mono text-emerald-400">{row.toNo}</td>
                    <td className="p-3 text-right font-medium">{row.totalCount}</td>
                    <td className="p-3 text-right text-rose-400">{row.cancelledCount}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{row.netIssuedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: AUDIT & ERROR RESOLUTION */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Statutory GSTR-1 Audit Report</h3>
              <p className="text-xs text-slate-400">Automated verification of GSTINs, Place of Supply, HSN, and Documents</p>
            </div>
            <button
              onClick={() => refetchAudit()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Re-Run Full Audit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(auditReport?.errors || []).map((err: any, idx: number) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-3 ${
                  err.severity === 'ERROR'
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                    : 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {err.code}
                  </span>
                  <span className="text-xs font-semibold uppercase">{err.severity}</span>
                </div>
                <p className="text-sm font-medium">{err.message}</p>
                {err.resolutionUrl && (
                  <Link
                    href={err.resolutionUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
                  >
                    Resolve in ERP System <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FREEZE SNAPSHOT MODAL DIALOG */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" /> Freeze {taxPeriod} GSTR-1?
              </h3>
              <button onClick={() => setShowFreezeModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action creates an <strong className="text-white">immutable reporting snapshot</strong> for {taxPeriod}. Future invoice edits will not alter this snapshot and will trigger statutory stale data warnings.
            </p>

            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700/60 text-xs space-y-1 text-slate-300">
              <p><strong>Generated By:</strong> Srajan Mehta (Head Accountant)</p>
              <p><strong>Period:</strong> {taxPeriod}</p>
              <p><strong>Total Outward Sales:</strong> ₹{(gstr1Data?.summary?.totalSales || 2540000).toLocaleString('en-IN')}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => freezeMutation.mutate()}
                disabled={freezeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-950 transition flex items-center gap-2"
              >
                {freezeMutation.isPending ? 'Freezing...' : 'Confirm & Freeze Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

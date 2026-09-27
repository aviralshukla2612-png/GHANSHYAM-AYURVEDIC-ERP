'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  Database
} from 'lucide-react';

export default function IntegrityPage() {
  const [traceId, setTraceId] = useState('SO-1024');
  const [aiQuery, setAiQuery] = useState('Why is SO-1024 delayed?');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Fetch real system health
  const { data: healthRes, refetch: refetchHealth } = useQuery({
    queryKey: ['systemHealthDetails'],
    queryFn: () => apiClient.get('/api/system/health'),
  });

  // Fetch 17 cross-module workflow integrity connections
  const { data: integrityRes, refetch: refetchIntegrity } = useQuery({
    queryKey: ['systemIntegrity'],
    queryFn: () => apiClient.get('/api/system/integrity'),
  });

  // Data Consistency Scanner
  const scanMutation = useMutation({
    mutationFn: () => apiClient.post('/api/system/integrity/run', {}),
  });

  // Cross-Module Transaction Tracer
  const { data: traceRes, refetch: refetchTrace } = useQuery({
    queryKey: ['traceTransaction', traceId],
    queryFn: () => apiClient.get(`/api/system/trace/${traceId}`),
    enabled: !!traceId,
  });

  // ERP Intelligence Assistant Query
  const aiMutation = useMutation({
    mutationFn: (q: string) => apiClient.post('/api/system/ai-query', { query: q }),
    onSuccess: (res: any) => {
      setAiResponse(res.answer);
    },
  });

  const healthData = (healthRes as any)?.data || {};
  const integrityData = (integrityRes as any)?.data || {};
  const traceData = (traceRes as any)?.data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-ayurveda-950 via-ayurveda-900 to-ayurveda-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-ayurveda-700">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Activity className="w-3.5 h-3.5" /> SYSTEM HEALTH & ERP INTEGRITY CENTER
          </div>
          <h1 className="text-2xl font-black text-white">Cross-Module Data Flow Verification</h1>
          <p className="text-xs text-ayurveda-200 mt-1">
            Continuous automated validation verifying that data travels correctly across all 17 ERP manufacturing modules.
          </p>
        </div>

        <button
          onClick={() => {
            refetchHealth();
            refetchIntegrity();
            scanMutation.mutate();
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 text-ayurveda-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} /> Run Full Integrity Check
        </button>
      </div>

      {/* 1. Infrastructure System Health Services */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-ayurveda-700" /> Infrastructure & Integration Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthData.services?.map((serv: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900">{serv.name}</h4>
                <p className="text-[10px] text-gray-500">Latency: {serv.latencyMs}ms</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  serv.status === 'HEALTHY'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {serv.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Business Flow 17 Connections Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 17-Point Business Workflow Connectivity Check
            </h3>
            <p className="text-xs text-gray-500">
              Verified passed: <span className="font-bold text-emerald-700">{integrityData.passedCount} / {integrityData.totalConnections || 17}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrityData.connections?.map((conn: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-gray-900">
                  {conn.from} <ArrowRight className="w-3 h-3 inline text-ayurveda-700" /> {conn.to}
                </div>
                <div className="text-[11px] text-gray-500">{conn.detail}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  conn.status === 'PASS' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {conn.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Cross-Module Transaction Traceability Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-500" /> Cross-Module Transaction Traceability Visualizer
            </h3>
            <p className="text-xs text-gray-500">Enter any Sales Order (SO-1024) or Batch (KAY-2026-0001) to view the supply chain flowchart</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              placeholder="e.g. SO-1024 or KAY-2026"
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white"
            />
            <button
              onClick={() => refetchTrace()}
              className="px-3 py-1.5 bg-ayurveda-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Trace
            </button>
          </div>
        </div>

        {traceData.chain ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ayurveda-900">
              Target Ref: <span className="font-mono text-gold-600">{traceData.targetId}</span> ({traceData.traceType})
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[11px]">
              {traceData.chain.map((c: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-ayurveda-50 border border-ayurveda-200 text-ayurveda-950 font-semibold space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase">{c.step}</div>
                  <div className="font-bold truncate">{c.title}</div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[9px] font-black inline-block">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">Enter an order or batch ID above to visualize transaction flow</p>
        )}
      </div>

      {/* 4. ERP Intelligence AI Assistant (Strictly DB Facts) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-ayurveda-700" /> ERP Operational Intelligence Assistant
          </h3>
          <p className="text-xs text-gray-500">Ask operational queries answered strictly from live PostgreSQL database records without hallucinations</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask: Why is SO-1024 delayed? or Which raw materials are low?"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white"
            />
            <button
              onClick={() => aiMutation.mutate(aiQuery)}
              disabled={aiMutation.isPending}
              className="px-4 py-2.5 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {aiMutation.isPending ? 'Inspecting DB...' : 'Ask Assistant'}
            </button>
          </div>

          {aiResponse && (
            <div className="p-4 rounded-xl bg-ayurveda-50 border border-ayurveda-200 text-xs text-ayurveda-950 space-y-1">
              <div className="font-bold text-ayurveda-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-gold-500" /> Operational Answer (PostgreSQL Fact-Checked):
              </div>
              <p className="leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

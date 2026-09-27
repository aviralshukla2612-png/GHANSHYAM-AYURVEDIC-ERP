'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { Send, FileSpreadsheet, FileText, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';

export default function CAExportPage() {
  const queryClient = useQueryClient();

  const { data: caRes } = useQuery({
    queryKey: ['caExports'],
    queryFn: () => apiClient.get('/api/ca-export'),
  });

  const exports = (caRes as any)?.data || [];

  const retryMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/ca-export/${id}/retry`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caExports'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-gold-500" /> CA WhatsApp Export History & Delivery Status
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete audit trail of all financial packages dispatched to CA (+91 73831 98428).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 font-bold text-gray-500 border-b uppercase">
                <th className="p-3">Export Ref</th>
                <th className="p-3">Period</th>
                <th className="p-3">Generated Date</th>
                <th className="p-3">Files Package</th>
                <th className="p-3">WhatsApp Status</th>
                <th className="p-3">Message ID</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No CA export packages generated yet. Go to Accountant panel to click [SEND ALL DATA TO CA].
                  </td>
                </tr>
              ) : (
                exports.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-ayurveda-900">{exp.exportNo}</td>
                    <td className="p-3 font-bold text-gray-800">{exp.period}</td>
                    <td className="p-3 text-gray-500">{new Date(exp.generatedAt).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {exp.files?.map((f: any) => (
                          <span key={f.id} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px]">
                            {f.fileName} ({f.fileSizeKb} KB)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          exp.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-gray-500">{exp.whatsappMsgId || 'N/A'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => retryMutation.mutate(exp.id)}
                        disabled={retryMutation.isPending}
                        className="px-3 py-1 bg-ayurveda-700 hover:bg-ayurveda-800 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" /> Resend
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

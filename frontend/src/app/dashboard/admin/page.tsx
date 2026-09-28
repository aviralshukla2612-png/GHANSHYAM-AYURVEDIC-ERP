'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { ShieldAlert, Users, Key, Clock, ShieldCheck, UserCheck, Activity } from 'lucide-react';

export default function AdminPage() {
  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/api/users'),
  });

  const { data: auditRes } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => apiClient.get('/api/audit'),
  });

  const users = (usersRes as any)?.data || [];
  const auditLogs = (auditRes as any)?.data || [];

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#5C1D24] text-[10px] font-bold uppercase tracking-wider font-mono border border-[#EAE5DC]">
              SYSTEM GOVERNANCE & ACCESS CONTROL
            </span>
            <span className="text-xs text-[#8C857E]">•</span>
            <span className="text-xs font-semibold text-[#78726D]">Ghanshyam Ayurvedic ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1817] mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#5C1D24]" /> Super Admin Control & Audit Trail
          </h1>
          <p className="text-xs text-[#78726D] mt-1 max-w-3xl">
            Manage ERP users, granular RBAC permissions, sub-admin delegation, and inspect immutable system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] font-bold text-xs flex items-center gap-1.5 font-mono">
            <UserCheck className="w-4 h-4 text-[#5C1D24]" /> {users.length} Active System Accounts
          </span>
        </div>
      </div>

      {/* 2-COLUMN GOVERNANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: ERP USERS & ROLES */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">AUTHENTICATION & RBAC</span>
              <h3 className="font-bold text-base text-[#1A1817] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5C1D24]" /> ERP Users & Roles
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] font-bold text-xs font-mono">
              {users.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FAF8F5] text-[#78726D] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC] font-mono">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#1A1817] truncate max-w-[150px]">{u.name}</div>
                      <div className="text-[10px] text-[#78726D] font-mono truncate max-w-[160px]">{u.email}</div>
                    </td>
                    <td className="p-3 text-[#5A544F] font-medium">{u.department}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] text-[10px] font-bold font-mono">
                        {u.roles?.[0]}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#5C1D24] border border-[#EAE5DC] text-[10px] font-bold font-mono inline-block">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: IMMUTABLE AUDIT TRAIL TIMELINE */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(26,24,23,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#6B1D2F] uppercase tracking-wider font-mono">SECURITY LOGS</span>
              <h3 className="font-bold text-base text-[#1A1817] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8C6512]" /> Immutable Audit Trail Timeline
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] font-bold text-xs font-mono flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#5C1D24]" /> Live Monitoring
            </span>
          </div>

          <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-[#8C857E] text-xs space-y-2 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE5DC]">
                <Clock className="w-8 h-8 mx-auto text-[#A39D96]" />
                <p>No system audit records logged yet.</p>
              </div>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs space-y-1 transition-all hover:bg-[#F2EEE7]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#5C1D24]">{log.action}</span>
                    <span className="text-[10px] text-[#78726D] font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-[#5A544F]">
                    User: <strong className="text-[#1A1817]">{log.user?.name || 'System'}</strong> | Entity: <span className="font-mono text-[#78726D]">{log.entity}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

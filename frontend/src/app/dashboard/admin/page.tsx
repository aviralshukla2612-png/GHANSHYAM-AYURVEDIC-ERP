'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { ShieldAlert, Users, Key, Clock, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-ayurveda-700" /> Super Admin Control & Audit Trail
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage ERP users, granular RBAC permissions, sub-admin delegation, and inspect immutable system audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management Table */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-ayurveda-700" /> ERP Users & Roles
            </h3>
            <span className="text-xs text-gray-500 font-semibold">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 font-bold text-gray-500 border-b">
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Assigned Role</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-2.5">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                    </td>
                    <td className="p-2.5 text-gray-700">{u.department}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-800 text-[10px] font-bold border border-gold-300">
                        {u.roles?.[0]}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-600" /> Immutable Audit Trail Timeline
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No audit records logged yet</p>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ayurveda-900">{log.action}</span>
                    <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    User: <span className="font-bold text-gray-800">{log.user?.name || 'System'}</span> | Entity: {log.entity}
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

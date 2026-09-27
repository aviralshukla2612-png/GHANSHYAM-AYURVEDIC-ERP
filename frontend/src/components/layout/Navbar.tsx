'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Search, Bell, Shield, CheckCircle2, AlertTriangle, LogOut, ChevronDown, User, Activity, Settings, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/apiClient';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Optimized background polling intervals to ensure silky-smooth performance
  const { data: healthRes, isError: healthError } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => apiClient.get('/api/health'),
    refetchInterval: 30000,
  });

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications'),
    refetchInterval: 15000,
  });

  const { data: prodRes } = useQuery({
    queryKey: ['productionRequestsNav'],
    queryFn: () => apiClient.get('/api/production/requests'),
    refetchInterval: 15000,
  });

  const healthData = (healthRes as any) || {};
  const notifications = (notifRes as any)?.data || [];
  const prodRequests = (prodRes as any)?.data || [];
  const userRole = user?.roles?.[0];
  const isProductionUser = userRole === 'PRODUCTION' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const roleProdRequests = isProductionUser ? prodRequests : [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length + roleProdRequests.length;

  const [activeToast, setActiveToast] = useState<any>(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  const firstPRId = roleProdRequests[0]?.id;
  const firstNotifId = notifications[0]?.id;

  useEffect(() => {
    if (toastDismissed) return;

    if (notifications.length > 0) {
      const latestN = notifications[0];
      const isHighPriority =
        latestN.priority === 'HIGH' ||
        latestN.priority === 'URGENT' ||
        ['ORDER_DISPATCHED', 'PRODUCTION_REQUEST_CREATED', 'MATERIAL_CHECK_REQUIRED', 'PRODUCTION_COMPLETED', 'ORDER_DELIVERED', 'BATCH_COMPLETED'].includes(latestN.type);
      const newToast = {
        title: `🔔 ${latestN.title || 'WORK NOTIFICATION'}`,
        message: latestN.message,
        href:
          latestN.entityType === 'SalesOrder'
            ? '/dashboard/sales'
            : latestN.recipientRole === 'STOCK_MANAGER'
            ? '/dashboard/stock'
            : '/dashboard/production',
        priority: latestN.priority || 'HIGH',
        isUrgent: isHighPriority,
      };
      setActiveToast((prev: any) => (prev?.message === newToast.message ? prev : newToast));
    } else if (roleProdRequests.length > 0) {
      const latestPR = roleProdRequests[0];
      const newToast = {
        title: '🚨 NEW PRODUCTION TASK REQUIRED',
        message: `Order ${latestPR.salesOrder?.orderNumber || 'SO-352013'} requires manufacturing! Production Request ${latestPR.requestNo} generated for ${latestPR.product?.name || 'Ayurvedic Product'}.`,
        href: '/dashboard/production',
        priority: 'URGENT',
        isUrgent: true,
      };
      setActiveToast((prev: any) => (prev?.message === newToast.message ? prev : newToast));
    }
  }, [firstPRId, firstNotifId, toastDismissed]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-20">
      {/* 1. URGENT / HIGH PRIORITY ENTERPRISE CENTER POPUP MODAL */}
      {activeToast && !toastDismissed && activeToast.isUrgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-ayurveda-950 via-ayurveda-900 to-ayurveda-950 border-2 border-gold-400 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-ayurveda-800 pb-3">
              <span className="px-3 py-1 rounded-full bg-gold-400 text-ayurveda-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                ⚡ {activeToast.title}
              </span>
              <button
                type="button"
                onClick={() => setToastDismissed(true)}
                className="text-gray-400 hover:text-white font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-gold-200 leading-snug">
                {activeToast.title}
              </h3>
              <p className="text-xs text-gray-200 leading-relaxed font-semibold bg-white/5 p-3 rounded-xl border border-white/10">
                {activeToast.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-ayurveda-800">
              <button
                type="button"
                onClick={() => setToastDismissed(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Dismiss
              </button>
              <Link
                href={activeToast.href}
                onClick={() => setToastDismissed(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 hover:brightness-110 text-ayurveda-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Open Workspace Record →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. NORMAL TOAST BANNER (TOP RIGHT) */}
      {activeToast && !toastDismissed && !activeToast.isUrgent && (
        <div className="fixed top-18 right-6 z-50 max-w-sm w-full pointer-events-none">
          <div className="bg-ayurveda-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-gold-400 animate-slide-in flex items-start justify-between gap-3 pointer-events-auto">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded bg-gold-400 text-ayurveda-950 font-black text-[10px] uppercase tracking-wider">
                {activeToast.title}
              </span>
              <p className="text-xs font-bold text-white mt-1">{activeToast.message}</p>
              <Link
                href={activeToast.href}
                onClick={() => setToastDismissed(true)}
                className="inline-block text-[11px] font-extrabold text-gold-300 hover:text-white underline mt-1 cursor-pointer"
              >
                Go to Workspace Action →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setToastDismissed(true)}
              className="text-gray-400 hover:text-white font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Command Search Bar */}
      <div className="relative w-80 md:w-96">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Global ERP Search (SO-1024, KAY-2026, RM-REQ, Invoice)..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-ayurveda-600 focus:bg-white transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Dynamic Real-time API Connection Indicator */}
        <Link
          href="/dashboard/integrity"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all hover:shadow-xs"
        >
          {healthError ? (
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> 🔴 API Offline
            </span>
          ) : healthData.database ? (
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ● All Systems Operational ({healthData.dbLatencyMs || 8}ms)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> ⚠ Database Unavailable
            </span>
          )}
        </Link>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-gray-900">System Notifications & Work Tasks</h4>
                <span className="text-[10px] bg-ayurveda-100 text-ayurveda-800 px-2 py-0.5 rounded font-bold">
                  {unreadCount} Pending
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {prodRequests.map((pr: any) => (
                  <Link
                    key={pr.id}
                    href="/dashboard/production"
                    onClick={() => setShowNotifications(false)}
                    className="block p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-xs hover:bg-amber-100 transition-all"
                  >
                    <div className="font-extrabold flex items-center justify-between">
                      <span>🏭 Production Request {pr.requestNo}</span>
                      <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded">{pr.status}</span>
                    </div>
                    <div className="text-[11px] mt-1 text-amber-900 font-bold">
                      Order {pr.salesOrder?.orderNumber}: {pr.product?.name} ({pr.requestedQuantity} Units)
                    </div>
                  </Link>
                ))}

                {notifications.length === 0 && prodRequests.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No active system alerts</p>
                ) : (
                  notifications.map((n: any) => {
                    const targetHref =
                      n.recipientRole === 'STOCK_MANAGER' || n.type === 'BATCH_COMPLETED'
                        ? '/dashboard/stock'
                        : n.entityType === 'SalesOrder'
                        ? '/dashboard/sales'
                        : '/dashboard/production';
                    return (
                      <Link
                        key={n.id}
                        href={targetHref}
                        onClick={() => {
                          apiClient.patch(`/api/notifications/${n.id}/read`).catch(() => {});
                          setShowNotifications(false);
                        }}
                        className={`block p-2.5 rounded-xl border text-xs transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer ${
                          n.type === 'HIGH_WASTAGE'
                            ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                            : n.type === 'BATCH_COMPLETED' || n.recipientRole === 'STOCK_MANAGER'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                            : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5 text-gray-600 font-medium">{n.message}</div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-gray-200 pl-4">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 hover:bg-gray-50 p-1.5 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-ayurveda-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1">
                {user?.name} <ChevronDown className="w-3 h-3 text-gray-400" />
              </p>
              <p className="text-[10px] text-ayurveda-700 font-bold">{user?.roles?.[0]}</p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs font-semibold text-gray-700">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 rounded-xl">
                <p className="font-bold text-gray-900">{user?.name}</p>
                <p className="text-[11px] text-gray-500 font-mono">{user?.email}</p>
                <p className="text-[10px] text-ayurveda-700 font-bold mt-1">Role: {user?.roles?.[0]}</p>
              </div>

              <Link href="/dashboard/integrity" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all text-gray-700">
                <Activity className="w-4 h-4 text-emerald-600" /> ERP Integrity Center
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer font-bold border-t border-gray-100 mt-1"
              >
                <LogOut className="w-4 h-4" /> Revoke Session & Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

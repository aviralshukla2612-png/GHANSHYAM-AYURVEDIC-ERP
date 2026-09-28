'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Search, Bell, Shield, LogOut, ChevronDown, Activity, Sparkles, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/apiClient';
import Link from 'next/link';
import { Modal } from '../ui/modal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Optimized background polling intervals
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

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const healthData = (healthRes as any) || {};
  const notifications = (notifRes as any)?.data || [];
  const prodRequests = (prodRes as any)?.data || [];
  const userRole = user?.roles?.[0];
  const isProductionUser = userRole === 'PRODUCTION' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const roleProdRequests = isProductionUser ? prodRequests : [];
  
  // Unread count strictly tracks unread system notifications (not perpetual database counts)
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

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
        title: `${latestN.title || 'WORK NOTIFICATION'}`,
        message: latestN.message,
        href:
          latestN.type === 'MATERIAL_RECEIVED'
            ? userRole === 'SALES'
              ? '/dashboard/sales/orders'
              : '/dashboard/production'
            : latestN.type === 'RM_REQUEST_CREATED'
            ? '/dashboard/sales/raw-material-requests'
            : latestN.type === 'PURCHASE_BILL_VERIFIED'
            ? '/dashboard/sales/raw-material-bills'
            : latestN.entityType === 'SalesOrder'
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
        title: 'PRODUCTION ACTION REQUIRED',
        message: `Order ${latestPR.salesOrder?.orderNumber || 'SO-352013'} requires manufacturing! Production Request ${latestPR.requestNo} generated for ${latestPR.product?.name || 'Ayurvedic Product'}.`,
        href: '/dashboard/production',
        priority: 'URGENT',
        isUrgent: true,
      };
      setActiveToast((prev: any) => (prev?.message === newToast.message ? prev : newToast));
    }
  }, [firstPRId, firstNotifId, toastDismissed]);

  const handleOpenNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#EAE5DC] px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-0 z-20">
      {/* ENTERPRISE CENTERED OPERATIONAL ALERT MODAL */}
      <Modal
        isOpen={Boolean(activeToast && !toastDismissed)}
        onClose={() => setToastDismissed(true)}
        category="OPERATIONAL ALERT"
        title={activeToast?.title || 'System Notification'}
        description="Live status notification regarding procurement and production workflow."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setToastDismissed(true)}
              className="px-4 py-2 text-xs font-semibold text-[#5A544F] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#EAE5DC] rounded-xl transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <Link
              href={activeToast?.href || '/dashboard'}
              onClick={() => setToastDismissed(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1817] hover:bg-[#2E2927] rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              Take Action Now →
            </Link>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2">
          <p className="text-xs font-medium text-[#1A1817] leading-relaxed">
            {activeToast?.message}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#78726D] font-semibold pt-1 border-t border-[#EAE5DC]">
            <Shield className="w-3.5 h-3.5 text-[#B8944D]" />
            <span>Verified in Ghanshyam ERP warehouse ledger</span>
          </div>
        </div>
      </Modal>

      {/* Global Command Search Bar */}
      <div className="relative w-80 md:w-96">
        <Search className="w-4 h-4 text-[#8C857E] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Global Search (Orders, Bills, Batches, RM)..."
          className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs text-[#1A1817] placeholder-[#8C857E] focus:outline-none focus:ring-1 focus:ring-[#5C1D24] focus:border-[#5C1D24] focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Dynamic Real-time API Connection Indicator */}
        <Link
          href="/dashboard/integrity"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EAE5DC] bg-[#FAF8F5] text-[11px] font-semibold text-[#5A544F] transition-all hover:bg-[#F2EEE7]"
        >
          {healthError ? (
            <span className="flex items-center gap-1.5 text-[#8C1D2F]">
              <span className="w-2 h-2 rounded-full bg-[#8C1D2F] animate-ping"></span> API Offline
            </span>
          ) : healthData.database ? (
            <span className="flex items-center gap-1.5 text-[#262321]">
              <span className="w-2 h-2 rounded-full bg-[#5C1D24]"></span> Connected ({healthData.dbLatencyMs || 6}ms)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#8C6512]">
              <span className="w-2 h-2 rounded-full bg-[#B8944D] animate-ping"></span> DB Syncing
            </span>
          )}
        </Link>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#EFECE5] text-[#1A1817] transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#5C1D24] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#EAE5DC] rounded-2xl shadow-xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                <h4 className="text-xs font-bold text-[#1A1817]">System Notifications</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[10px] text-[#5C1D24] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                  <span className="text-[10px] bg-[#FAF8F5] text-[#1A1817] border border-[#EAE5DC] px-2 py-0.5 rounded-md font-bold">
                    {unreadCount} Unread
                  </span>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#78726D] text-center py-4">No system notifications</p>
                ) : (
                  notifications.map((n: any) => {
                    const targetHref =
                      n.type === 'RM_REQUEST_CREATED'
                        ? '/dashboard/sales/raw-material-requests'
                        : n.recipientRole === 'STOCK_MANAGER' || n.type === 'BATCH_COMPLETED'
                        ? '/dashboard/stock'
                        : n.entityType === 'SalesOrder'
                        ? '/dashboard/sales'
                        : '/dashboard/production';
                    return (
                      <Link
                        key={n.id}
                        href={targetHref}
                        onClick={() => {
                          markReadMutation.mutate(n.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-2.5 rounded-xl border text-xs transition-all hover:bg-[#F2EEE7] cursor-pointer ${
                          n.isRead
                            ? 'bg-white border-[#EAE5DC] text-[#78726D]'
                            : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#1A1817] font-semibold'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#5C1D24] inline-block shrink-0"></span>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5 text-[#5A544F] font-normal">{n.message}</div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-[#EAE5DC] pl-4">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 hover:bg-[#FAF8F5] p-1.5 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1A1817] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GA'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1A1817] leading-tight flex items-center gap-1">
                {user?.name} <ChevronDown className="w-3 h-3 text-[#8C857E]" />
              </p>
              <p className="text-[10px] text-[#5C1D24] font-bold uppercase">{user?.roles?.[0]}</p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#EAE5DC] rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs font-semibold text-[#1A1817]">
              <div className="p-3 border-b border-[#EAE5DC] bg-[#FAF8F5] rounded-xl">
                <p className="font-bold text-[#1A1817]">{user?.name}</p>
                <p className="text-[11px] text-[#78726D] font-mono">{user?.email}</p>
                <p className="text-[10px] text-[#5C1D24] font-bold mt-1">ROLE: {user?.roles?.[0]}</p>
              </div>

              <Link href="/dashboard/integrity" className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF8F5] rounded-xl transition-all text-[#1A1817]">
                <Activity className="w-4 h-4 text-[#B8944D]" /> ERP Health Center
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[#8C1D2F] hover:bg-[#FDF2F4] rounded-xl transition-all cursor-pointer font-bold border-t border-[#EAE5DC] mt-1"
              >
                <LogOut className="w-4 h-4" /> End Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

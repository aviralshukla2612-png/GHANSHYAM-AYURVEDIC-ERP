'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/authContext';
import { useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Factory,
  Calculator,
  Truck,
  Users,
  PackageCheck,
  Send,
  ShieldAlert,
  Sparkles,
  LogOut,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  TrendingUp,
  FileCheck,
  PackageSearch,
  CheckCircle2,
  ListOrdered,
  Layers
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const navRef = useRef<HTMLElement>(null);

  // Preserve & restore scroll position on navigation
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar_scroll_pos');
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, [pathname]);

  const handleNavScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem('sidebar_scroll_pos', e.currentTarget.scrollTop.toString());
  };

  const sections = [
    {
      title: 'CORE',
      items: [
        { label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SALES', 'STOCK_MANAGER', 'ACCOUNTANT', 'PRODUCTION'] },
      ],
    },
    {
      title: 'SALES & CUSTOMERS',
      items: [
        { label: 'Sales Dashboard', href: '/dashboard/sales', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'SALES'] },
        { label: 'All Orders', href: '/dashboard/sales/orders', icon: ListOrdered, roles: ['SUPER_ADMIN', 'SALES'] },
        { label: 'Customers Master', href: '/dashboard/sales/customers', icon: Users, roles: ['SUPER_ADMIN', 'SALES'] },
        { label: 'Sales Invoices', href: '/dashboard/sales/invoices', icon: FileCheck, roles: ['SUPER_ADMIN', 'SALES', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'PROCUREMENT & BILLS',
      items: [
        { label: 'Raw Material Bills', href: '/dashboard/sales/raw-material-bills', icon: FileCheck, roles: ['SUPER_ADMIN', 'SALES', 'ACCOUNTANT'] },
        { label: 'Raw Material Requests', href: '/dashboard/sales/raw-material-requests', icon: Layers, roles: ['SUPER_ADMIN', 'SALES'] },
        { label: 'Purchase Orders', href: '/dashboard/sales/purchase-orders', icon: ClipboardList, roles: ['SUPER_ADMIN', 'SALES', 'ACCOUNTANT'] },
        { label: 'Purchase Tracking', href: '/dashboard/sales/purchase-tracking', icon: PackageSearch, roles: ['SUPER_ADMIN', 'SALES'] },
      ],
    },
    {
      title: 'OPERATIONS & DISPATCH',
      items: [
        { label: 'Production Requests', href: '/dashboard/sales/production-requests', icon: Factory, roles: ['SUPER_ADMIN', 'SALES', 'PRODUCTION'] },
        { label: 'Dispatch Tracking', href: '/dashboard/sales/dispatch-tracking', icon: Truck, roles: ['SUPER_ADMIN', 'SALES', 'STOCK_MANAGER'] },
        { label: 'Delivery Confirmation', href: '/dashboard/sales/delivery-confirmation', icon: CheckCircle2, roles: ['SUPER_ADMIN', 'SALES'] },
      ],
    },
    {
      title: 'REPORTS & ANALYTICS',
      items: [
        { label: 'Sales Performance', href: '/dashboard/sales/performance', icon: TrendingUp, roles: ['SUPER_ADMIN', 'SALES'] },
        { label: 'Sales Reports', href: '/dashboard/sales/reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'SALES', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'DEPARTMENT PANELS',
      items: [
        { label: 'Stock & Inventory', href: '/dashboard/stock', icon: Boxes, roles: ['SUPER_ADMIN', 'STOCK_MANAGER'] },
        { label: 'Production & Batches', href: '/dashboard/production', icon: Factory, roles: ['SUPER_ADMIN', 'PRODUCTION'] },
        { label: 'Accounting & GST', href: '/dashboard/accounting', icon: Calculator, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
        { label: 'GSTR-1 Outward Return', href: '/dashboard/accounting/gstr1', icon: FileCheck, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
        { label: 'CA WhatsApp Export', href: '/dashboard/ca-export', icon: Send, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
        { label: 'Products Master', href: '/dashboard/products', icon: PackageCheck, roles: ['SUPER_ADMIN', 'PRODUCTION', 'STOCK_MANAGER', 'SALES'] },
        { label: 'Admin & Audit Logs', href: '/dashboard/admin', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#F7F4EE] text-[#1A1817] h-screen sticky top-0 flex flex-col border-r border-[#EAE5DC] shadow-[1px_0_4px_rgba(0,0,0,0.02)] shrink-0 overflow-hidden select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#EAE5DC] flex items-center gap-3 shrink-0 bg-[#F2EEE7]/80">
        <div className="w-9 h-9 rounded-xl bg-[#1A1817] flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4 text-[#B8944D]" />
        </div>
        <div>
          <h2 className="font-bold text-xs tracking-wider text-[#1A1817] font-mono">GHANSHYAM</h2>
          <p className="text-[10px] text-[#5C1D24] font-semibold tracking-widest uppercase">AYURVEDIC ERP</p>
        </div>
      </div>

      {/* User Profile Badge */}
      {user && (
        <div className="mx-3 my-3 p-3 rounded-xl bg-white border border-[#EAE5DC] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between shrink-0">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#1A1817] truncate">{user.name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FDF2F4] text-[#6B1D2F] border border-[#F7D2D9] font-bold inline-block mt-0.5 font-mono">
              {user.roles[0]}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin"
      >
        {sections.map((sec, idx) => {
          const permittedItems = sec.items.filter((item) =>
            item.roles.some((r) => hasRole(r))
          );
          if (permittedItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold text-[#8C857E] tracking-wider uppercase font-mono">
                {sec.title}
              </h4>
              {permittedItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#EDE9E0] text-[#5C1D24] font-bold shadow-xs border-l-2 border-[#5C1D24]'
                        : 'text-[#5A544F] hover:bg-[#EFECE5] hover:text-[#1A1817] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#5C1D24]' : 'text-[#8C857E]'}`} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#5C1D24] shrink-0" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#EAE5DC] shrink-0 bg-[#F2EEE7]/60">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FDF2F4] hover:bg-[#FCE4E8] text-[#8C1D2F] border border-[#F7D2D9] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" /> End Session
        </button>
      </div>
    </aside>
  );
}

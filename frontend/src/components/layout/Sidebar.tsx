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
  Leaf,
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
      title: 'PROCUREMENT (SALES INITIATED)',
      items: [
        { label: 'Raw Material Requests', href: '/dashboard/sales/raw-material-requests', icon: Layers, roles: ['SUPER_ADMIN', 'SALES', 'STOCK_MANAGER'] },
        { label: 'Purchase Orders', href: '/dashboard/sales/purchase-orders', icon: ClipboardList, roles: ['SUPER_ADMIN', 'SALES', 'STOCK_MANAGER'] },
        { label: 'Purchase Tracking', href: '/dashboard/sales/purchase-tracking', icon: PackageSearch, roles: ['SUPER_ADMIN', 'SALES', 'STOCK_MANAGER'] },
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
        { label: 'CA WhatsApp Export', href: '/dashboard/ca-export', icon: Send, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
        { label: 'Products Master', href: '/dashboard/products', icon: PackageCheck, roles: ['SUPER_ADMIN', 'PRODUCTION', 'STOCK_MANAGER', 'SALES'] },
        { label: 'Admin & Audit Logs', href: '/dashboard/admin', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-ayurveda-950 text-white h-screen sticky top-0 flex flex-col border-r border-ayurveda-800 shadow-xl shrink-0 overflow-hidden select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-ayurveda-800 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center shadow-lg shadow-gold-500/20">
          <Leaf className="w-5 h-5 text-ayurveda-950" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm tracking-wide text-white">GHANSHYAM</h2>
          <p className="text-[10px] text-gold-400 font-medium tracking-wider">AYURVEDIC ERP</p>
        </div>
      </div>

      {/* User Badge */}
      {user && (
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-ayurveda-900 border border-ayurveda-800 flex items-center justify-between shrink-0">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-medium inline-block mt-0.5">
              {user.roles[0]}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-ayurveda-800 scrollbar-track-transparent"
      >
        {sections.map((sec, idx) => {
          const permittedItems = sec.items.filter((item) =>
            item.roles.some((r) => hasRole(r))
          );
          if (permittedItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-extrabold text-ayurveda-400 tracking-wider uppercase">
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
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'bg-ayurveda-600 text-white shadow-md shadow-ayurveda-600/30'
                        : 'text-ayurveda-200 hover:bg-ayurveda-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-ayurveda-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-gold-400 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-ayurveda-800 shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Terminate Session
        </button>
      </div>
    </aside>
  );
}


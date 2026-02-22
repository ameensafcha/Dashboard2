'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/lib/i18n';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  Coffee,
  DollarSign,
  Users,
  Megaphone,
  Calendar,
  CheckSquare,
  FileText,
  Target,
  Settings,
  ChevronDown,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const { t, isRTL } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const navigation = [
    { name: t.overview, href: '/', icon: LayoutDashboard },
    {
      name: t.salesOrders, href: '/sales', icon: ShoppingCart, children: [
        { name: t.overview, href: '/sales' },
        { name: t.orders, href: '/sales/orders' },
      ]
    },
    {
      name: t.inventory, href: '/inventory', icon: Package, children: [
        { name: t.overview, href: '/inventory' },
        { name: t.rawMaterials, href: '/inventory/raw-materials' },
        { name: t.finishedProducts, href: '/inventory/finished' },
      ]
    },
    {
      name: t.production, href: '/production', icon: Factory, children: [
        { name: t.overview, href: '/production' },
        { name: t.batches, href: '/production/batches' },
        { name: t.qualityControl, href: '/production/quality' },
        { name: t.rnd, href: '/production/rnd' },
      ]
    },
    {
      name: t.productsDashboard || 'Products', href: '/products', icon: Coffee, children: [
        { name: t.overview, href: '/products' },
        { name: t.productCatalog, href: '/products/catalog' },
        { name: t.categories, href: '/products/categories' },
        { name: t.pricing, href: '/products/pricing' },
        { name: t.suppliers, href: '/products/suppliers' },
      ]
    },
    {
      name: t.finance, href: '/finance', icon: DollarSign, children: [
        { name: t.overview, href: '/finance' },
        { name: t.expenses, href: '/finance/expenses' },
      ]
    },
    {
      name: t.crm, href: '/crm', icon: Users, children: [
        { name: t.overview, href: '/crm' },
        { name: t.companies, href: '/crm/companies' },
        { name: t.contacts, href: '/crm/contacts' },
        { name: t.pipeline, href: '/crm/pipeline' },
      ]
    },
    { name: t.marketing, href: '/marketing', icon: Megaphone },
    { name: t.events, href: '/events', icon: Calendar },
    { name: t.teamTasks, href: '/tasks', icon: CheckSquare },
    { name: t.documents, href: '/documents', icon: FileText },
    { name: t.strategy, href: '/strategy', icon: Target },
    { name: t.settings, href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`
          fixed lg:static inset-y-0 z-40
          flex flex-col h-screen w-64 
          transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
          ${mobileOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
          ${isRTL ? 'right-0' : 'left-0'}
        `}
        style={{
          background: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          borderRight: isRTL ? 'none' : '1px solid var(--border)',
          borderLeft: isRTL ? '1px solid var(--border)' : 'none'
        }}
      >
        <div className="flex items-center justify-between h-14 px-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>SAFCHA</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 scrollbar-hide">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.children && item.children.some(child => pathname.startsWith(child.href)));

              const isMenuOpen = openMenus[item.name] || isActive;

              return (
                <li key={item.name} className="flex flex-col">
                  {item.children ? (
                    <div className={cn(
                      "flex items-center w-full rounded-lg transition-all duration-200 ease-in-out cursor-pointer group",
                      isActive
                        ? 'bg-[var(--accent-gold)] text-black font-semibold shadow-md'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center flex-1 pr-3 pl-3 py-2.5 gap-3"
                      >
                        <item.icon className={cn(
                          "w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity",
                          isActive ? 'text-black' : ''
                        )} />
                        <span className="truncate flex-1 text-start font-medium">{item.name}</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMenu(item.name);
                        }}
                        className={cn(
                          "p-2.5 flex items-center justify-center hover:bg-black/10 transition-colors",
                          isRTL ? "rounded-l-lg border-r border-white/5" : "rounded-r-lg border-l border-white/5"
                        )}
                      >
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-200 opacity-70",
                          isMenuOpen ? 'rotate-180' : ''
                        )} />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group gap-3",
                        isActive
                          ? 'bg-[var(--accent-gold)] text-black font-semibold shadow-md'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity",
                        isActive ? 'text-black' : ''
                      )} />
                      <span className="truncate text-start flex-1 font-medium">{item.name}</span>
                    </Link>
                  )}

                  {item.children && (
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isMenuOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                      )}
                    >
                      <ul className="space-y-0.5 py-1" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: 28 }}>
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <li key={child.name}>
                              <Link
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer gap-3",
                                  isChildActive
                                    ? 'text-[var(--accent-gold)] font-medium bg-white/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                )}
                              >
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-all duration-300 flex-shrink-0",
                                  isChildActive
                                    ? "bg-[var(--accent-gold)] scale-110 shadow-[0_0_8px_var(--accent-gold)]"
                                    : "bg-transparent border border-gray-600 group-hover:border-gray-400"
                                )} />
                                <span className="truncate text-start">{child.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center hover:bg-white/10 p-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:border-white/10 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform" style={{ background: 'var(--accent-gold)' }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div className={cn("truncate", isRTL ? "mr-3" : "ml-3")}>
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'Ameen Safcha'}</p>
              <p className="text-xs text-gray-400 capitalize truncate mt-0.5">{user?.role || 'Admin User'}</p>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

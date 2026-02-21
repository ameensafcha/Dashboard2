'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
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

const translations = {
  en: [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    {
      name: 'Sales & Orders', href: '/sales', icon: ShoppingCart, children: [
        { name: 'Orders', href: '/sales/orders' },
        { name: 'Clients', href: '/sales/clients' },
      ]
    },
    {
      name: 'Inventory', href: '/inventory', icon: Package, children: [
        { name: 'Raw Materials', href: '/inventory/raw-materials' },
        { name: 'Finished Products', href: '/inventory/finished' },
      ]
    },
    {
      name: 'Production', href: '/production', icon: Factory, children: [
        { name: 'Batches', href: '/production/batches' },
        { name: 'Quality Control', href: '/production/quality' },
        { name: 'R&D', href: '/production/rnd' },
      ]
    },
    {
      name: 'Products', href: '/products', icon: Coffee, children: [
        { name: 'Product Catalog', href: '/products/catalog' },
        { name: 'Categories', href: '/products/categories' },
        { name: 'Pricing Tiers', href: '/products/pricing' },
        { name: 'Suppliers', href: '/products/suppliers' },
      ]
    },
    { name: 'Finance', href: '/finance', icon: DollarSign },
    {
      name: 'CRM', href: '/crm', icon: Users, children: [
        { name: 'Companies', href: '/crm/companies' },
        { name: 'Contacts', href: '/crm/contacts' },
        { name: 'Pipeline', href: '/crm/pipeline' },
      ]
    },
    { name: 'Marketing', href: '/marketing', icon: Megaphone },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Team & Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Strategy', href: '/strategy', icon: Target },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  ar: [
    { name: 'نظرة عامة', href: '/', icon: LayoutDashboard },
    {
      name: 'المبيعات والطلبات', href: '/sales', icon: ShoppingCart, children: [
        { name: 'الطلبات', href: '/sales/orders' },
        { name: 'العملاء', href: '/sales/clients' },
      ]
    },
    {
      name: 'المخزون', href: '/inventory', icon: Package, children: [
        { name: 'المواد الخام', href: '/inventory/raw-materials' },
        { name: 'المنتجات الجاهزة', href: '/inventory/finished' },
      ]
    },
    {
      name: 'الإنتاج', href: '/production', icon: Factory, children: [
        { name: 'دفعات الإنتاج', href: '/production/batches' },
        { name: 'ضبط الجودة', href: '/production/quality' },
        { name: 'البحث والتطوير', href: '/production/rnd' },
      ]
    },
    {
      name: 'المنتجات', href: '/products', icon: Coffee, children: [
        { name: 'كتالوج المنتجات', href: '/products/catalog' },
        { name: 'الفئات', href: '/products/categories' },
        { name: 'فئات التسعير', href: '/products/pricing' },
        { name: 'الموردون', href: '/products/suppliers' },
      ]
    },
    { name: 'المالية', href: '/finance', icon: DollarSign },
    {
      name: 'إدارة العملاء', href: '/crm', icon: Users, children: [
        { name: 'الشركات', href: '/crm/companies' },
        { name: 'جهات الاتصال', href: '/crm/contacts' },
        { name: 'الفرص البيعية', href: '/crm/pipeline' },
      ]
    },
    { name: 'التسويق', href: '/marketing', icon: Megaphone },
    { name: 'الفعاليات', href: '/events', icon: Calendar },
    { name: 'المهام والفريق', href: '/tasks', icon: CheckSquare },
    { name: 'المستندات', href: '/documents', icon: FileText },
    { name: 'الاستراتيجية', href: '/strategy', icon: Target },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isRTL } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const navigation = translations[isRTL ? 'ar' : 'en'];

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
      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 z-40
          flex flex-col h-screen w-64 
          transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isRTL ? 'left-auto right-0' : 'left-0 right-auto'}
        `}
        style={{
          background: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          borderRight: isRTL ? 'none' : '1px solid var(--border)',
          borderLeft: isRTL ? '1px solid var(--border)' : 'none'
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>SAFCHA</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors"
            style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 scrollbar-hide">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.children && item.children.some(child => pathname.startsWith(child.href)));

              const isMenuOpen = openMenus[item.name] || isActive;

              return (
                <li key={item.name} className="flex flex-col">
                  {item.children ? (
                    <div className={`flex items-center w-full rounded-lg transition-all duration-200 ease-in-out cursor-pointer group ${isActive
                      ? 'bg-[var(--accent-gold)] text-black font-semibold shadow-md'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center flex-1 px-3 py-2.5"
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity ${isActive ? 'text-black' : ''}`} style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
                        <span className="truncate flex-1 text-left" style={{ textAlign: isRTL ? 'right' : 'left' }}>{item.name}</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMenu(item.name);
                        }}
                        className="p-2.5 flex items-center justify-center hover:bg-black/10 rounded-r-lg"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 opacity-70 ${isMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group ${isActive
                        ? 'bg-[var(--accent-gold)] text-black font-semibold shadow-md'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity ${isActive ? 'text-black' : ''}`} style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )}

                  {/* Accordion Sub-items */}
                  {item.children && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                    >
                      <ul className="space-y-0.5 py-1" style={{ marginLeft: isRTL ? 0 : 42, marginRight: isRTL ? 42 : 0 }}>
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <li key={child.name}>
                              <Link
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${isChildActive
                                  ? 'text-[var(--accent-gold)] font-medium bg-white/10'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                                  }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isChildActive ? 'bg-[var(--accent-gold)] shadow-[0_0_5px_var(--accent-gold)]' : 'bg-transparent border border-gray-600'}`} />
                                {child.name}
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

        {/* User section */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center hover:bg-white/10 p-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:border-white/10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0 shadow-sm" style={{ background: 'var(--accent-gold)' }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div className="ml-3 truncate" style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'Ameen Safcha'}</p>
              <p className="text-xs text-gray-400 capitalize truncate mt-0.5">{user?.role || 'Admin User'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

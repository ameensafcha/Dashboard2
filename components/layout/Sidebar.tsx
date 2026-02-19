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
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const translations = {
  en: [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Sales & Orders', href: '/sales', icon: ShoppingCart, children: [
      { name: 'Orders', href: '/sales/orders' },
      { name: 'Clients', href: '/sales/clients' },
    ]},
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Production', href: '/production', icon: Factory, children: [
      { name: 'Batches', href: '/production/batches' },
      { name: 'Quality Control', href: '/production/quality' },
      { name: 'R&D', href: '/production/rnd' },
    ]},
    { name: 'Products', href: '/products', icon: Coffee, children: [
      { name: 'Product Catalog', href: '/products' },
      { name: 'Categories', href: '/products/categories' },
      { name: 'Pricing Tiers', href: '/products/pricing' },
      { name: 'Suppliers', href: '/products/suppliers' },
    ]},
    { name: 'Finance', href: '/finance', icon: DollarSign },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Marketing', href: '/marketing', icon: Megaphone },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Team & Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Strategy', href: '/strategy', icon: Target },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  ar: [
    { name: 'نظرة عامة', href: '/', icon: LayoutDashboard },
    { name: 'المبيعات والطلبات', href: '/sales', icon: ShoppingCart, children: [
      { name: 'الطلبات', href: '/sales/orders' },
      { name: 'العملاء', href: '/sales/clients' },
    ]},
    { name: 'المخزون', href: '/inventory', icon: Package },
    { name: 'الإنتاج', href: '/production', icon: Factory, children: [
      { name: 'دفعات الإنتاج', href: '/production/batches' },
      { name: 'ضبط الجودة', href: '/production/quality' },
      { name: 'البحث والتطوير', href: '/production/rnd' },
    ]},
    { name: 'المنتجات', href: '/products', icon: Coffee, children: [
      { name: 'كتالوج المنتجات', href: '/products' },
      { name: 'الفئات', href: '/products/categories' },
      { name: 'فئات التسعير', href: '/products/pricing' },
      { name: 'الموردون', href: '/products/suppliers' },
    ]},
    { name: 'المالية', href: '/finance', icon: DollarSign },
    { name: 'إدارة العملاء', href: '/crm', icon: Users },
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
  
  const navigation = translations[isRTL ? 'ar' : 'en'];

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 z-40
        flex flex-col h-screen w-60 
        bg-[#1A1A2E] text-white
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isRTL ? 'left-auto right-0 translate-x-0' : 'left-0 right-auto'}
      `}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-[#E8A838]">SAFCHA</h1>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.children && item.children.some(child => pathname.startsWith(child.href)));
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#E8A838] text-black font-medium'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                  
                  {/* Sub-items - show for Products always, others when active */}
                  {(item.children && (item.name === 'Products' || isActive)) && (
                    <ul className="mt-1 space-y-1" style={{ marginLeft: isRTL ? 0 : 36, marginRight: isRTL ? 36 : 0 }}>
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-2 py-1 text-xs rounded ${
                              pathname === child.href
                                ? 'text-[#E8A838]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#E8A838] flex items-center justify-center text-black font-medium flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="ml-3" style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

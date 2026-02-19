'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

const translations = {
  en: {
    title: 'CEO Dashboard',
    quickActions: 'Quick Actions',
    newOrder: 'New Order',
    addStock: 'Add Stock',
    addClient: 'Add Client',
    addExpense: 'Add Expense',
    recentActivity: 'Recent Activity',
  },
  ar: {
    title: 'لوحة تحكم الرئيس التنفيذي',
    quickActions: 'إجراءات سريعة',
    newOrder: 'طلب جديد',
    addStock: 'إضافة مخزون',
    addClient: 'إضافة عميل',
    addExpense: 'إضافة مصروف',
    recentActivity: 'النشاط الأخير',
  },
};

const kpiCardsEn = [
  { title: 'Total Revenue (MTD)', value: 'SAR 125,400', change: '+12.5%', trend: 'up' as const, icon: DollarSign },
  { title: 'Total Orders (MTD)', value: '156', change: '+8.2%', trend: 'up' as const, icon: ShoppingCart },
  { title: 'Inventory Value', value: 'SAR 89,200', change: '-2.1%', trend: 'down' as const, icon: Package },
  { title: 'Active Clients', value: '48', change: '+5.0%', trend: 'up' as const, icon: Users },
];

const kpiCardsAr = [
  { title: 'إجمالي الإيرادات (الشهر)', value: '١٢٥,٤٠٠ ر.س', change: '+١٢.٥٪', trend: 'up' as const, icon: DollarSign },
  { title: 'إجمالي الطلبات (الشهر)', value: '١٥٦', change: '+٨.٢٪', trend: 'up' as const, icon: ShoppingCart },
  { title: 'قيمة المخزون', value: '٨٩,٢٠٠ ر.س', change: '-٢.١٪', trend: 'down' as const, icon: Package },
  { title: 'العملاء النشطون', value: '٤٨', change: '+٥.٠٪', trend: 'up' as const, icon: Users },
];

export default function Home() {
  const { language, isRTL } = useAppStore();
  const t = translations[language];
  const kpis = language === 'en' ? kpiCardsEn : kpiCardsAr;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>{t.title}</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, index) => (
          <div 
            key={index} 
            className="rounded-lg p-6 shadow-sm border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</span>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--muted)' }}
              >
                <kpi.icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{kpi.value}</span>
              <div className={`flex items-center text-sm ${kpi.trend === 'up' ? '' : ''}`} style={{ color: kpi.trend === 'up' ? 'var(--success)' : 'var(--error)' }}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                ) : (
                  <TrendingDown className="w-4 h-4" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                )}
                {kpi.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div 
        className="rounded-lg p-6 shadow-sm border mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t.quickActions}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="p-4 text-center rounded-lg transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">{t.newOrder}</span>
          </button>
          <button 
            className="p-4 text-center rounded-lg transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">{t.addStock}</span>
          </button>
          <button 
            className="p-4 text-center rounded-lg transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">{t.addClient}</span>
          </button>
          <button 
            className="p-4 text-center rounded-lg transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div 
        className="rounded-lg p-6 shadow-sm border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{t.recentActivity}</h2>
        <div className="space-y-4">
          {[
            { color: 'var(--success)', text: 'New Order #ORD-2026-0156 created', time: '2 min ago' },
            { color: 'var(--accent-gold)', text: 'Inventory updated: Palm Leaf Powder +50kg', time: '15 min ago' },
            { color: 'var(--success)', text: 'Production Batch #BATCH-2026-0023 completed', time: '1 hour ago' },
            { color: 'var(--error)', text: 'Low stock alert: Vanilla Extract', time: '2 hours ago' },
          ].map((item, index) => (
            <div 
              key={index} 
              className="flex items-center py-2"
              style={{ borderBottom: index < 3 ? '1px solid var(--border)' : 'none' }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ background: item.color, marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }}
              />
              <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{item.text}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

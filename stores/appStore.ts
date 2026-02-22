import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'admin' | 'operations' | 'factory' | 'marketing' | 'viewer';
  avatar?: string;
}

interface Notification {
  id: string;
  type: 'order' | 'low_stock' | 'task' | 'payment' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme (Light/Dark)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Language (English/Arabic)
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  isRTL: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Global Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User - Default CEO for demo
      user: {
        id: '1',
        name: 'Hardcoded',
        email: 'test@safcha.com',
        role: 'ceo',
        avatar: undefined,
      },
      setUser: (user) => set({ user }),
      
      // Theme
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
      },
      
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Language
      language: 'en',
      setLanguage: (language) => set({ 
        language,
        isRTL: language === 'ar'
      }),
      isRTL: false,
      
      // Notifications
      notifications: [
        {
          id: '1',
          type: 'order',
          title: 'New Order',
          message: 'Order #ORD-2026-0156 created',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: 'Vanilla Extract is running low',
          isRead: false,
          createdAt: new Date(),
        },
      ],
      unreadCount: 2,
      addNotification: (notification) => set((state) => {
        const newNotification = {
          ...notification,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date(),
        };
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.isRead;
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
        };
      }),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      })),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
      
      // Loading
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'safcha-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language,
        isRTL: state.isRTL,
      }),
    }
  )
);

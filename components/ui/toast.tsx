'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];

export function toast({ title, description, type = 'info' }: { title: string; description?: string; type?: 'success' | 'error' | 'info' }) {
  const newToast: Toast = {
    id: Math.random().toString(36).substring(7),
    title,
    description,
    type,
  };
  
  toastListeners.forEach(listener => {
    listener([newToast]);
  });
  
  setTimeout(() => {
    toastListeners.forEach(listener => {
      listener([]);
    });
  }, 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  
  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[300px] p-4 rounded-lg shadow-lg border ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="text-sm mt-1 opacity-80">{t.description}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { getDashboardData } from '@/app/actions/dashboard';
import DashboardClient from './DashboardClient';
import { Clock, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function BusinessHomePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  // Show Coming Soon screen for any non-Safcha business
  if (businessSlug !== 'safcha') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2"
            style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #C9A84C 100%)' }}>
            <Clock className="w-12 h-12 text-black" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-gold)] animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 max-w-md">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
            Coming Soon
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            This business workspace is currently under development. We're working hard to bring it to life.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  try {
    const data = await getDashboardData();
    return (
      <div className="p-4 sm:p-6">
        <DashboardClient data={data} />
      </div>
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      redirect(`/${businessSlug}/welcome`);
    }
    throw err;
  }
}

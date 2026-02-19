import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

export function KPICard({ title, value, change, trend = 'neutral', icon: Icon }: KPICardProps) {
  const trendColors = {
    up: 'text-[#2D6A4F]',
    down: 'text-[#D32F2F]',
    neutral: 'text-[#757575]',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <span className="text-xs sm:text-sm text-[#757575] truncate">{title}</span>
          {Icon && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A2E]" />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-xl sm:text-2xl font-bold text-[#333333] truncate">{value}</span>
          {change && (
            <span className={`flex items-center text-xs sm:text-sm whitespace-nowrap ${trendColors[trend]}`}>
              {trendIcons[trend]} {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

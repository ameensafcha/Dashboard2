export interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="mb-2">
      <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {title}
      </h1>
    </div>
  );
}

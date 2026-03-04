import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0.00 SAR';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00 SAR';

  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
export function serializeValues<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(serializeValues) as any;
  }

  if (typeof data === 'object') {
    // Handle Prisma Decimal
    if ((data as any).constructor?.name === 'Decimal' || (data as any).d !== undefined) {
      return Number(data) as any;
    }

    // Handle Date
    if (data instanceof Date) {
      return data as any;
    }

    const result: any = {};
    for (const key in data) {
      result[key] = serializeValues((data as any)[key]);
    }
    return result;
  }

  return data;
}

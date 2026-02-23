import { Decimal } from '@prisma/client/runtime/library';

/**
 * Safe conversion from Decimal to Number for display purposes.
 * Use toFixed(3) for weights and toFixed(2) for SAR.
 */
export function toSafeNumber(decimal: Decimal | number | string | null | undefined, precision = 2): number {
    if (decimal === null || decimal === undefined) return 0;
    const val = decimal instanceof Decimal ? decimal.toNumber() : Number(decimal);
    return Number(val.toFixed(precision));
}

/**
 * Safe Addition for financial/inventory values.
 */
export function safeAdd(a: Decimal | number, b: Decimal | number): number {
    const valA = a instanceof Decimal ? a.toNumber() : Number(a);
    const valB = b instanceof Decimal ? b.toNumber() : Number(b);
    return Number((valA + valB).toFixed(10)); // Use high precision then round at the end if needed
}

/**
 * Safe Multiplication for financial/inventory values.
 */
export function safeMul(a: Decimal | number, b: Decimal | number): number {
    const valA = a instanceof Decimal ? a.toNumber() : Number(a);
    const valB = b instanceof Decimal ? b.toNumber() : Number(b);
    return Number((valA * valB).toFixed(10));
}

/**
 * Formats a decimal/number for currency display (SAR).
 */
export function formatSAR(amount: Decimal | number | string | null | undefined): string {
    const val = toSafeNumber(amount, 2);
    return `SAR ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a decimal/number for weight display (kg).
 */
export function formatWeight(weight: Decimal | number | string | null | undefined): string {
    const val = toSafeNumber(weight, 3);
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`;
}

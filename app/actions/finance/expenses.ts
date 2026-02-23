'use server';

import prisma from '@/lib/prisma';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ==========================================
// Validation Schemas
// ==========================================

const expenseSchema = z.object({
    category: z.nativeEnum(ExpenseCategory),
    amount: z.number().positive('Amount must be greater than 0'),
    vat: z.number().nonnegative('VAT cannot be negative').optional(),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    vendor: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    date: z.coerce.date(),
    notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof expenseSchema>;

// ==========================================
// Helper Functions
// ==========================================

async function generateExpenseId(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}`;
    const last = await tx.expense.findFirst({
        where: { expenseId: { startsWith: prefix } },
        orderBy: { expenseId: 'desc' },
        select: { expenseId: true },
    });
    let nextNum = 1;
    if (last) {
        const parts = last.expenseId.split('-');
        const num = parseInt(parts[2]);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

async function generateTransactionId(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}`;
    const last = await tx.transaction.findFirst({
        where: { transactionId: { startsWith: prefix } },
        orderBy: { transactionId: 'desc' },
        select: { transactionId: true },
    });
    let nextNum = 1;
    if (last) {
        const parts = last.transactionId.split('-');
        const num = parseInt(parts[2]);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

// ==========================================
// Queries
// ==========================================

export async function getExpenses(category?: ExpenseCategory | 'all') {
    try {
        const where: any = { deletedAt: null };
        if (category && category !== 'all') where.category = category;

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 200,
        });

        return expenses.map(e => ({
            ...e,
            amount: Number(e.amount),
            vat: Number(e.vat),
        }));
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
}

// ==========================================
// Mutations
// ==========================================

export async function createExpense(data: CreateExpenseInput) {
    try {
        // Validate
        const parsed = expenseSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }
        const validated = parsed.data;

        await prisma.$transaction(async (tx) => {
            // Generate IDs inside transaction to prevent race conditions
            const [expenseId, transactionId] = await Promise.all([
                generateExpenseId(tx),
                generateTransactionId(tx),
            ]);

            // Create expense
            await tx.expense.create({
                data: {
                    expenseId,
                    category: validated.category,
                    amount: validated.amount,
                    vat: validated.vat || 0,
                    description: validated.description,
                    vendor: validated.vendor || null,
                    paymentMethod: validated.paymentMethod || null,
                    date: validated.date,
                    notes: validated.notes || null,
                },
            });

            // Create matching transaction
            await tx.transaction.create({
                data: {
                    transactionId,
                    type: 'expense',
                    amount: validated.amount,
                    description: validated.description,
                    referenceId: expenseId,
                    date: validated.date,
                },
            });
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error creating expense:', error);
        return { success: false, error: 'Failed to create expense.' };
    }
}

export async function updateExpense(id: string, data: CreateExpenseInput) {
    try {
        // Validate
        const parsed = expenseSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }
        const validated = parsed.data;

        const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
        if (!existing) return { success: false, error: 'Expense not found.' };

        await prisma.$transaction(async (tx) => {
            await tx.expense.update({
                where: { id },
                data: {
                    category: validated.category,
                    amount: validated.amount,
                    vat: validated.vat || 0,
                    description: validated.description,
                    vendor: validated.vendor || null,
                    paymentMethod: validated.paymentMethod || null,
                    date: validated.date,
                    notes: validated.notes || null,
                },
            });

            // Update linked transaction
            const linkedTxn = await tx.transaction.findFirst({
                where: { referenceId: existing.expenseId, type: 'expense' },
            });
            if (linkedTxn) {
                await tx.transaction.update({
                    where: { id: linkedTxn.id },
                    data: {
                        amount: validated.amount,
                        description: validated.description,
                        date: validated.date,
                    },
                });
            }
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating expense:', error);
        return { success: false, error: 'Failed to update expense.' };
    }
}

export async function deleteExpense(id: string) {
    try {
        const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
        if (!existing) return { success: false, error: 'Expense not found.' };

        await prisma.$transaction(async (tx) => {
            // Soft delete linked transactions
            await tx.transaction.updateMany({
                where: { referenceId: existing.expenseId, type: 'expense' },
                data: { deletedAt: new Date() }
            });
            // Soft delete expense
            await tx.expense.update({
                where: { id },
                data: { deletedAt: new Date() }
            });
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting expense:', error);
        return { success: false, error: 'Failed to delete expense.' };
    }
}

// ==========================================
// Dashboard Summary
// ==========================================

export async function getFinanceSummary() {
    try {
        const [revenueAgg, expenseAgg, transactions] = await Promise.all([
            prisma.transaction.aggregate({
                where: { type: 'revenue', deletedAt: null },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: { type: 'expense', deletedAt: null },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.findMany({
                where: { deletedAt: null },
                orderBy: { date: 'desc' },
                take: 20,
            }),
        ]);

        const totalRevenue = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;
        const totalExpenses = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin: Math.round(profitMargin * 10) / 10,
            revenueCount: revenueAgg._count,
            expenseCount: expenseAgg._count,
            recentTransactions: transactions.map(t => ({
                ...t,
                amount: Number(t.amount),
            })),
        };
    } catch (error) {
        console.error('Error fetching finance summary:', error);
        return {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
            revenueCount: 0,
            expenseCount: 0,
            recentTransactions: [],
        };
    }
}

export async function getTransactions(page = 1, limit = 50) {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.transaction.count({
            where: { deletedAt: null }
        });

        return {
            transactions: transactions.map(t => ({
                ...t,
                amount: Number(t.amount),
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return { transactions: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
}

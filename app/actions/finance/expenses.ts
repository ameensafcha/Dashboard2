'use server';

import prisma from '@/lib/prisma';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ==========================================
// Expense CRUD
// ==========================================

async function generateExpenseId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.expense.count({
        where: { expenseId: { startsWith: `EXP-${year}` } },
    });
    return `EXP-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function generateTransactionId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({
        where: { transactionId: { startsWith: `TXN-${year}` } },
    });
    return `TXN-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function getExpenses(category?: ExpenseCategory | 'all') {
    try {
        const where: any = {};
        if (category && category !== 'all') where.category = category;

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' },
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

export async function createExpense(data: {
    category: ExpenseCategory;
    amount: number;
    vat?: number;
    description: string;
    vendor?: string;
    paymentMethod?: PaymentMethod;
    date: Date;
    notes?: string;
}) {
    try {
        const [expenseId, transactionId] = await Promise.all([
            generateExpenseId(),
            generateTransactionId(),
        ]);

        await prisma.$transaction(async (tx) => {
            // Create expense
            await tx.expense.create({
                data: {
                    expenseId,
                    category: data.category,
                    amount: data.amount,
                    vat: data.vat || 0,
                    description: data.description,
                    vendor: data.vendor || null,
                    paymentMethod: data.paymentMethod || null,
                    date: data.date,
                    notes: data.notes || null,
                },
            });

            // Create matching transaction
            await tx.transaction.create({
                data: {
                    transactionId,
                    type: 'expense',
                    amount: data.amount,
                    description: data.description,
                    referenceId: expenseId,
                    date: data.date,
                },
            });
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
        return { success: true };
    } catch (error) {
        console.error('Error creating expense:', error);
        return { success: false, error: 'Failed to create expense.' };
    }
}

export async function updateExpense(id: string, data: {
    category: ExpenseCategory;
    amount: number;
    vat?: number;
    description: string;
    vendor?: string;
    paymentMethod?: PaymentMethod;
    date: Date;
    notes?: string;
}) {
    try {
        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Expense not found.' };

        await prisma.$transaction(async (tx) => {
            await tx.expense.update({
                where: { id },
                data: {
                    category: data.category,
                    amount: data.amount,
                    vat: data.vat || 0,
                    description: data.description,
                    vendor: data.vendor || null,
                    paymentMethod: data.paymentMethod || null,
                    date: data.date,
                    notes: data.notes || null,
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
                        amount: data.amount,
                        description: data.description,
                        date: data.date,
                    },
                });
            }
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
        return { success: true };
    } catch (error) {
        console.error('Error updating expense:', error);
        return { success: false, error: 'Failed to update expense.' };
    }
}

export async function deleteExpense(id: string) {
    try {
        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Expense not found.' };

        await prisma.$transaction(async (tx) => {
            // Delete linked transaction first
            await tx.transaction.deleteMany({
                where: { referenceId: existing.expenseId, type: 'expense' },
            });
            // Delete expense
            await tx.expense.delete({ where: { id } });
        });

        revalidatePath('/finance');
        revalidatePath('/finance/expenses');
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
                where: { type: 'revenue' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: { type: 'expense' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.findMany({
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

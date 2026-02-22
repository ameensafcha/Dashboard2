'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Hash, Layers, DollarSign, Percent, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createPricingTier, updatePricingTier, PricingTierWithCategory } from '@/app/actions/pricing';
import { toast } from '@/components/ui/toast';
import { Category } from '@prisma/client';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    tierName: z.string().min(1, 'Tier name is required'),
    minOrderKg: z.coerce.number().min(0, 'Must be positive'),
    maxOrderKg: z.coerce.number().min(0, 'Must be positive'),
    pricePerKg: z.coerce.number().min(0, 'Must be positive'),
    discountPercent: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),
    marginPercent: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),
});

interface PricingTierDialogProps {
    categories: Category[];
    defaultCategoryId?: string;
    tierToEdit?: PricingTierWithCategory | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function PricingTierDialog({ defaultCategoryId, tierToEdit, open: controlledOpen, onOpenChange }: PricingTierDialogProps) {
    const { t, isRTL } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    type FormValues = z.infer<typeof formSchema>;
    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            categoryId: defaultCategoryId || '',
            tierName: '',
            minOrderKg: 0,
            maxOrderKg: 0,
            pricePerKg: 0,
            discountPercent: 0,
            marginPercent: 0,
        },
    });

    // Sync form with defaultCategoryId or tierToEdit when they change
    useEffect(() => {
        if (tierToEdit) {
            form.reset({
                categoryId: tierToEdit.categoryId || '',
                tierName: tierToEdit.tierName,
                minOrderKg: Number(tierToEdit.minOrderKg),
                maxOrderKg: tierToEdit.maxOrderKg ? Number(tierToEdit.maxOrderKg) : 0,
                pricePerKg: Number(tierToEdit.pricePerKg),
                discountPercent: Number(tierToEdit.discountPercent),
                marginPercent: Number(tierToEdit.marginPercent),
            });
        } else if (defaultCategoryId) {
            form.reset({
                categoryId: defaultCategoryId,
                tierName: '',
                minOrderKg: 0,
                maxOrderKg: 0,
                pricePerKg: 0,
                discountPercent: 0,
                marginPercent: 0,
            });
        }
    }, [defaultCategoryId, tierToEdit, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let result;
            if (tierToEdit) {
                result = await updatePricingTier(tierToEdit.id, values);
            } else {
                result = await createPricingTier(values);
            }

            if (result.success) {
                toast({
                    title: t.success,
                    description: tierToEdit ? t.tierUpdated : t.tierCreated,
                    type: 'success',
                });
                setOpen(false);
                form.reset();
                if (!tierToEdit && defaultCategoryId) {
                    form.setValue('categoryId', defaultCategoryId);
                }
            } else {
                toast({
                    title: t.error,
                    description: result.error || 'Failed to save pricing tier',
                    type: 'error',
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: t.error,
                description: 'Something went wrong',
                type: 'error',
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button className="bg-[#E8A838] hover:bg-[#d49a2d] text-black shadow-md transition-all active:scale-95 gap-2">
                        <Plus className="w-4 h-4" />
                        {t.addTier}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] border-[var(--border)] shadow-2xl p-0 overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="bg-[var(--muted)]/50 p-6 border-b border-[var(--border)]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">{tierToEdit ? t.editTier : t.addNewTier}</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            {tierToEdit ? (t.editTier) : (t.addNewTier)}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <Input type="hidden" {...field} />
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tierName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                        <Layers className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                        {t.tierName}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Standard Wholesale"
                                            {...field}
                                            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minOrderKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                            <Hash className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                            {t.minOrder}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxOrderKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                            <Hash className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                            {t.maxOrder}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                placeholder={t.optional || "Optional"}
                                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pricePerKg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                            <DollarSign className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                            {t.pricePerKg} (SAR)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discountPercent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                            <Percent className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                            {t.discount} (%)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                {...field}
                                                className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="marginPercent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                                        <Percent className="w-4 h-4 opacity-50 text-[var(--text-secondary)]" />
                                        {t.margin} (%)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            {...field}
                                            className="bg-[var(--muted)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-1 focus:ring-[#E8A838] focus:border-[#E8A838] h-11"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-[var(--border)]">
                            <Button
                                type="submit"
                                className="w-full bg-[#E8A838] hover:bg-[#d49a2d] text-black font-bold h-11 shadow-lg shadow-[#E8A838]/20 transition-all active:scale-95 gap-2"
                            >
                                {tierToEdit ? t.updateTier : t.saveTier}
                                <ChevronRight className={cn("w-4 h-4 transition-transform", isRTL ? "rotate-180" : "")} />
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

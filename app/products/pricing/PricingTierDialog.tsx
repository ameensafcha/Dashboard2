import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createPricingTier, updatePricingTier, PricingTierWithCategory } from '@/app/actions/pricing';
import { toast } from '@/components/ui/toast';
import { Category } from '@prisma/client';

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
                minOrderKg: tierToEdit.minOrderKg,
                maxOrderKg: tierToEdit.maxOrderKg,
                pricePerKg: tierToEdit.pricePerKg,
                discountPercent: tierToEdit.discountPercent,
                marginPercent: tierToEdit.marginPercent,
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
                    title: 'Success',
                    description: `Pricing tier ${tierToEdit ? 'updated' : 'created'} successfully`,
                    type: 'success',
                });
                setOpen(false);
                form.reset();
                // Re-set the default category after reset if adding new
                if (!tierToEdit && defaultCategoryId) {
                    form.setValue('categoryId', defaultCategoryId);
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save pricing tier',
                    type: 'error',
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: 'Error',
                description: 'Something went wrong',
                type: 'error',
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tier
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <DialogHeader>
                    <DialogTitle>{tierToEdit ? 'Edit Pricing Tier' : 'Add Pricing Tier'}</DialogTitle>
                    <DialogDescription>
                        {tierToEdit ? 'Update the details for this pricing tier.' : 'Create a new pricing tier linked to a category.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Hidden category field */}
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
                                    <FormLabel>Tier Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Standard Wholesale" {...field} />
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
                                        <FormLabel>Min Order (kg)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
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
                                        <FormLabel>Max Order (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                placeholder="Optional"
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
                                        <FormLabel>Price / kg (SAR)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
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
                                        <FormLabel>Discount (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
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
                                    <FormLabel>Margin (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" className="bg-[#E8A838] hover:bg-[#d49a2d] text-black">
                                {tierToEdit ? 'Update Tier' : 'Save Tier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

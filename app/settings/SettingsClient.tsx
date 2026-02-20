'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateSystemCapacity } from '@/app/actions/production';
import { useTranslation } from '@/lib/i18n';
import { Factory, Save } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface SettingsClientProps {
    initialCapacityKg: number;
}

export default function SettingsClient({ initialCapacityKg }: SettingsClientProps) {
    const { t } = useTranslation();
    const [capacity, setCapacity] = useState(initialCapacityKg.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveCapacity = async () => {
        const val = parseFloat(capacity);
        if (isNaN(val) || val <= 0) {
            toast({ title: 'Error', description: 'Please enter a valid capacity greater than 0', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateSystemCapacity(val);
            if (result.success) {
                toast({ title: 'Success', description: 'Production capacity updated successfully', type: 'success' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update capacity', type: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="System Settings" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Factory className="w-5 h-5 text-gray-500" />
                            Production Settings
                        </CardTitle>
                        <CardDescription>Configure global constraints for the manufacturing facility.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Maximum Monthly Capacity (kg)</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="max-w-[200px]"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="e.g. 3000"
                                />
                                <Button
                                    onClick={handleSaveCapacity}
                                    disabled={isSaving || capacity === initialCapacityKg.toString()}
                                    className="bg-[#E8A838] hover:bg-[#d69628] text-black"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This value is used to calculate the Capacity Utilization KPI on the Production Dashboard.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

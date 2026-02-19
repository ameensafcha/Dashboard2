import { getProductionBatchById } from '@/app/actions/production';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import QCForm from './qc-form';

export default async function BatchDetailsPage({ params }: { params: { id: string } }) {
    const batch = await getProductionBatchById(params.id);

    if (!batch) {
        return (
            <div className="p-6">
                <PageHeader title="Batch Not Found" />
                <Link href="/production/batches" className="text-[#E8A838] hover:underline mt-4 inline-block">
                    &larr; Back to Batches
                </Link>
            </div>
        );
    }

    const isCompletedOrQC = batch.status === 'completed' || batch.status === 'quality_check' || batch.status === 'failed';

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <Link href="/production/batches" className="flex items-center text-sm text-gray-500 hover:text-black mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Batches
                </Link>
                <div className="flex justify-between items-start">
                    <PageHeader title={`Batch: ${batch.batchNumber}`} />
                    <Badge className={`px-3 py-1 text-sm uppercase ${batch.status === 'completed' ? 'bg-green-500' :
                            batch.status === 'failed' ? 'bg-red-500' :
                                batch.status === 'quality_check' ? 'bg-purple-500' :
                                    'bg-blue-500'
                        } text-white`}>
                        {batch.status.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Batch Info */}
                <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Production Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div>
                            <p className="text-gray-500">Product</p>
                            <p className="font-medium text-lg">{batch.product?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Produced By</p>
                            <p className="font-medium">{batch.producedBy || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Target Quantity</p>
                            <p className="font-medium">{batch.targetQty} kg</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Actual Quantity</p>
                            <p className="font-medium text-[#2D6A4F]">{batch.actualQty ?? '-'} kg</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Yield / Efficiency</p>
                            <p className="font-medium">{batch.yieldPercent ? `${batch.yieldPercent.toFixed(1)}%` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Quality Score</p>
                            <p className="font-medium">{batch.qualityScore ?? '-'} / 10</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Start Date</p>
                            <p className="font-medium">{new Date(batch.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">End Date</p>
                            <p className="font-medium">{batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Ongoing'}</p>
                        </div>
                    </div>
                    {batch.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-500 text-sm">Production Notes</p>
                            <p className="mt-1 text-sm">{batch.notes}</p>
                        </div>
                    )}
                </div>

                {/* Raw Materials */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Raw Materials Used</h3>
                    {batch.batchItems && batch.batchItems.length > 0 ? (
                        <ul className="space-y-3">
                            {batch.batchItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">{item.materialName}</span>
                                    <span className="font-medium">{item.quantityUsed} kg</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No materials logged for this batch.</p>
                    )}
                </div>
            </div>

            {/* QC Section */}
            {batch.qualityChecks && batch.qualityChecks.length > 0 ? (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Quality Control Results</h3>
                    <div className="space-y-4">
                        {batch.qualityChecks.map(qc => (
                            <div key={qc.id} className="border rounded-md p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs text-gray-500">{new Date(qc.checkedAt).toLocaleString()}</span>
                                        <h4 className="font-semibold mt-1">Overall Score: {qc.overallScore} / 10</h4>
                                    </div>
                                    <Badge className={qc.passed ? 'bg-green-500' : 'bg-red-500'}>
                                        {qc.passed ? 'PASSED' : 'FAILED'}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4">
                                    <div>
                                        <span className="block text-gray-500">Visual</span>
                                        <span className={qc.visualInspection === 'pass' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {qc.visualInspection?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Weight</span>
                                        <span className={qc.weightVerification === 'pass' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {qc.weightVerification?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Taste</span>
                                        <span className={qc.tasteTest === 'pass' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {qc.tasteTest?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">SFDA</span>
                                        <span className={qc.sfdaCompliance === 'pass' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {qc.sfdaCompliance?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                {qc.notes && <p className="text-sm mt-4 text-gray-700 italic border-t pt-2 w-full">Notes: {qc.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                !isCompletedOrQC && <QCForm batchId={batch.id} />
            )}
        </div>
    );
}

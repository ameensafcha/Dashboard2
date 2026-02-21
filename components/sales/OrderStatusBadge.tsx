import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@prisma/client';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    switch (status) {
        case 'draft':
            return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Draft</Badge>;
        case 'confirmed':
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
        case 'processing':
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Processing</Badge>;
        case 'shipped':
            return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>;
        case 'delivered':
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Delivered</Badge>;
        case 'cancelled':
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

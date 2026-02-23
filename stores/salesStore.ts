import { create } from 'zustand';
import { OrderChannel, OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

export type SerializedOrderItem = {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
};

export type SerializedInvoice = {
    id: string;
    orderId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    totalAmount: number;
    status: string;
    pdfUrl: string | null;
};

export type SerializedOrder = {
    id: string;
    orderNumber: string;
    date: Date;
    channel: OrderChannel;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    subTotal: number;
    discount: number;
    vat: number;
    shippingCost: number;
    grandTotal: number;
    notes: string | null;
    clientId: string;
    companyId: string | null;
    createdAt: Date;

    client: { id: string; name: string };
    company: { id: string; name: string } | null;
    orderItems: SerializedOrderItem[];
    invoice: SerializedInvoice | null;
};

interface SalesState {
    orders: SerializedOrder[];
    isLoading: boolean;
    setOrders: (orders: SerializedOrder[]) => void;
    setIsLoading: (loading: boolean) => void;
    updateOrderInStore: (orderId: string, updates: Partial<SerializedOrder>) => void;

    // Drawer State
    selectedOrderId: string | null;
    isDrawerOpen: boolean;
    openOrderDrawer: (id: string) => void;
    closeOrderDrawer: () => void;
}

export const useSalesStore = create<SalesState>((set) => ({
    orders: [],
    isLoading: true,
    setOrders: (orders) => set({ orders }),
    setIsLoading: (isLoading) => set({ isLoading }),
    updateOrderInStore: (orderId, updates) => set((state) => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, ...updates } : o),
    })),

    selectedOrderId: null,
    isDrawerOpen: false,
    openOrderDrawer: (id) => set({ selectedOrderId: id, isDrawerOpen: true }),
    closeOrderDrawer: () => set({ selectedOrderId: null, isDrawerOpen: false }),
}));

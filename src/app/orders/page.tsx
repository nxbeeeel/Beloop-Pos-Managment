"use client";

import { usePOSStore } from "@/lib/store";
import { ArrowLeft, Clock, Receipt, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Receipt as ReceiptModal } from "@/components/Receipt";
import { OrderActionModal } from "@/components/OrderActionModal";

export default function OrdersPage() {
    const { orders: localOrders } = usePOSStore();
    const [serverOrders, setServerOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const { user } = useUser();
    const tenantId = user?.publicMetadata?.tenantId as string;
    const outletId = user?.publicMetadata?.outletId as string;

    useEffect(() => {
        const loadHistory = async () => {
            if (!tenantId || !outletId) return;
            try {
                const { POSExtendedService } = await import('@/services/pos-extended');
                const data = await POSExtendedService.getOrders({ tenantId, outletId });
                setServerOrders(data);
            } catch (err) {
                console.error("Failed to load order history", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [tenantId, outletId]);

    // Merge local orders (optimistic / offline) with server orders
    // Prioritize server version if it exists (status might be updated), otherwise show local
    const mergedOrders = [...localOrders, ...serverOrders].reduce((acc, current) => {
        const x = acc.find((item: any) => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            // If we have both, prefer the one that is 'COMPLETED' or has more info? 
            // Usually Server is source of truth.
            // If server has it, use server (it might be in 'COMPLETED' where local is still 'PENDING' if we had that distinction)
            // Currently both are COMPLETED. Let's trust Server if present.
            // If current is from Server (we know this because we merged local THEN server?), we replace?
            // Actually reduce is tricky with order.
            // Let's use a Map for O(1)
            return acc;
        }
    }, []);

    // Better Merge Strategy:
    const serverOrderIds = new Set(serverOrders.map(o => o.id));
    const uniqueLocalOrders = localOrders.filter(o => !serverOrderIds.has(o.id));
    const allOrders = [...uniqueLocalOrders, ...serverOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const [showActionModal, setShowActionModal] = useState(false);
    const { POSExtendedService } = require('@/services/pos-extended'); // Lazy load or move to top if prefer

    const handleVoid = async (reason: string) => {
        if (!selectedOrder) return;
        setIsLoading(true);
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            const success = await POSExtendedService.voidOrder({ tenantId, outletId }, selectedOrder.id, reason);
            if (success) {
                // Refresh list
                const data = await POSExtendedService.getOrders({ tenantId, outletId });
                setServerOrders(data);
                setSelectedOrder(null);
                setShowActionModal(false);
            }
        } catch (err) {
            console.error("Void failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <button className="p-2 hover:bg-white rounded-full transition-colors" aria-label="Back to Home">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                </div>

                <div className="grid gap-4">
                    {isLoading && allOrders.length === 0 ? (
                        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto"></div></div>
                    ) : allOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No orders found</p>
                        </div>
                    ) : (
                        allOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-all cursor-pointer group ${order.status === 'VOIDED' ? 'opacity-60 border-gray-100 bg-gray-50' : 'border-gray-100 hover:shadow-md hover:border-rose-100'
                                    }`}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold text-lg ${order.status === 'VOIDED' ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-rose-600'}`}>
                                            #{order.id.slice(-6)}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                                            order.status === 'VOIDED' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {order.items.length} items • {order.paymentMethod}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xl font-bold ${order.status === 'VOIDED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        ₹{Number(order.totalAmount || order.total).toFixed(2)}
                                    </span>
                                    <div className="p-2 bg-gray-50 rounded-full group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                        <Receipt size={20} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedOrder && (
                <ReceiptModal
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                    onVoid={selectedOrder.status !== 'VOIDED' ? () => setShowActionModal(true) : undefined}
                />
            )}

            {/* Import OrderActionModal dynamically or standard if at top */}
            {selectedOrder && showActionModal && (
                <div style={{ position: 'fixed', zIndex: 9999 }}>
                    {/* We need to import the component. For now assuming it is imported at top. */}
                    {/* Wait, I cannot add imports easily in this chunk. I should use a separate tool call for imports. */}
                </div>
            )}
        </div>
    );
}

"use client";

import { usePOSStore } from "@/lib/store";
import { ArrowLeft, Clock, Receipt, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Receipt as ReceiptModal } from "@/components/Receipt";

export default function OrdersPage() {
    const { orders: localOrders, user: posUser } = usePOSStore();
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

    // Merge recent local orders (not yet synced?) with server orders
    // For simplicity, we prioritize Server Orders, as they are "History".
    // Local orders are "Recent Activity". 
    // Let's just show Server Orders for the "History" page.

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <button className="p-2 hover:bg-white rounded-full transition-colors" aria-label="Back to Home">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Order History (Server)</h1>
                </div>

                <div className="grid gap-4">
                    {isLoading ? (
                        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto"></div></div>
                    ) : serverOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No orders found</p>
                        </div>
                    ) : (
                        serverOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-rose-100 transition-all cursor-pointer group"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-gray-900 group-hover:text-rose-600 transition-colors">#{order.id.slice(-6)}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-700'
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
                                    <span className="text-xl font-bold text-gray-900">₹{Number(order.totalAmount || order.total).toFixed(2)}</span>
                                    <div className="p-2 bg-gray-50 rounded-full group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                        <Receipt size={20} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ReceiptModal
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div>
    );
}

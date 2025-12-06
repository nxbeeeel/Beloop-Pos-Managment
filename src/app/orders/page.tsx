"use client";

import { usePOSStore } from "@/lib/store";
import { ArrowLeft, Clock, Receipt, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Receipt as ReceiptModal } from "@/components/Receipt";

export default function OrdersPage() {
    const { orders } = usePOSStore();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No orders yet</p>
                            <p className="text-sm">Complete a sale to see it here.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
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
                                    <span className="text-xl font-bold text-gray-900">₹{order.total.toFixed(2)}</span>
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

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, CreditCard } from "lucide-react";
import { usePOSStore } from "@/lib/store";

export default function TableDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { user, isLoaded } = useUser();

    const { products, categories, fetchMenu } = usePOSStore();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    const loadOrder = async () => {
        try {
            // For now, fetch from open tables and find by ID
            const { POSExtendedService } = await import("@/services/pos-extended");
            const openTables = await POSExtendedService.getOpenTables({ tenantId, outletId });
            const found = openTables.find((t: any) => t.id === orderId);
            setOrder(found || null);
        } catch (err) {
            console.error("Failed to load order:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user && tenantId && outletId) {
            fetchMenu({ tenantId, outletId });
            loadOrder();
        }
    }, [isLoaded, user, tenantId, outletId]);

    const addItem = async (product: any) => {
        try {
            const { POSExtendedService } = await import("@/services/pos-extended");
            await POSExtendedService.addItemsToTable({ tenantId, outletId }, orderId, [{
                productId: product.id,
                name: product.name,
                quantity: 1,
                price: Number(product.price)
            }]);
            loadOrder();
        } catch (err) {
            console.error("Failed to add item:", err);
        }
    };

    const closeTable = async () => {
        try {
            const { POSExtendedService } = await import("@/services/pos-extended");
            await POSExtendedService.closeTable({ tenantId, outletId }, orderId, paymentMethod);
            window.location.href = "/tables";
        } catch (err) {
            console.error("Failed to close table:", err);
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
                <p className="text-gray-500">Order not found or already closed</p>
                <Link href="/tables" className="text-rose-600 hover:underline">Back to Tables</Link>
            </div>
        );
    }

    const filteredProducts = selectedCategory
        ? products.filter(p => p.categoryId === selectedCategory)
        : products;

    return (
        <div className="flex h-[100dvh] bg-gray-50">
            {/* Left: Menu */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
                    <Link href="/tables">
                        <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Back">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Table {order.tableNumber}</h1>
                        <p className="text-sm text-gray-500">{order.customerName || 'Guest'}</p>
                    </div>
                </header>

                {/* Categories */}
                <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat.id ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => addItem(product)}
                                className="bg-white p-4 rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all text-left"
                            >
                                <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                <div className="text-rose-600 font-bold mt-1">₹{Number(product.price).toFixed(0)}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Order */}
            <div className="w-[380px] bg-white border-l flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg">Current Order</h2>
                    <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                            <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">x{item.quantity}</div>
                            </div>
                            <div className="font-bold text-gray-900">₹{Number(item.total).toFixed(0)}</div>
                        </div>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                        <p className="text-center text-gray-400 py-8">No items yet</p>
                    )}
                </div>

                <div className="p-4 border-t space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="font-medium text-gray-600">Total</span>
                        <span className="font-bold text-2xl text-gray-900">₹{Number(order.totalAmount).toFixed(0)}</span>
                    </div>
                    <button
                        onClick={() => setShowPayment(true)}
                        disabled={!order.items || order.items.length === 0}
                        className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <CreditCard size={20} />
                        Settle Bill
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <h2 className="text-xl font-bold">Payment Method</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {['CASH', 'CARD', 'UPI'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`py-4 rounded-xl font-bold border-2 ${paymentMethod === m
                                            ? 'border-rose-600 bg-rose-50 text-rose-600'
                                            : 'border-gray-200 text-gray-600'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPayment(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={closeTable}
                                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

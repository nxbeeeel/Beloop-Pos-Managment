
import { useState, useEffect } from "react";
import { ShoppingBag, Loader2, Home } from "lucide-react";
import { usePOSStore } from "@/lib/store";
import { MenuGrid } from "@/components/MenuGrid";
import { CartContent } from "@/components/CartContent";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";

interface MenuPanelProps {
    tenantId: string;
    outletId: string;
}

export default function MenuPanel({ tenantId, outletId }: MenuPanelProps) {
    const {
        cart,
        products,
        categories,
        isLoading,
        error,
        fetchMenu,
        total,
        checkout,
        outlet
    } = usePOSStore();

    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    useEffect(() => {
        // Only fetch if we have IDs
        if (tenantId && outletId) {
            console.log("MenuPanel mounting, fetching menu for:", tenantId, outletId);
            fetchMenu({ tenantId, outletId });
        } else {
            console.warn("MenuPanel mounted but missing context:", { tenantId, outletId });
        }

        const handleOpenPayment = () => setShowPayment(true);
        document.addEventListener('open-payment', handleOpenPayment);
        return () => document.removeEventListener('open-payment', handleOpenPayment);
    }, [tenantId, outletId, fetchMenu]);

    const handleCheckout = async (method: string, tendered: number, orderId?: string, payments?: any[]) => {
        const result = await checkout(method, tendered, { tenantId, outletId }, orderId, payments);
        if (result) {
            // FIRE AND FORGET PRINTING
            import('@/lib/printer-bridge').then(({ printerService }) => {
                printerService.printOrder({
                    id: result.id,
                    date: new Date(),
                    total: result.total,
                    taxes: 0, // Mock taxes for now
                    table: 'Walk-in', // Or grab from store state
                    items: result.items.map((i: any) => ({
                        name: i.name,
                        quantity: i.quantity,
                        price: i.price,
                        modifiers: i.modifiers ? Object.values(i.modifiers).flat().map(m => (m as any).name) : [], // Flatten modifiers
                        category: i.category
                    }))
                }).catch(err => console.error("Print failed", err));
            });

            setLastOrder(result);
            setShowPayment(false);
            setShowSuccess(true);
        }
    };

    const handleNewOrder = () => {
        setShowSuccess(false);
        setLastOrder(null);
    };

    // Improved Loading State: Don't show generic loader if we have products (e.g. from cache)
    if (isLoading && products.length === 0) {
        return (
            <div className="flex h-full">
                <div className="flex-1 p-6 bg-gray-50 flex flex-col gap-6 animate-pulse">
                    {/* Categories Skeleton */}
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 w-32 bg-gray-200 rounded-full shrink-0" />
                        ))}
                    </div>
                    {/* Search Skeleton */}
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-xl h-64 border border-gray-100 flex flex-col gap-3">
                                <div className="h-32 bg-gray-200 rounded-lg w-full mb-2" />
                                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                                <div className="mt-auto flex justify-between items-center">
                                    <div className="h-6 w-16 bg-gray-200 rounded" />
                                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Sidebar Skeleton */}
                <aside className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col p-4 gap-4 animate-pulse">
                    <div className="h-8 w-1/2 bg-gray-200 rounded" />
                    <div className="flex-1 flex flex-col gap-4 mt-6">
                        <div className="h-20 bg-gray-50 rounded-lg" />
                        <div className="h-20 bg-gray-50 rounded-lg" />
                        <div className="h-20 bg-gray-50 rounded-lg" />
                    </div>
                    <div className="h-16 w-full bg-gray-200 rounded-xl mt-auto" />
                </aside>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center text-center max-w-sm">
                    <p className="text-red-600 font-bold text-lg mb-2">Failed to Load Menu</p>
                    <p className="text-gray-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => fetchMenu({ tenantId, outletId })}
                        className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // New: Empty State if no products found but not error
    if (!isLoading && products.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center text-center max-w-sm">
                    <Home size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-900 font-bold text-lg mb-2">No Menu Items Found</p>
                    <p className="text-gray-500 text-sm mb-4">The menu appears to be empty.</p>
                    <div className="bg-yellow-50 p-2 rounded text-xs text-left w-full mb-4 font-mono break-all">
                        T: {tenantId}<br />O: {outletId}
                    </div>
                    <button
                        onClick={() => fetchMenu({ tenantId, outletId })}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                        Check Again
                    </button>
                    <button
                        onClick={async () => {
                            const { MenuCacheService } = await import('@/lib/menu-cache');
                            await MenuCacheService.clearCache();
                            window.location.reload();
                        }}
                        className="mt-2 text-xs text-red-500 underline"
                    >
                        Reset Cache & Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <MenuGrid categories={categories} items={products} onEditItem={() => { }} />
            </div>
            <aside className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-rose-500" />Current Order
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto"><CartContent /></div>
                {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span><span className="text-rose-600">₹{total().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setShowPayment(true)}
                            className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-[0.98]"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </aside>
            <PaymentModal isOpen={showPayment} total={total()} onClose={() => setShowPayment(false)} onConfirm={handleCheckout} />
            <PaymentSuccessModal
                isOpen={showSuccess}
                order={lastOrder}
                outlet={outlet}
                onClose={() => setShowSuccess(false)}
                onNewOrder={handleNewOrder}
            />
        </div>
    );
}

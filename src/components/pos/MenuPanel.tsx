
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2, Home, RefreshCw, Wifi, WifiOff, Sparkles } from "lucide-react";
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
        const initMenu = async () => {
            if (!tenantId || !outletId) {
                console.warn("MenuPanel mounted but missing context:", { tenantId, outletId });
                return;
            }

            const { isAuthenticated } = await import('@/services/pos-auth');
            if (!isAuthenticated()) {
                console.log("[MenuPanel] Waiting for auth before fetching menu...");
                const retryTimer = setTimeout(() => {
                    initMenu();
                }, 1000);
                return () => clearTimeout(retryTimer);
            }

            console.log("MenuPanel fetching menu for:", tenantId, outletId);
            fetchMenu({ tenantId, outletId });
        };

        initMenu();

        const handleOpenPayment = () => setShowPayment(true);
        document.addEventListener('open-payment', handleOpenPayment);
        return () => document.removeEventListener('open-payment', handleOpenPayment);
    }, [tenantId, outletId, fetchMenu]);

    const handleCheckout = async (method: string, tendered: number, orderId?: string, payments?: any[]) => {
        const result = await checkout(method, tendered, { tenantId, outletId }, orderId, payments);
        if (result) {
            import('@/lib/printer-bridge').then(({ printerService }) => {
                printerService.printOrder({
                    id: result.id,
                    date: new Date(),
                    total: result.total,
                    taxes: 0,
                    table: 'Walk-in',
                    items: result.items.map((i: any) => ({
                        name: i.name,
                        quantity: i.quantity,
                        price: i.price,
                        modifiers: i.modifiers ? Object.values(i.modifiers).flat().map(m => (m as any).name) : [],
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

    // Premium Loading Skeleton
    if (isLoading && products.length === 0) {
        return (
            <div className="flex h-full bg-slate-950">
                {/* Menu Skeleton */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                    {/* Categories Skeleton */}
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                className="h-10 w-28 bg-slate-800/50 rounded-full shrink-0"
                            />
                        ))}
                    </div>

                    {/* Search Skeleton */}
                    <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-12 w-full bg-slate-800/50 rounded-xl"
                    />

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.2 }}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
                                className="bg-slate-800/30 p-4 rounded-2xl h-64 border border-slate-700/30 flex flex-col gap-3"
                            >
                                <div className="h-32 bg-slate-700/30 rounded-xl w-full mb-2" />
                                <div className="h-4 w-3/4 bg-slate-700/30 rounded" />
                                <div className="h-4 w-1/2 bg-slate-700/30 rounded" />
                                <div className="mt-auto flex justify-between items-center">
                                    <div className="h-6 w-16 bg-slate-700/30 rounded" />
                                    <div className="h-9 w-9 bg-gradient-to-br from-rose-500/30 to-orange-500/30 rounded-xl" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Cart Sidebar Skeleton */}
                <aside className="hidden lg:flex w-[400px] bg-slate-900/50 border-l border-slate-700/50 flex-col p-5 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-xl" />
                        <div className="h-6 w-32 bg-slate-700/30 rounded" />
                    </div>
                    <div className="flex-1 flex flex-col gap-3 mt-4">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.2 }}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                                className="h-20 bg-slate-800/40 rounded-xl"
                            />
                        ))}
                    </div>
                    <div className="h-14 w-full bg-gradient-to-r from-rose-500/30 to-orange-500/30 rounded-xl mt-auto" />
                </aside>
            </div>
        );
    }

    // Premium Error State
    if (error) {
        return (
            <div className="flex h-full bg-slate-950 flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl flex flex-col items-center text-center max-w-md shadow-2xl"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                        <WifiOff className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
                    <button
                        onClick={() => fetchMenu({ tenantId, outletId })}
                        className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:from-rose-600 hover:to-orange-600 transition-all shadow-lg shadow-rose-500/25 flex items-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={18} />
                        Retry Connection
                    </button>
                </motion.div>
            </div>
        );
    }

    // Premium Empty State
    if (!isLoading && products.length === 0) {
        return (
            <div className="flex h-full bg-slate-950 flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl flex flex-col items-center text-center max-w-md shadow-2xl"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mb-6 relative">
                        <Home className="w-10 h-10 text-slate-500" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Menu Items</h3>
                    <p className="text-slate-400 text-sm mb-4">The menu appears to be empty. Add products from the dashboard to get started.</p>

                    <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl text-xs text-left w-full mb-6 font-mono">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <span className="text-emerald-400">●</span> Tenant: <span className="text-slate-300 truncate">{tenantId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="text-emerald-400">●</span> Outlet: <span className="text-slate-300 truncate">{outletId}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => {
                                console.log('[MenuPanel] Check Again clicked');
                                fetchMenu({ tenantId, outletId });
                            }}
                            className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:from-rose-600 hover:to-orange-600 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Refresh Menu
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    console.log('[MenuPanel] Reset Cache clicked');
                                    const { MenuCacheService } = await import('@/lib/menu-cache');
                                    await MenuCacheService.clearCache();
                                    window.location.reload();
                                } catch (err) {
                                    console.error('[MenuPanel] Reset Cache failed:', err);
                                    alert('Failed to clear cache. Check console.');
                                }
                            }}
                            className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                        >
                            Clear Cache & Reload
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main Layout - Premium Design
    return (
        <div className="flex h-full bg-slate-950">
            {/* Menu Grid Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <MenuGrid categories={categories} items={products} onEditItem={() => { }} />
            </div>

            {/* Cart Sidebar - Desktop Only */}
            <aside className="hidden lg:flex w-[400px] bg-slate-900/50 backdrop-blur-sm border-l border-slate-700/50 flex-col">
                {/* Cart Header */}
                <div className="p-5 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={20} className="text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Current Order</h2>
                                <p className="text-xs text-slate-500">{cart.length} items in cart</p>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-lg">
                                <span className="text-rose-400 text-sm font-bold">₹{total().toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <CartContent />
                </div>

                {/* Checkout Footer */}
                {cart.length > 0 && (
                    <div className="p-5 border-t border-slate-700/50 bg-slate-900/80">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                                ₹{total().toFixed(2)}
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowPayment(true)}
                            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl hover:from-rose-600 hover:to-orange-600 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            Proceed to Checkout
                        </motion.button>
                    </div>
                )}
            </aside>

            {/* Modals */}
            <PaymentModal
                isOpen={showPayment}
                total={total()}
                onClose={() => setShowPayment(false)}
                onConfirm={handleCheckout}
            />
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

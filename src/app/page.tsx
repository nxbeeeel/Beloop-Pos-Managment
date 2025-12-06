"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { usePOSStore } from "@/lib/store";
import { MenuGrid } from "@/components/MenuGrid";
import { CartContent } from "@/components/CartContent";
import { PaymentModal } from "@/components/PaymentModal";
import { Receipt } from "@/components/Receipt";
import { LoyaltyModal } from "@/components/LoyaltyModal";
import { SyncService } from "@/services/sync";
import { Loader2, ShoppingBag, RotateCw, Menu, History, Package, X, Home, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function POSPage() {
    const { user, isLoaded } = useUser();
    const {
        products,
        categories,
        cart,
        fetchMenu,
        isLoading,
        error,
        checkout,
        setSaaSContext
    } = usePOSStore();

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Get tenant/outlet from user metadata
    const tenantId = (user?.publicMetadata?.tenantId as string) || process.env.NEXT_PUBLIC_TENANT_ID || '';
    const outletId = (user?.publicMetadata?.outletId as string) || process.env.NEXT_PUBLIC_OUTLET_ID || '';
    const saasContext = { tenantId, outletId };

    // Event Listeners for Cart Actions (decoupled)
    useEffect(() => {
        const openPayment = () => setIsPaymentOpen(true);
        const openLoyalty = () => setIsLoyaltyOpen(true);

        document.addEventListener('open-payment', openPayment);
        document.addEventListener('open-loyalty', openLoyalty);

        return () => {
            document.removeEventListener('open-payment', openPayment);
            document.removeEventListener('open-loyalty', openLoyalty);
        };
    }, []);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => {
            setIsOnline(true);
            SyncService.processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (isLoaded && user && tenantId && outletId) {
            setSaaSContext(tenantId, outletId);
            fetchMenu(saasContext);
            SyncService.startPolling();
        }
    }, [isLoaded, user, fetchMenu, tenantId, outletId, setSaaSContext]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handlePayment = async (method: string, tendered: number) => {
        const order = await checkout(method, tendered, saasContext);
        setLastOrder(order);
        setIsPaymentOpen(false);
    };

    if (!isMounted) return null;

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                <p className="text-gray-500">Please sign in to access the POS.</p>
                <Link href="/sign-in" className="text-pink-600 hover:underline">Sign In</Link>
            </div>
        );
    }

    const total = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Left Side: Menu */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="bg-rose-50 p-2.5 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors"
                            aria-label="Open Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                                Beloop<span className="text-rose-600 text-4xl leading-none">.</span>
                            </h1>
                            <p className="text-xs font-bold text-gray-900 tracking-widest mt-0.5 ml-0.5">POS</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/orders">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all active:scale-95" aria-label="View orders">
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">Orders</span>
                            </button>
                        </Link>
                        <Link href="/inventory">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all active:scale-95" aria-label="View inventory">
                                <Package className="w-4 h-4" />
                                <span className="hidden sm:inline">Inventory</span>
                            </button>
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
                            aria-label="Refresh page"
                        >
                            <RotateCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200 ring-2 ring-white shadow-sm">
                            <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                {/* Menu Grid */}
                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center flex-col gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-rose-500/50" />
                            <p className="text-gray-400 font-medium animate-pulse">Loading menu...</p>
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center flex-col gap-4">
                            <div className="p-4 bg-red-50 rounded-full text-red-500 mb-2">
                                <X size={32} />
                            </div>
                            <p className="text-gray-900 font-bold text-lg">Unable to load menu</p>
                            <p className="text-gray-500 text-sm max-w-xs text-center">{error}</p>
                            <button
                                onClick={() => fetchMenu(saasContext)}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium shadow-lg shadow-gray-900/20 active:scale-95"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <MenuGrid
                            items={products}
                            categories={categories}
                            onEditItem={(item) => console.log("Edit item", item)}
                        />
                    )}
                </main>

                {/* Mobile Cart Toggle */}
                <div className="lg:hidden absolute bottom-6 right-6 z-20">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-gray-900 text-white p-4 rounded-full shadow-xl flex items-center gap-2 relative hover:bg-black transition-all active:scale-90 hover:shadow-2xl hover:-translate-y-1"
                        aria-label="Open cart"
                    >
                        <ShoppingBag className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Side: Cart (Desktop) */}
            <div className="hidden lg:flex w-[420px] bg-white border-l border-gray-200 flex-col h-full shadow-2xl z-20 relative">
                <CartContent />
            </div>

            {/* Sidebar Navigation Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-xl text-gray-900">Beloop<span className="text-rose-600">.</span></h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close Menu">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                <Link href="/" onClick={() => setIsSidebarOpen(false)}>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-medium">
                                        <Home size={20} />
                                        Home
                                    </div>
                                </Link>
                                <Link href="/orders" onClick={() => setIsSidebarOpen(false)}>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                                        <History size={20} />
                                        Orders History
                                    </div>
                                </Link>
                                <Link href="/inventory" onClick={() => setIsSidebarOpen(false)}>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                                        <Package size={20} />
                                        Inventory
                                    </div>
                                </Link>
                                <div className="h-px bg-gray-100 my-2" />
                                <Link href="#" onClick={() => setIsSidebarOpen(false)}>
                                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                                        <Settings size={20} />
                                        Settings
                                    </div>
                                </Link>
                            </nav>

                            <div className="p-4 border-t border-gray-100">
                                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{user.fullName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                                    </div>
                                </div>
                                <SignOutButton>
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </SignOutButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mobile Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsCartOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-[90%] max-w-[400px] bg-white shadow-2xl flex flex-col"
                        >
                            <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
                                <h2 className="font-bold text-lg text-gray-900">Current Order</h2>
                                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm" aria-label="Close cart">
                                    <X size={20} />
                                </button>
                            </div>
                            <CartContent />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={total}
                onConfirm={handlePayment}
            />

            <Receipt
                onClose={() => setLastOrder(null)}
                order={lastOrder}
            />

            <LoyaltyModal
                isOpen={isLoyaltyOpen}
                onClose={() => setIsLoyaltyOpen(false)}
                saasContext={saasContext}
            />
        </div>
    );
}

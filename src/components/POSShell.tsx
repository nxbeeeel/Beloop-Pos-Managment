"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home, ShoppingBag, History, Package, Users, ChefHat,
    Settings, LogOut, Menu, X, Wifi, WifiOff, Loader2
} from "lucide-react";

// Use existing components directly
import { usePOSStore } from "@/lib/store";
import { MenuGrid } from "@/components/MenuGrid";
import { CartContent } from "@/components/CartContent";
import { PaymentModal } from "@/components/PaymentModal";

export type PanelType = 'menu' | 'orders' | 'tables' | 'kitchen' | 'inventory' | 'settings';

interface NavItem {
    id: PanelType;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: 'menu', label: 'Menu', icon: Home },
    { id: 'tables', label: 'Tables', icon: Users },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'orders', label: 'Orders', icon: History },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
];

// Stub panel for features not yet fully migrated
function StubPanel({ name, icon: Icon }: { name: string; icon: React.ElementType }) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <Icon size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">{name}</h2>
            <p className="text-gray-500">Coming soon</p>
        </div>
    );
}

// Menu Panel using existing components
function MenuPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const { cart, products, categories, isLoading, error, fetchMenu, total, checkout } = usePOSStore();
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (tenantId && outletId) {
            fetchMenu({ tenantId, outletId });
        }
    }, [tenantId, outletId, fetchMenu]);

    const handleCheckout = async (method: string, tendered: number) => {
        await checkout(method, tendered, { tenantId, outletId });
        setShowPayment(false);
    };

    if (isLoading && products.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <p className="text-red-500 text-center">{error}</p>
                <button
                    onClick={() => fetchMenu({ tenantId, outletId })}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <MenuGrid
                    categories={categories}
                    items={products}
                    onEditItem={() => { }}
                />
            </div>

            {/* Cart Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-rose-500" />
                        Current Order
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <CartContent />
                </div>
                {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-rose-600">₹{total().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setShowPayment(true)}
                            className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </aside>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPayment}
                total={total()}
                onClose={() => setShowPayment(false)}
                onConfirm={handleCheckout}
            />
        </div>
    );
}

export function POSShell() {
    const { user, isLoaded } = useUser();
    const [activePanel, setActivePanel] = useState<PanelType>('menu');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    const renderPanel = () => {
        switch (activePanel) {
            case 'menu':
                return <MenuPanel tenantId={tenantId} outletId={outletId} />;
            case 'orders':
                return <StubPanel name="Orders" icon={History} />;
            case 'tables':
                return <StubPanel name="Tables" icon={Users} />;
            case 'kitchen':
                return <StubPanel name="Kitchen" icon={ChefHat} />;
            case 'inventory':
                return <StubPanel name="Inventory" icon={Package} />;
            case 'settings':
                return <StubPanel name="Settings" icon={Settings} />;
            default:
                return <MenuPanel tenantId={tenantId} outletId={outletId} />;
        }
    };

    return (
        <div className="flex h-[100dvh] bg-gray-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900 lg:block hidden">
                        Beloop<span className="text-rose-600">.</span>
                    </h1>
                    <div className="lg:hidden flex justify-center">
                        <span className="text-2xl font-bold text-rose-600">B</span>
                    </div>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePanel === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all
                                    ${isActive
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={22} className={isActive ? 'text-rose-500' : ''} />
                                <span className="hidden lg:block">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 space-y-3">
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span className="hidden lg:block">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <SignOutButton>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <LogOut size={20} />
                            <span className="hidden lg:block text-sm font-medium">Logout</span>
                        </button>
                    </SignOutButton>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2" aria-label="Open menu">
                    <Menu size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">
                    Beloop<span className="text-rose-600">.</span>
                </h1>
                <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {isOnline ? <Wifi size={16} className="text-green-600" /> : <WifiOff size={16} className="text-yellow-600" />}
                </div>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h1 className="text-xl font-bold text-gray-900">
                                    Beloop<span className="text-rose-600">.</span>
                                </h1>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2" aria-label="Close menu">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>
                            <nav className="p-4 space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activePanel === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActivePanel(item.id);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                                                ${isActive
                                                    ? 'bg-rose-50 text-rose-600'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon size={22} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                                <SignOutButton>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl">
                                        <LogOut size={20} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </SignOutButton>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden md:mt-0 mt-14 mb-16 md:mb-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePanel}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.15 }}
                        className="h-full"
                    >
                        {renderPanel()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-30">
                <div className="flex justify-around">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const isActive = activePanel === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id)}
                                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all
                                    ${isActive ? 'text-rose-600' : 'text-gray-400'}`}
                            >
                                <Icon size={22} />
                                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

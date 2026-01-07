// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutGrid, Receipt, Users2, ChefHat, Package, Settings,
    LogOut, Menu, X, Wifi, WifiOff, Store, User, Search,
    Bell, SunMoon, Clock, TrendingUp, UserCircle2
} from "lucide-react";

import { usePOSStore } from "@/lib/store";

// Import Panels
import MenuPanel from "@/components/pos/MenuPanel";
import { OrdersPanel } from "@/components/pos/OrdersPanel";
import { TablesPanel } from "@/components/pos/TablesPanel";
import { KitchenPanel } from "@/components/pos/KitchenPanel";
import { InventoryPanel } from "@/components/pos/InventoryPanel";
import { SettingsPanel } from "@/components/pos/SettingsPanel";

export type PanelType = 'menu' | 'orders' | 'tables' | 'kitchen' | 'inventory' | 'settings';

interface NavItem {
    id: PanelType;
    label: string;
    icon: React.ElementType;
    badge?: number;
}

const navItems: NavItem[] = [
    { id: 'menu', label: 'Point of Sale', icon: LayoutGrid },
    { id: 'tables', label: 'Tables', icon: Users2 },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'orders', label: 'Orders', icon: Receipt },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
];

import { PinPadModal } from "@/components/PinPadModal";
import { CustomerSearchModal } from "@/components/CustomerSearchModal";
import { PrinterStatus } from "@/components/PrinterStatus";
import { SyncStatus } from "@/components/SyncStatus";

export function POSShell() {
    const { user, isLoaded } = useUser();
    const { outlet, activeStaff, setActiveStaff } = usePOSStore();
    const [activePanel, setActivePanel] = useState<PanelType>('menu');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    const [isAuthenticating, setIsAuthenticating] = useState(true);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Authentication Handshake
    useEffect(() => {
        const initAuth = async () => {
            if (!isLoaded || !user) return;

            const { isAuthenticated } = await import('@/services/pos-auth');
            if (isAuthenticated()) {
                setIsAuthenticating(false);
                return;
            }

            if (!tenantId || !outletId) {
                console.warn("[POS] Missing tenantId or outletId");
            }

            if (outletId) {
                try {
                    const { loginToPos } = await import('@/services/pos-auth');
                    const result = await loginToPos(outletId);

                    if (result.success && result.outlet) {
                        usePOSStore.setState({
                            outlet: {
                                name: result.outlet.name,
                                address: result.outlet.address || '',
                                phone: result.outlet.phone || ''
                            }
                        });
                    }
                } catch (err) {
                    console.error("[POS] Auth Error", err);
                }
            }
            setIsAuthenticating(false);
        };
        initAuth();
    }, [isLoaded, user, outletId, tenantId]);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const on = () => setIsOnline(true), off = () => setIsOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    const handlePinSuccess = async (pin: string) => {
        try {
            const { verifyStaffPin } = await import('@/services/pin-verification');
            const result = await verifyStaffPin(pin, 'STAFF_LOGIN');

            if (result.success && result.user) {
                setActiveStaff({
                    id: result.user.id,
                    name: result.user.name,
                    role: result.user.role,
                });
                setIsPinModalOpen(false);
            } else {
                if (result.locked) {
                    alert(`Account locked. Wait ${result.remainingMinutes} minutes.`);
                } else {
                    alert(result.error || `Invalid PIN. ${result.remainingAttempts || 0} attempts left.`);
                }
            }
        } catch (error) {
            alert('Failed to verify PIN.');
        }
    };

    // Premium Loading Screen
    if (!isLoaded || isAuthenticating) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 animate-pulse" />
                        <div className="absolute inset-1 rounded-xl bg-slate-900 flex items-center justify-center">
                            <span className="text-3xl font-black text-white">B</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                    </div>
                    <p className="text-slate-400 mt-4 text-sm font-medium">Initializing POS...</p>
                </div>
            </div>
        );
    }

    const renderPanel = () => {
        const props = { tenantId, outletId };
        switch (activePanel) {
            case 'menu': return <MenuPanel {...props} />;
            case 'orders': return <OrdersPanel {...props} />;
            case 'tables': return <TablesPanel {...props} />;
            case 'kitchen': return <KitchenPanel {...props} />;
            case 'inventory': return <InventoryPanel {...props} />;
            case 'settings': return <SettingsPanel user={user} />;
            default: return <MenuPanel {...props} />;
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="flex h-[100dvh] bg-slate-100 overflow-hidden">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* DESKTOP SIDEBAR - Premium Dark Theme */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <aside className="hidden md:flex w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex-col shadow-2xl">
                {/* Logo & Outlet */}
                <div className="p-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <span className="text-xl font-black text-white">B</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">
                                Beloop<span className="text-rose-400">.</span>
                            </h1>
                            <p className="text-xs text-slate-500">Point of Sale</p>
                        </div>
                    </div>

                    {/* Outlet Badge */}
                    <div className="mt-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <Store size={14} className="text-rose-400" />
                            <span className="text-sm font-semibold text-white truncate">
                                {outlet?.name || "Loading..."}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                <Clock size={12} />
                                <span>{formatTime(currentTime)}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 text-xs ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                                <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePanel === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-gradient-to-r from-rose-500/20 to-orange-500/10 text-white border border-rose-500/30 shadow-lg shadow-rose-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }
                                `}
                            >
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : 'bg-slate-800'}`}>
                                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                                </div>
                                <span className="text-sm">{item.label}</span>
                                {item.badge && (
                                    <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Quick Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-800/50">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 mb-2">Quick Actions</p>
                        <button
                            onClick={() => setIsCustomerModalOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                        >
                            <div className="p-2 rounded-lg bg-slate-800">
                                <Search size={18} />
                            </div>
                            <span className="text-sm font-medium">Find Customer</span>
                        </button>
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-800/50">
                    {/* Active Staff */}
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
                                    {activeStaff?.name?.[0] || user?.firstName?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {activeStaff?.name || user?.fullName || "Staff"}
                                    </p>
                                    <p className="text-xs text-slate-500 capitalize">
                                        {activeStaff?.role || (user?.publicMetadata?.role as string) || "Staff"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPinModalOpen(true)}
                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title="Switch User"
                            >
                                <UserCircle2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1"><SyncStatus /></div>
                        <div className="flex-1"><PrinterStatus /></div>
                    </div>

                    {/* Logout */}
                    <SignOutButton>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </SignOutButton>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MOBILE HEADER - Sleek Top Bar */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 px-4 py-3 flex justify-between items-center shadow-lg">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-xl bg-slate-800 text-white"
                >
                    <Menu size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                        <span className="text-sm font-black text-white">B</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white">Beloop</h1>
                        <p className="text-[10px] text-slate-400">{outlet?.name}</p>
                    </div>
                </div>

                <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MOBILE SIDEBAR - Full Screen Overlay */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed left-0 top-0 bottom-0 w-80 bg-slate-900 z-50 flex flex-col"
                        >
                            {/* Mobile Sidebar Header */}
                            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                                        <span className="text-xl font-black text-white">B</span>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">Beloop</h1>
                                        <p className="text-xs text-slate-500">{outlet?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Mobile User Card */}
                            <div className="p-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                        {user?.firstName?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{user?.fullName || "Staff"}</p>
                                        <p className="text-xs text-slate-500 capitalize">
                                            {(user?.publicMetadata?.role as string) || "Staff"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30'
                                                    : 'text-slate-400 hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            <Icon size={22} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Mobile Logout */}
                            <div className="p-4 border-t border-slate-800">
                                <SignOutButton>
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 font-medium">
                                        <LogOut size={20} />
                                        <span>Sign Out</span>
                                    </button>
                                </SignOutButton>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT AREA */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <main className="flex-1 overflow-hidden md:mt-0 mt-14 mb-16 md:mb-0 bg-slate-100">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePanel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {renderPanel()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MOBILE BOTTOM TAB BAR - Modern Floating Style */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900 rounded-2xl px-2 py-2 z-30 shadow-2xl shadow-black/30">
                <div className="flex justify-around">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const isActive = activePanel === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id)}
                                className={`
                                    flex flex-col items-center py-2 px-4 rounded-xl transition-all
                                    ${isActive
                                        ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30'
                                        : 'text-slate-500'
                                    }
                                `}
                            >
                                <Icon size={20} />
                                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MODALS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <PinPadModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                title="Switch Staff"
            />

            <CustomerSearchModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
            />
        </div>
    );
}

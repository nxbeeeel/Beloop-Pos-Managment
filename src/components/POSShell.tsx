// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home, ShoppingBag, History, Package, Users, ChefHat,
    Settings, LogOut, Menu, X, Wifi, WifiOff, Store, User
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
}

const navItems: NavItem[] = [
    { id: 'menu', label: 'Menu', icon: Home },
    { id: 'tables', label: 'Tables', icon: Users },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'orders', label: 'Orders', icon: History },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
];

import { PinPadModal } from "@/components/PinPadModal";
import { CustomerSearchModal } from "@/components/CustomerSearchModal";
import { PrinterStatus } from "@/components/PrinterStatus";
import { SyncStatus } from "@/components/SyncStatus";
// ...

export function POSShell() {
    const { user, isLoaded } = useUser();
    const { outlet, activeStaff, setActiveStaff } = usePOSStore(); // Get outlet from store for shop name
    const [activePanel, setActivePanel] = useState<PanelType>('menu');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    const [isAuthenticating, setIsAuthenticating] = useState(true);

    // Authentication Handshake
    useEffect(() => {
        const initAuth = async () => {
            if (!isLoaded || !user) return;

            // If already authenticated with valid token, skip
            const { isAuthenticated } = await import('@/services/pos-auth');
            if (isAuthenticated()) {
                setIsAuthenticating(false);
                return;
            }

            // Warn if metadata is missing
            if (!tenantId || !outletId) {
                console.warn("[POS Shell] Missing tenantId or outletId in user metadata. Some panels may be empty.");
            }

            // Otherwise, perform login handshake
            if (outletId) {
                console.log("[POS Shell] Starting POS Auth Handshake...");
                try {
                    const { loginToPos } = await import('@/services/pos-auth');
                    const result = await loginToPos(outletId);

                    if (result.success) {
                        console.log("[POS Shell] Auth Success", result);
                        // Save outlet info to store immediately (even if menu is empty)
                        if (result.outlet) {
                            usePOSStore.setState({
                                outlet: {
                                    name: result.outlet.name,
                                    address: result.outlet.address || '',
                                    phone: result.outlet.phone || ''
                                }
                            });
                        }
                    } else {
                        console.error("[POS Shell] Auth Failed", result.error);
                        alert("Failed to authenticate with POS server: " + result.error);
                    }
                } catch (err) {
                    console.error("[POS Shell] Auth Error", err);
                }
            } else {
                console.warn("[POS Shell] No outletId found in user metadata");
            }

            setIsAuthenticating(false);
        };

        initAuth();
    }, [isLoaded, user, outletId]);

    // Debug log to trace initialization issues
    useEffect(() => {
        if (isLoaded) {
            console.log("[POS Shell] Loaded User:", { tenantId, outletId, role: user?.publicMetadata?.role });
        }
    }, [isLoaded, tenantId, outletId, user]);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const on = () => setIsOnline(true), off = () => setIsOnline(false);
        window.addEventListener('online', on); window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);

    const handlePinSuccess = (pin: string) => {
        // Mock Validation for Demo
        // In real app: validate against hashed PINs in settings or local DB
        if (pin === '1234') {
            setActiveStaff({ id: 'u1', name: 'Manager Mike', role: 'Manager' });
            setIsPinModalOpen(false);
        } else if (pin === '5678') {
            setActiveStaff({ id: 'u2', name: 'Server Sarah', role: 'Staff' });
            setIsPinModalOpen(false);
        } else {
            // Shake effect handled by modal if we pass error prop back, but for now just alert
            alert("Invalid PIN (Try 1234 or 5678)");
        }
    };

    if (!isLoaded || isAuthenticating) return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4"><div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent" /><p className="text-gray-500 font-medium">Authenticating...</p></div>;

    const renderPanel = () => {
        switch (activePanel) {
            case 'menu': return <MenuPanel tenantId={tenantId} outletId={outletId} />;
            case 'orders': return <OrdersPanel tenantId={tenantId} outletId={outletId} />;
            case 'tables': return <TablesPanel tenantId={tenantId} outletId={outletId} />;
            case 'kitchen': return <KitchenPanel tenantId={tenantId} outletId={outletId} />;
            case 'inventory': return <InventoryPanel tenantId={tenantId} outletId={outletId} />;
            case 'settings': return <SettingsPanel user={user} />;
            default: return <MenuPanel tenantId={tenantId} outletId={outletId} />;
        }
    };

    return (
        <div className="flex h-[100dvh] bg-gray-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900 lg:block hidden">Beloop<span className="text-rose-600">.</span></h1>
                    <div className="lg:hidden flex justify-center"><span className="text-2xl font-bold text-rose-600">B</span></div>
                    {/* Outlet Info */}
                    <div className="mt-4 hidden lg:block">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <Store size={16} className="text-rose-500" />
                            <span className="truncate">{outlet?.name || "Loading..."}</span>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon, isActive = activePanel === item.id;
                        return (
                            <button key={item.id} onClick={() => setActivePanel(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Icon size={22} className={isActive ? 'text-rose-500' : ''} /><span className="hidden lg:block">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Customer Lookup Button */}
                    <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all mt-4"
                    >
                        <User size={22} className="text-gray-500" />
                        <span className="hidden lg:block">Customer</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-100 space-y-3">
                    {/* User Info */}
                    <div className="hidden lg:flex items-center justify-between px-2 mb-2 bg-gray-50 p-2 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold shrink-0">
                                {activeStaff ? activeStaff.name[0] : (user?.firstName?.[0] || <User size={16} />)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {activeStaff ? activeStaff.name : (user?.fullName || "Staff")}
                                </p>
                                <p className="text-xs text-gray-500 capitalize truncate">
                                    {activeStaff ? activeStaff.role : ((user?.publicMetadata?.role as string) || "Employee")}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPinModalOpen(true)}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-rose-600 transition-colors shadow-sm"
                            title="Switch User"
                        >
                            <Users size={16} />
                        </button>
                    </div>

                    <div className="hidden lg:block px-3 mb-2 space-y-2">
                        <SyncStatus />
                        <PrinterStatus />
                    </div>

                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}<span className="hidden lg:block">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <SignOutButton><button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20} /><span className="hidden lg:block text-sm font-medium">Logout</span></button></SignOutButton>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex justify-between items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2" aria-label="Menu"><Menu size={24} className="text-gray-700" /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold text-gray-900">Beloop<span className="text-rose-600">.</span></h1>
                    <span className="text-xs text-gray-500">{outlet?.name}</span>
                </div>
                <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>{isOnline ? <Wifi size={16} className="text-green-600" /> : <WifiOff size={16} className="text-yellow-600" />}</div>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setIsSidebarOpen(false)} />
                        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }} className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Beloop<span className="text-rose-600">.</span></h1>
                                    <div className="flex items-center gap-2 mt-1 text-gray-600 text-sm">
                                        <Store size={14} />
                                        <span>{outlet?.name || "Loading..."}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2" aria-label="Close"><X size={24} className="text-gray-500" /></button>
                            </div>

                            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
                                    {user?.firstName?.[0] || <User size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{user?.fullName || "Staff"}</p>
                                    <p className="text-xs text-gray-500 capitalize">{(user?.publicMetadata?.role as string) || "Employee"}</p>
                                </div>
                            </div>

                            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                                {navItems.map((item) => {
                                    const Icon = item.icon, isActive = activePanel === item.id;
                                    return <button key={item.id} onClick={() => { setActivePanel(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={22} /><span>{item.label}</span></button>;
                                })}
                            </nav>
                            <div className="p-4 border-t"><SignOutButton><button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20} /><span className="font-medium">Logout</span></button></SignOutButton></div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden md:mt-0 mt-14 mb-16 md:mb-0">
                <AnimatePresence mode="wait">
                    <motion.div key={activePanel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="h-full">{renderPanel()}</motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Tabs */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-2 py-1 z-30">
                <div className="flex justify-around">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon, isActive = activePanel === item.id;
                        return <button key={item.id} onClick={() => setActivePanel(item.id)} className={`flex flex-col items-center py-2 px-3 rounded-lg ${isActive ? 'text-rose-600' : 'text-gray-400'}`}><Icon size={22} /><span className="text-[10px] mt-1 font-medium">{item.label}</span></button>;
                    })}
                </div>
            </nav>

            <PinPadModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                title="Switch Staff User"
            />

            <CustomerSearchModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
            />
        </div>
    );
}

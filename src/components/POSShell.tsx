// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home, ShoppingBag, History, Package, Users, ChefHat,
    Settings, LogOut, Menu, X, Wifi, WifiOff, Loader2,
    Clock, Search, RefreshCw, Trash2, Database, Info, AlertTriangle,
    CheckCircle, Plus, Store, User
} from "lucide-react";

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

// ============= MENU PANEL =============
function MenuPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const { cart, products, categories, isLoading, error, fetchMenu, total, checkout } = usePOSStore();
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (tenantId && outletId) fetchMenu({ tenantId, outletId });
    }, [tenantId, outletId, fetchMenu]);

    const handleCheckout = async (method: string, tendered: number) => {
        await checkout(method, tendered, { tenantId, outletId });
        setShowPayment(false);
    };

    if (isLoading && products.length === 0) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;
    }

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <p className="text-red-500 text-center">{error}</p>
                <button onClick={() => fetchMenu({ tenantId, outletId })} className="px-4 py-2 bg-rose-600 text-white rounded-lg">Retry</button>
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
                        <button onClick={() => setShowPayment(true)} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700">Checkout</button>
                    </div>
                )}
            </aside>
            <PaymentModal isOpen={showPayment} total={total()} onClose={() => setShowPayment(false)} onConfirm={handleCheckout} />
        </div>
    );
}

// ============= ORDERS PANEL =============
function OrdersPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const { orders } = usePOSStore();
    const [serverOrders, setServerOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:orders_history');
                if (cached) { setServerOrders(cached as any[]); setIsLoading(false); }
                if (navigator.onLine && tenantId && outletId) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getOrders({ tenantId, outletId });
                    setServerOrders(data); await setIDB('offline:orders_history', data);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        if (tenantId && outletId) load();
    }, [tenantId, outletId]);

    const allOrders = [...orders, ...serverOrders]
        .reduce((acc, o) => { if (!acc.find((x: any) => x.id === o.id)) acc.push(o); return acc; }, [] as any[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const filtered = search ? allOrders.filter(o => o.id.includes(search)) : allOrders;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-rose-50 rounded-xl p-3"><p className="text-xs text-gray-600">Today</p><p className="text-xl font-bold text-rose-600">{todayOrders.length}</p></div>
                    <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-gray-600">Revenue</p><p className="text-xl font-bold text-green-600">₹{todayTotal.toFixed(0)}</p></div>
                    <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-gray-600">Avg</p><p className="text-xl font-bold text-blue-600">₹{todayOrders.length ? (todayTotal / todayOrders.length).toFixed(0) : 0}</p></div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" /></div> :
                    filtered.length === 0 ? <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 opacity-30" /><p>No orders</p></div> :
                        filtered.map(o => (
                            <div key={o.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold">#{o.id.slice(-6)}</span>
                                    <span className="font-bold text-rose-600">₹{(o.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={14} />{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{o.paymentMethod}</span>
                                </div>
                            </div>
                        ))}
            </div>
        </div>
    );
}

// ============= TABLES PANEL =============
function TablesPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const [tables, setTables] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newNum, setNewNum] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:tables');
                if (cached) { setTables(cached as any[]); setIsLoading(false); }
                if (navigator.onLine && tenantId && outletId) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getOpenTables({ tenantId, outletId });
                    setTables(data); await setIDB('offline:tables', data);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        if (tenantId && outletId) load();
    }, [tenantId, outletId]);

    const openTable = async () => {
        if (!newNum.trim()) return;
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            await POSExtendedService.openTable({ tenantId, outletId }, newNum);
            setNewNum(""); setShowNew(false);
            const data = await POSExtendedService.getOpenTables({ tenantId, outletId });
            setTables(data);
        } catch (err: any) { alert(err.message); }
    };

    const slots = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const getTable = (n: string) => tables.find(t => t.tableNumber === n);

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4 flex justify-between items-center">
                <div><h2 className="text-xl font-bold text-gray-900">Tables</h2><p className="text-sm text-gray-500">{tables.length} active</p></div>
                <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold"><Plus size={20} />Open</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {slots.map(n => {
                        const t = getTable(n);
                        return (
                            <button key={n} onClick={() => !t && (setNewNum(n), setShowNew(true))} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 ${t ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                <div className={`text-3xl font-bold ${t ? 'text-rose-600' : 'text-gray-300'}`}>{n}</div>
                                {t ? <div className="text-sm font-bold text-gray-900">₹{Number(t.totalAmount || 0).toFixed(0)}</div> : <div className="text-xs text-gray-400">Available</div>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <AnimatePresence>
                {showNew && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
                            <h3 className="text-xl font-bold">Open Table</h3>
                            <input type="text" placeholder="Table #" value={newNum} onChange={(e) => setNewNum(e.target.value)} className="w-full px-4 py-3 border rounded-xl" autoFocus />
                            <div className="flex gap-3">
                                <button onClick={() => setShowNew(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
                                <button onClick={openTable} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">Open</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============= KITCHEN PANEL =============
function KitchenPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:kitchen');
                if (cached) { setOrders(cached as any[]); setIsLoading(false); }
                if (navigator.onLine && tenantId && outletId) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getKitchenOrders({ tenantId, outletId });
                    setOrders(data); await setIDB('offline:kitchen', data);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        if (tenantId && outletId) { load(); const i = setInterval(() => navigator.onLine && load(), 15000); return () => clearInterval(i); }
    }, [tenantId, outletId]);

    const bump = async (id: string, status: string) => {
        const next = status === 'NEW' ? 'PREPARING' : 'READY';
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            await POSExtendedService.updateKitchenStatus({ tenantId, outletId }, id, next as any);
            const data = await POSExtendedService.getKitchenOrders({ tenantId, outletId });
            setOrders(data);
        } catch (err) { console.error(err); }
    };

    const elapsed = (t: string) => Math.floor((Date.now() - new Date(t).getTime()) / 60000);

    if (isLoading) return <div className="flex h-full items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><ChefHat className="text-orange-500" />Kitchen</h2>
                <div className="flex gap-2">
                    <span className="bg-red-600 px-3 py-1 rounded-full text-sm font-bold">{orders.filter(o => o.kitchenStatus === 'NEW').length} New</span>
                    <span className="bg-green-600 px-3 py-1 rounded-full text-sm font-bold">{orders.filter(o => o.kitchenStatus === 'READY').length} Ready</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {orders.length === 0 ? <div className="text-center py-20 text-gray-500"><ChefHat size={64} className="mx-auto mb-4 opacity-30" /><p>No orders</p></div> :
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {orders.filter(o => o.kitchenStatus !== 'SERVED').map(o => {
                            const isNew = o.kitchenStatus === 'NEW', isReady = o.kitchenStatus === 'READY';
                            return (
                                <div key={o.id} className={`rounded-xl overflow-hidden ${isNew ? 'bg-red-600 animate-pulse' : isReady ? 'bg-green-700' : 'bg-gray-800'}`}>
                                    <div className="p-3 flex justify-between border-b border-white/10">
                                        <span className="font-bold">{o.tableNumber ? `T${o.tableNumber}` : `#${o.id.slice(-4)}`}</span>
                                        <span className="text-sm">{elapsed(o.createdAt)}m</span>
                                    </div>
                                    <div className="p-3 space-y-1 max-h-24 overflow-y-auto">
                                        {(o.items || []).map((i: any, idx: number) => <div key={idx}><span className="text-orange-300 font-bold mr-2">{i.quantity}x</span>{i.name}</div>)}
                                    </div>
                                    {!isReady && <button onClick={() => bump(o.id, o.kitchenStatus)} className={`w-full py-3 font-bold flex items-center justify-center gap-2 ${isNew ? 'bg-white text-red-600' : 'bg-green-600'}`}><CheckCircle size={18} />{isNew ? 'Start' : 'Ready'}</button>}
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        </div>
    );
}

// ============= INVENTORY PANEL =============
function InventoryPanel({ tenantId, outletId }: { tenantId: string; outletId: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:inventory');
                if (cached) { setProducts(cached as any[]); setLoading(false); }
                if (navigator.onLine && tenantId && outletId) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getInventory({ tenantId, outletId });
                    setProducts(Array.isArray(data) ? data : []); await setIDB('offline:inventory', data);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        if (tenantId && outletId) load();
    }, [tenantId, outletId]);

    const low = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.reorderLevel || 5));
    const out = products.filter(p => (p.stock || 0) === 0);
    const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-gray-600">Total</p><p className="text-xl font-bold text-blue-600">{products.length}</p></div>
                    <div className="bg-yellow-50 rounded-xl p-3"><p className="text-xs text-gray-600">Low</p><p className="text-xl font-bold text-yellow-600">{low.length}</p></div>
                    <div className="bg-red-50 rounded-xl p-3"><p className="text-xs text-gray-600">Out</p><p className="text-xl font-bold text-red-600">{out.length}</p></div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filtered.map(p => {
                    const isLow = (p.stock || 0) > 0 && (p.stock || 0) <= (p.reorderLevel || 5), isOut = (p.stock || 0) === 0;
                    return (
                        <div key={p.id} className={`bg-white rounded-xl p-4 border ${isOut ? 'border-red-300 bg-red-50' : isLow ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-start">
                                <div><h3 className="font-semibold text-gray-900">{p.name}</h3><p className="text-sm text-gray-500">{p.sku}</p></div>
                                <div className="text-right"><p className={`text-2xl font-bold ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>{p.stock || 0}</p></div>
                            </div>
                            {(isLow || isOut) && <div className={`mt-2 flex items-center gap-1 text-sm ${isOut ? 'text-red-600' : 'text-yellow-600'}`}><AlertTriangle size={14} />{isOut ? 'Out of stock' : 'Low stock'}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============= SETTINGS PANEL =============
function SettingsPanel({ user }: { user: any }) {
    const [cacheStats, setCacheStats] = useState<{ keys: number; lastSync: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { OfflineStore } = await import("@/lib/offline-store");
            setCacheStats(await OfflineStore.getStats());
        };
        load(); setIsOnline(navigator.onLine);
    }, []);

    const sync = async () => {
        setIsSyncing(true);
        try {
            const { SyncManager } = await import("@/lib/sync-manager");
            await SyncManager.processQueue(); await SyncManager.pullLatestData();
            const { OfflineStore } = await import("@/lib/offline-store");
            setCacheStats(await OfflineStore.getStats());
        } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    };

    const clear = async () => {
        const { OfflineStore } = await import("@/lib/offline-store");
        await OfflineStore.clearAll();
        setCacheStats(await OfflineStore.getStats());
        alert("Cache cleared");
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Settings size={24} className="text-gray-500" />Settings</h2></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className={`rounded-xl p-4 border ${isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-3">
                        {isOnline ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-yellow-600" />}
                        <div><h3 className="font-bold">{isOnline ? 'Online' : 'Offline'}</h3><p className="text-sm text-gray-600">{isOnline ? 'Connected' : 'Using cached data'}</p></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold mb-3">Account</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{user?.fullName || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-xs">{user?.primaryEmailAddress?.emailAddress || 'N/A'}</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><Database size={18} />Offline Data</h3>
                    <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between"><span className="text-gray-500">Cached</span><span className="font-medium">{cacheStats?.keys || 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Last Sync</span><span className="font-medium text-xs">{cacheStats?.lastSync || 'Never'}</span></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={sync} disabled={isSyncing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium disabled:opacity-50"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />{isSyncing ? 'Syncing' : 'Sync'}</button>
                        <button onClick={clear} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium"><Trash2 size={16} />Clear</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><Info size={18} />About</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="font-medium">1.0.0</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Build</span><span className="font-medium">Enterprise</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============= MAIN POS SHELL =============
export function POSShell() {
    const { user, isLoaded } = useUser();
    const [activePanel, setActivePanel] = useState<PanelType>('menu');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const on = () => setIsOnline(true), off = () => setIsOnline(false);
        window.addEventListener('online', on); window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);

    if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent" /></div>;

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
                </nav>
                <div className="p-4 border-t border-gray-100 space-y-3">
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}<span className="hidden lg:block">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <SignOutButton><button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20} /><span className="hidden lg:block text-sm font-medium">Logout</span></button></SignOutButton>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex justify-between items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2" aria-label="Menu"><Menu size={24} className="text-gray-700" /></button>
                <h1 className="text-lg font-bold text-gray-900">Beloop<span className="text-rose-600">.</span></h1>
                <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>{isOnline ? <Wifi size={16} className="text-green-600" /> : <WifiOff size={16} className="text-yellow-600" />}</div>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setIsSidebarOpen(false)} />
                        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }} className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h1 className="text-xl font-bold text-gray-900">Beloop<span className="text-rose-600">.</span></h1>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2" aria-label="Close"><X size={24} className="text-gray-500" /></button>
                            </div>
                            <nav className="p-4 space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon, isActive = activePanel === item.id;
                                    return <button key={item.id} onClick={() => { setActivePanel(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={22} /><span>{item.label}</span></button>;
                                })}
                            </nav>
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t"><SignOutButton><button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"><LogOut size={20} /><span className="font-medium">Logout</span></button></SignOutButton></div>
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
        </div>
    );
}

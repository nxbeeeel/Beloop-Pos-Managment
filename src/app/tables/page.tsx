"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Clock, Receipt, Loader2, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TableOrder {
    id: string;
    tableNumber: string;
    isOpen: boolean;
    totalAmount: number;
    items: any[];
    customerName?: string;
    openedAt: string;
    kitchenStatus: string;
}

export default function TablesPage() {
    const { user, isLoaded } = useUser();
    const [tables, setTables] = useState<TableOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [showNewTable, setShowNewTable] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState("");

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    const loadTables = async () => {
        try {
            // 1. Try to load from cache first (instant)
            const { OfflineStore } = await import("@/lib/offline-store");
            const cached = await OfflineStore.getTables();
            if (cached && cached.length >= 0) {
                setTables(cached);
                setIsLoading(false);
            }

            // 2. If online, fetch fresh data
            if (navigator.onLine) {
                const { POSExtendedService } = await import("@/services/pos-extended");
                const openTables = await POSExtendedService.getOpenTables({ tenantId, outletId });
                setTables(openTables);
                setIsOffline(false);
                // Cache the fresh data
                await OfflineStore.setTables(openTables);
            } else {
                setIsOffline(true);
            }
        } catch (err) {
            console.error("Failed to load tables:", err);
            setIsOffline(!navigator.onLine);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user && tenantId && outletId) {
            loadTables();
        }

        // Listen for online/offline
        const handleOnline = () => { setIsOffline(false); loadTables(); };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isLoaded, user, tenantId, outletId]);

    const handleOpenTable = async () => {
        if (!newTableNumber.trim()) return;
        try {
            const { POSExtendedService } = await import("@/services/pos-extended");
            await POSExtendedService.openTable({ tenantId, outletId }, newTableNumber);
            setNewTableNumber("");
            setShowNewTable(false);
            loadTables();
        } catch (err: any) {
            alert(err.message || "Failed to open table");
        }
    };

    // Generate a grid of table slots (1-20)
    const tableSlots = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

    const getTableStatus = (tableNum: string) => {
        return tables.find(t => t.tableNumber === tableNum);
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-2 hover:bg-white rounded-full transition-colors" aria-label="Back">
                                <ArrowLeft size={24} className="text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
                            <p className="text-sm text-gray-500">{tables.length} active tables</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNewTable(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                    >
                        <Plus size={20} />
                        Open Table
                    </button>
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tableSlots.map((num) => {
                        const order = getTableStatus(num);
                        const isOccupied = !!order;

                        return (
                            <Link
                                key={num}
                                href={isOccupied ? `/tables/${order.id}` : "#"}
                                onClick={(e) => {
                                    if (!isOccupied) {
                                        e.preventDefault();
                                        setNewTableNumber(num);
                                        setShowNewTable(true);
                                    }
                                }}
                            >
                                <div
                                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                                        ${isOccupied
                                            ? 'bg-rose-50 border-rose-200 hover:border-rose-400 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`text-3xl font-bold ${isOccupied ? 'text-rose-600' : 'text-gray-300'}`}>
                                        {num}
                                    </div>
                                    {isOccupied ? (
                                        <>
                                            <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                                                <Users size={12} />
                                                {order.customerName || 'Guest'}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">
                                                ₹{Number(order.totalAmount).toFixed(0)}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock size={10} />
                                                {new Date(order.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-gray-400 font-medium">Available</div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* New Table Modal */}
            <AnimatePresence>
                {showNewTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
                        >
                            <h2 className="text-xl font-bold text-gray-900">Open New Table</h2>
                            <input
                                type="text"
                                placeholder="Table Number (e.g., 5, A1)"
                                value={newTableNumber}
                                onChange={(e) => setNewTableNumber(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-lg"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNewTable(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleOpenTable}
                                    disabled={!newTableNumber.trim()}
                                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50"
                                >
                                    Open Table
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

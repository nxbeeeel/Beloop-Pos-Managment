"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Clock, ChefHat, CheckCircle, Loader2, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KitchenOrder {
    id: string;
    tableNumber?: string;
    orderType: string;
    kitchenStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
    items: { name: string; quantity: number; notes?: string }[];
    createdAt: string;
    prepStartedAt?: string;
}

const KITCHEN_CACHE_KEY = 'offline:kitchen_orders';

export default function KitchenPage() {
    const { user, isLoaded } = useUser();
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    const tenantId = (user?.publicMetadata?.tenantId as string) || "";
    const outletId = (user?.publicMetadata?.outletId as string) || "";

    const loadOrders = async () => {
        try {
            // 1. Load from cache first
            const { get: getIDB, set: setIDB } = await import('idb-keyval');
            const cached = await getIDB(KITCHEN_CACHE_KEY);
            if (cached) {
                setOrders(cached as KitchenOrder[]);
                setIsLoading(false);
            }

            // 2. If online, fetch fresh data
            if (navigator.onLine) {
                const { POSExtendedService } = await import("@/services/pos-extended");
                const kitchenOrders = await POSExtendedService.getKitchenOrders({ tenantId, outletId });
                setOrders(kitchenOrders);
                setIsOffline(false);
                await setIDB(KITCHEN_CACHE_KEY, kitchenOrders);
            } else {
                setIsOffline(true);
            }
        } catch (err) {
            console.error("Failed to load kitchen orders:", err);
            setIsOffline(!navigator.onLine);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user && tenantId && outletId) {
            loadOrders();
            // Poll every 10 seconds for new orders (only if online)
            const interval = setInterval(() => {
                if (navigator.onLine) loadOrders();
            }, 10000);
            return () => clearInterval(interval);
        }

        // Listen for online/offline
        const handleOnline = () => { setIsOffline(false); loadOrders(); };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isLoaded, user, tenantId, outletId]);

    const bumpOrder = async (orderId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'NEW' ? 'PREPARING' : 'READY';
        try {
            const { POSExtendedService } = await import("@/services/pos-extended");
            await POSExtendedService.updateKitchenStatus({ tenantId, outletId }, orderId, nextStatus as any);
            loadOrders();
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const getElapsedTime = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = Date.now();
        const diff = Math.floor((now - start) / 60000);
        return diff;
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    const newOrders = orders.filter(o => o.kitchenStatus === 'NEW');
    const preparingOrders = orders.filter(o => o.kitchenStatus === 'PREPARING');

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <button className="p-2 hover:bg-gray-800 rounded-lg" aria-label="Back">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <ChefHat size={28} className="text-orange-500" />
                        <h1 className="text-2xl font-bold">Kitchen Display</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="bg-red-600 px-3 py-1 rounded-full font-bold">{newOrders.length} New</div>
                    <div className="bg-orange-600 px-3 py-1 rounded-full font-bold">{preparingOrders.length} Preparing</div>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                    {orders.map((order) => {
                        const elapsed = getElapsedTime(order.prepStartedAt || order.createdAt);
                        const isUrgent = elapsed > 10;
                        const isNew = order.kitchenStatus === 'NEW';

                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`rounded-xl overflow-hidden ${isNew
                                    ? 'bg-red-600 ring-2 ring-red-400 animate-pulse'
                                    : isUrgent
                                        ? 'bg-orange-700 ring-2 ring-orange-400'
                                        : 'bg-gray-800'
                                    }`}
                            >
                                {/* Order Header */}
                                <div className="p-3 flex justify-between items-center border-b border-white/10">
                                    <div>
                                        <span className="font-bold text-lg">
                                            {order.tableNumber ? `T${order.tableNumber}` : `#${order.id.slice(-4)}`}
                                        </span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${order.orderType === 'DINE_IN' ? 'bg-white/20' : 'bg-blue-600'
                                            }`}>
                                            {order.orderType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Clock size={14} />
                                        <span className={isUrgent ? 'text-yellow-300 font-bold' : ''}>
                                            {elapsed}m
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="font-medium">
                                                <span className="text-orange-300 font-bold mr-1">{item.quantity}x</span>
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                    {order.items.some(i => i.notes) && (
                                        <div className="text-xs text-yellow-300 mt-2 italic">
                                            Notes: {order.items.filter(i => i.notes).map(i => i.notes).join(', ')}
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => bumpOrder(order.id, order.kitchenStatus)}
                                    className={`w-full py-3 font-bold text-center flex items-center justify-center gap-2 transition-colors ${isNew
                                        ? 'bg-white text-red-600 hover:bg-gray-100'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    <CheckCircle size={18} />
                                    {isNew ? 'Start Preparing' : 'Mark Ready'}
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                        <ChefHat size={64} className="mb-4 opacity-30" />
                        <p className="text-xl font-medium">No orders in kitchen</p>
                        <p className="text-sm">Waiting for new orders...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

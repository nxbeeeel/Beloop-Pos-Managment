"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { POSExtendedService } from "@/services/pos-extended";
import { ArrowLeft, Search, User, ShoppingBag, Calendar, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function CustomersPage() {
    const { user, isLoaded } = useUser();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const tenantId = (user?.publicMetadata?.tenantId as string);
    const outletId = (user?.publicMetadata?.outletId as string);

    useEffect(() => {
        if (isLoaded && tenantId && outletId) {
            loadCustomers();
        }
    }, [isLoaded, tenantId, outletId, search]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await POSExtendedService.getCustomers({ tenantId, outletId }, search);
            setCustomers(data || []);
        } catch (error) {
            console.error("Failed to load customers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (customer: any) => {
        setSelectedCustomer(customer);
        setHistoryLoading(true);
        try {
            const data = await POSExtendedService.getCustomerHistory({ tenantId, outletId }, customer.id);
            setHistory(data || []);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors" aria-label="Go back">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Customers</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map(customer => (
                            <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewHistory(customer)}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-lg">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                            <p className="text-sm text-gray-500">{customer.phone}</p>
                                        </div>
                                    </div>
                                    <div className="bg-violet-50 text-violet-700 px-2 py-1 rounded text-xs font-bold">
                                        {customer.loyaltyPoints} pts
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                                    <div>
                                        <p className="text-gray-500">Total Orders</p>
                                        <p className="font-medium">{customer.totalOrders}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Spent</p>
                                        <p className="font-medium">${customer.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
                                        {selectedCustomer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                                        <p className="text-sm text-gray-500">Order History</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors" aria-label="Close history">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {historyLoading ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                                ) : history.length === 0 ? (
                                    <div className="text-center text-gray-400 py-12">No order history found</div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map(order => (
                                            <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">#{order.id.slice(-6).toUpperCase()}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <Calendar size={12} />
                                                            {format(new Date(order.date), 'PPP p')}
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-lg">
                                                        ${order.total.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    {order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                                            <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

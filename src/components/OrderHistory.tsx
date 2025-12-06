'use client';

import { usePOSStore } from '@/lib/store';
import { X, Clock, Receipt, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

interface OrderHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderHistory({ isOpen, onClose }: OrderHistoryProps) {
    const { orders } = usePOSStore();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const filteredOrders = orders.filter(order =>
        new Date(order.createdAt).toISOString().split('T')[0] === selectedDate
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" />
                                Order History
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors" aria-label="Close history">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Date Filter */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            aria-label="Filter by date"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Clock size={48} className="opacity-20 mb-4" />
                                <p>No orders found for {selectedDate}.</p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-gray-900">#{order.id}</span>
                                            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-3">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between">
                                                <span>{item.quantity}x {item.menuItem?.name || 'Unknown Item'}</span>
                                                <span>₹{item.totalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{order.paymentMethod}</span>
                                            <span className="font-bold text-lg">₹{order.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Edit this order? This will move items back to cart and remove this record.')) {
                                                        usePOSStore.getState().restoreOrder(order.id);
                                                        onClose();
                                                    }
                                                }}
                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors mr-2"
                                                title="Edit Order"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                            <button className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors" title="Reprint Receipt">
                                                <Receipt size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

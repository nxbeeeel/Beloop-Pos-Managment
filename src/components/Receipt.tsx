'use client';

import { CheckCircle, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrinter } from '@/hooks/usePrinter';

import { usePOSStore } from '@/lib/store';

interface ReceiptProps {
    order: any;
    onClose: () => void;
    onVoid?: () => void;
}

export function Receipt({ order, onClose, onVoid }: ReceiptProps) {
    const { printReceipt, isPrinting } = usePrinter();
    const { outlet } = usePOSStore();

    if (!order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-sm shadow-2xl overflow-hidden relative"
                style={{ borderRadius: '0 0 1rem 1rem' }} // Receipt torn edge effect could go here
            >
                {/* Success Header */}
                <div className="bg-green-500 text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Payment Successful</h2>
                    <p className="opacity-90">Order #{order.id}</p>
                </div>

                {/* Receipt Body (Paper Look) */}
                <div id="receipt-content" className="p-8 bg-white font-mono text-sm space-y-4 relative">
                    {/* Torn Paper Top Effect (CSS Trick) */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />

                    <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
                        <h3 className="text-xl font-bold text-gray-900">{outlet?.name || 'Beloop Enterprise'}</h3>
                        <p className="text-gray-500">{outlet?.address || '123 Tech Street, Silicon Valley'}</p>
                        <p className="text-gray-500">Tel: {outlet?.phone || '+1 (555) 0123-456'}</p>
                    </div>

                    <div className="space-y-2 py-2">
                        {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{item.totalPrice.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-300 space-y-2">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{(order.total / 1.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Tax (10%)</span>
                            <span>₹{(order.total - (order.total / 1.1)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                            <span>Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-300 text-center text-gray-400 text-xs">
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                        <p>Thank you for dining with us!</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    {onVoid ? (
                        <button
                            onClick={onVoid}
                            className="flex-1 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                        >
                            Void Order
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            New Order
                        </button>
                    )}

                    <button
                        onClick={() => printReceipt('receipt-content')}
                        disabled={isPrinting}
                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-gray-900/20 disabled:opacity-50"
                    >
                        <Printer size={18} />
                        {isPrinting ? 'Printing...' : 'Print'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

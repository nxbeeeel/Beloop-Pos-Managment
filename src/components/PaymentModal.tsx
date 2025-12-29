'use client';

import { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
    isOpen: boolean;
    total: number;
    onClose: () => void;
    onConfirm: (method: string, tendered: number) => void;
}

export function PaymentModal({ isOpen, total, onClose, onConfirm }: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'QR'>('CASH');
    const [tendered, setTendered] = useState<string>('');

    const change = method === 'CASH' && tendered ? Math.max(0, parseFloat(tendered || '0') - total) : 0;
    const isValid = method !== 'CASH' || (parseFloat(tendered) >= total);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Payment</h2>
                            <p className="text-gray-400 text-sm">Total Due: <span className="text-white font-mono text-lg">₹{total.toFixed(2)}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors" aria-label="Close payment modal">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Method Selection */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'CASH', icon: Banknote, label: 'Cash' },
                                { id: 'CARD', icon: CreditCard, label: 'Card' },
                                { id: 'QR', icon: QrCode, label: 'QR Pay' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id as any)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method === m.id
                                        ? 'border-rose-600 bg-rose-50 text-rose-600'
                                        : 'border-gray-100 hover:border-gray-200 text-gray-500'
                                        }`}
                                >
                                    <m.icon size={28} />
                                    <span className="font-bold text-sm">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Cash Input */}
                        {method === 'CASH' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Tendered</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={tendered}
                                            onChange={(e) => setTendered(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 text-2xl font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-500 font-medium">Change Due</span>
                                    <span className={`text-xl font-bold font-mono ${change > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        ₹{change.toFixed(2)}
                                    </span>
                                </div>

                                {/* Quick Cash Buttons */}
                                <div className="flex gap-2">
                                    {[10, 20, 50, 100].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setTendered(amount.toString())}
                                            className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            ₹{amount}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setTendered(total.toFixed(2))}
                                        className="flex-1 py-2 bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-200 transition-colors"
                                    >
                                        Exact
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Card/QR Instructions */}
                        {method !== 'CASH' && (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    {method === 'CARD' ? <CreditCard size={32} className="text-blue-500" /> : <QrCode size={32} className="text-purple-500" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Waiting for {method === 'CARD' ? 'Terminal' : 'Scan'}...</h3>
                                    <p className="text-sm text-gray-500">Please complete payment on the device.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => onConfirm(method, parseFloat(tendered) || total)}
                            disabled={!isValid}
                            className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-500/20"
                        >
                            <CheckCircle size={20} />
                            Complete Payment
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

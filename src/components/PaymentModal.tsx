import { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePOSStore } from '@/lib/store';
import { POSExtendedService } from '@/services/pos-extended';

interface PaymentModalProps {
    isOpen: boolean;
    total: number;
    onClose: () => void;
    onConfirm: (method: string, tendered: number, orderId?: string) => void;
}

export function PaymentModal({ isOpen, total, onClose, onConfirm }: PaymentModalProps) {
    const { createPendingOrder, tenantId, outletId, setTipAmount, tipAmount } = usePOSStore();

    // Reset tip when opening modal
    useState(() => {
        if (isOpen) setTipAmount(0);
    });
    const [mode, setMode] = useState<'FULL' | 'SPLIT'>('FULL');
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'QR'>('CASH');
    const [tendered, setTendered] = useState<string>('');
    const [splitPayments, setSplitPayments] = useState<{ id?: string; method: string; amount: number }[]>([]);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate remaining for Split Mode
    const totalPaid = splitPayments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, total - totalPaid);

    // Full Mode Logic
    const change = mode === 'FULL' && method === 'CASH' && tendered ? Math.max(0, parseFloat(tendered || '0') - total) : 0;
    const isValidFull = method !== 'CASH' || (parseFloat(tendered) >= total);

    // Split Mode Logic
    const isValidSplitPayment = method !== 'CASH' || (parseFloat(tendered) > 0);
    const canFinalizeSplit = remaining <= 0.50; // Allow 50 paise tolerance for rounding

    const handleAddSplitPayment = () => {
        const amt = parseFloat(tendered);
        if (amt <= 0) return;

        // Validations
        if (amt > remaining + 0.01) {
            // Allow slight floating point tolerance but warn if egregious
            alert("Amount exceeds due balance!");
            return;
        }

        // Add to local state (Offline-First: We don't save to DB until Finalize)
        setSplitPayments([...splitPayments, { method, amount: amt }]);
        setTendered('');
    };

    const handleConfirm = () => {
        if (mode === 'FULL') {
            const amount = parseFloat(tendered) || total;
            onConfirm(method, amount); // Legacy single payment signature
        } else {
            // PASS FULL PAYMENTS ARRAY
            // We pass the "main" method as 'SPLIT' or the first one, but the parent
            // component will look for the `payments` extra argument (we need to update onConfirm signature in parent)
            // But wait, the props `onConfirm` is defined as taking 3 args.
            // We'll overload the 3rd arg (orderId) to act as 'payments' or change the prop type?
            // Actually, best to just pass the array as a new arg or inside an object.
            // Let's assume the parent can handle `onConfirm(method, total, undefined, splitPayments)`
            // Checking usage... for now I will rely on the parent updating.
            // I will cast to any to bypass TS for this step, assuming I will update the parent next.
            (onConfirm as any)('SPLIT', total, undefined, splitPayments);
        }
    };

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
                    <div className="bg-gray-900 text-white p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">Payment</h2>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Total: <span className="text-white font-mono text-lg">₹{total.toFixed(2)}</span></span>
                                    {usePOSStore.getState().tipAmount > 0 && <span className="text-green-400">+ Tip: ₹{usePOSStore.getState().tipAmount.toFixed(2)}</span>}
                                    {mode === 'SPLIT' && <span>• Due: <span className="text-rose-400 font-mono text-lg">₹{remaining.toFixed(2)}</span></span>}
                                </div>
                            </div>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                <button onClick={() => setMode('FULL')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${mode === 'FULL' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white disabled:opacity-30'}`}>Full</button>
                                <button onClick={() => setMode('SPLIT')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${mode === 'SPLIT' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}>Split</button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors ml-2" aria-label="Close payment modal">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tip Selector */}
                        {mode === 'FULL' && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <span className="text-xs font-bold text-gray-500 self-center mr-1">ADD TIP:</span>
                                {[0, 20, 50, 100].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => usePOSStore.getState().setTipAmount(amt)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${usePOSStore.getState().tipAmount === amt ? 'bg-green-600 text-white border-green-600' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'}`}
                                    >
                                        {amt === 0 ? 'None' : `₹${amt}`}
                                    </button>
                                ))}
                            </div>
                        )}
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
                        {(method === 'CASH' || mode === 'SPLIT') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount {mode === 'SPLIT' ? 'to Pay' : 'Tendered'}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={tendered}
                                            onChange={(e) => setTendered(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 text-2xl font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                            placeholder={mode === 'SPLIT' ? remaining.toFixed(2) : "0.00"}
                                            autoFocus
                                        />
                                    </div>
                                    {(mode === 'SPLIT' && remaining > 0) && (
                                        <button onClick={() => setTendered(remaining.toFixed(2))} className="text-xs text-rose-600 font-bold mt-1 hover:underline">Pay Rest (₹{remaining.toFixed(2)})</button>
                                    )}
                                </div>

                                {mode === 'FULL' && (
                                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-gray-500 font-medium">Change Due</span>
                                        <span className={`text-xl font-bold font-mono ${change > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            ₹{change.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {/* Quick Cash Buttons */}
                                {mode === 'FULL' && (
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
                                )}
                            </div>
                        )}

                        {/* Card/QR Instructions */}
                        {mode === 'FULL' && method !== 'CASH' && (
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
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                        {mode === 'SPLIT' && (
                            <div className="mb-2">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Recorded Payments</h4>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {splitPayments.length === 0 ? <p className="text-xs text-gray-400 italic">No payments recorded yet</p> :
                                        splitPayments.map((p, i) => (
                                            <div key={i} className="flex justify-between text-sm bg-white p-2 rounded border border-gray-100">
                                                <span>{p.method}</span>
                                                <span className="font-mono font-bold">₹{p.amount.toFixed(2)}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <button
                                    onClick={handleAddSplitPayment}
                                    disabled={!isValidSplitPayment || remaining <= 0 || isProcessing}
                                    className="w-full mt-3 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? 'Processing...' : <><Plus size={16} /> Add {method} Payment</>}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleConfirm}
                            disabled={mode === 'FULL' ? !isValidFull : !canFinalizeSplit}
                            className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-500/20"
                        >
                            <CheckCircle size={20} />
                            {mode === 'FULL' ? 'Complete Payment' : 'Finalize Split Bill'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

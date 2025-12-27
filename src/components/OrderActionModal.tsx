import { useState } from 'react';
import { XCircle, AlertTriangle, Keypad } from 'lucide-react';

interface OrderActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVoid: (reason: string) => void;
    orderId: string;
}

export function OrderActionModal({ isOpen, onClose, onVoid, orderId }: OrderActionModalProps) {
    const [reason, setReason] = useState('');
    const [step, setStep] = useState<'SELECT' | 'REASON' | 'CONFIRM'>('SELECT');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Manage Order #{orderId.slice(-6)}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close Modal">
                        <XCircle className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'SELECT' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setStep('REASON')}
                                className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl flex items-center gap-3 transition-colors text-left"
                            >
                                <div className="p-2 bg-white rounded-lg">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <div className="font-bold">Void Order</div>
                                    <div className="text-sm opacity-80">Cancel order and restore inventory</div>
                                </div>
                            </button>

                            {/* Placeholder for Refund or Reprints */}
                            <button
                                onClick={() => { }}
                                className="w-full p-4 bg-gray-50 text-gray-400 rounded-xl flex items-center gap-3 cursor-not-allowed text-left"
                            >
                                <div className="p-2 bg-white rounded-lg">
                                    <Keypad size={24} />
                                </div>
                                <div>
                                    <div className="font-bold">Refund (Full/Partial)</div>
                                    <div className="text-sm opacity-80">Coming Soon</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'REASON' && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex gap-2 text-sm text-yellow-800">
                                <AlertTriangle size={16} className="mt-0.5" />
                                <p>This action will strictly audit logged. Inventory will be restored.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Void</label>
                                <textarea
                                    className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                    rows={3}
                                    placeholder="e.g. Mistake in entry, Customer changed mind..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep('SELECT')}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => onVoid(reason)}
                                    disabled={!reason.trim()}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirm Void
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CheckCircle, Printer, Mail, ArrowRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReceiptTemplate } from './ReceiptTemplate';

interface PaymentSuccessModalProps {
    isOpen: boolean;
    order: any;
    outlet: any;
    onClose: () => void;
    onNewOrder: () => void;
}

export function PaymentSuccessModal({ isOpen, order, outlet, onClose, onNewOrder }: PaymentSuccessModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    // Setup Print Hook
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${order?.id || 'New'}`,
        onAfterPrint: () => console.log('Print successful'),
    });

    if (!isOpen || !order) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Confetti / Success Header */}
                    <div className="bg-green-600 text-white p-8 flex flex-col items-center justify-center text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4"
                        >
                            <CheckCircle size={48} className="text-green-600" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-1">Payment Successful</h2>
                        <p className="text-green-100 font-medium">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-2xl font-bold mt-2 font-mono">₹{Number(order.total).toFixed(2)}</p>
                    </div>

                    {/* Actions */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handlePrint && handlePrint()}
                                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all font-bold text-gray-700"
                            >
                                <Printer size={28} className="text-gray-900" />
                                <span>Print Receipt</span>
                            </button>
                            <button
                                onClick={() => alert("Email receipt feature coming soon!")}
                                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all font-bold text-gray-700"
                            >
                                <Mail size={28} className="text-blue-600" />
                                <span>Email</span>
                            </button>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={onNewOrder}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <span>Start New Order</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        <button onClick={onClose} className="w-full text-center text-sm text-gray-500 hover:text-gray-900 font-medium py-2">
                            Close & Return to Menu
                        </button>
                    </div>

                    {/* Hidden Receipt Component for Printing */}
                    <div className="hidden">
                        <ReceiptTemplate ref={componentRef} order={order} outlet={outlet} />
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}

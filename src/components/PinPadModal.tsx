import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, User } from 'lucide-react';

interface PinPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => void;
    title?: string;
}

export const PinPadModal = ({ isOpen, onClose, onSuccess, title = "Enter Staff PIN" }: PinPadModalProps) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleSubmit = () => {
        if (pin.length === 4) {
            // In a real app, validation might happen here or in parent
            onSuccess(pin);
        }
    };

    // Auto-submit on 4 digits
    useEffect(() => {
        if (pin.length === 4) {
            handleSubmit();
        }
    }, [pin]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className="bg-gray-50 p-6 flex flex-col items-center border-b border-gray-100 relative">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <User size={32} className="text-gray-400" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>

                        {/* PIN Dots */}
                        <div className="flex gap-4 mt-6 mb-2">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                                            ? error ? 'bg-red-500 scale-110' : 'bg-rose-500 scale-110'
                                            : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm font-bold mt-2 animate-pulse">Invalid PIN</p>}
                    </div>

                    <div className="p-6 bg-white">
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleDigit(num.toString())}
                                    className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-2xl font-bold text-gray-700 transition-colors shadow-sm border border-gray-100"
                                    aria-label={`Digit ${num}`}
                                >
                                    {num}
                                </button>
                            ))}
                            <div /> {/* Spacer */}
                            <button
                                onClick={() => handleDigit('0')}
                                className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-2xl font-bold text-gray-700 transition-colors shadow-sm border border-gray-100"
                                aria-label="Digit 0"
                            >
                                0
                            </button>
                            <button
                                onClick={handleBackspace}
                                className="aspect-square rounded-2xl bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-500 transition-colors flex items-center justify-center"
                                aria-label="Backspace"
                            >
                                <Delete size={24} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

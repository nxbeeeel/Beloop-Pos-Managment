'use client';

import { usePOSStore, MenuItem } from '@/lib/store';
import { X, Save, IndianRupee, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MenuItem | null;
}

export function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
    const { setOverride, overrides } = usePOSStore();
    const [price, setPrice] = useState<string>('');
    const [alias, setAlias] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        if (item) {
            const override = overrides[item.id];
            setPrice(override?.price?.toString() || item.price.toString());
            setAlias(override?.alias || item.name);
            setIsAvailable(override?.isAvailable !== false);
        }
    }, [item, overrides, isOpen]);

    const handleSave = () => {
        if (!item) return;

        setOverride(item.id, {
            price: parseFloat(price),
            alias: alias !== item.name ? alias : undefined,
            isAvailable: isAvailable
        });
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Edit Item</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors" aria-label="Close modal">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Original Info */}
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                            <p>Original Name: <span className="font-medium text-gray-900">{item.name}</span></p>
                            <p>Base Price: <span className="font-medium text-gray-900">₹{item.price.toFixed(2)}</span></p>
                        </div>

                        {/* Price Override */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price (Override)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-lg"
                                    aria-label="Selling Price"
                                />
                            </div>
                        </div>

                        {/* Alias Override */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name (Alias)</label>
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Happy Hour Burger"
                            />
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                {isAvailable ? <Eye className="text-green-600" /> : <EyeOff className="text-gray-400" />}
                                <span className="font-medium text-gray-900">Available for Sale</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="sr-only peer" aria-label="Available for sale" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

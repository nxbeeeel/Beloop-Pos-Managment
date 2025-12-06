'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, Edit3 } from 'lucide-react';
import { OrderItem, usePOSStore } from '@/lib/store';
import { useState } from 'react';

interface CartItemProps {
    item: OrderItem;
}

export const CartItem = ({ item }: CartItemProps) => {
    const { removeFromCart, addToCart } = usePOSStore();
    const [isEditingNote, setIsEditingNote] = useState(false);

    const handleIncrement = () => {
        addToCart(item.menuItem, 1, item.modifiers);
    };

    const handleDecrement = () => {
        if (item.quantity > 1) {
            addToCart(item.menuItem, -1, item.modifiers);
        } else {
            removeFromCart(item.id);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 group"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-gray-800">{item.menuItem.name}</h4>
                    <p className="text-primary font-bold">₹{item.totalPrice.toFixed(2)}</p>
                </div>
                <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Modifiers (Placeholder) */}
            {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                <div className="text-xs text-gray-500 mb-2 space-y-1">
                    {Object.entries(item.modifiers).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button
                        onClick={handleDecrement}
                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600"
                        aria-label="Decrease quantity"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button
                        onClick={handleIncrement}
                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600"
                        aria-label="Increase quantity"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <button
                    onClick={() => setIsEditingNote(!isEditingNote)}
                    className={`p-2 rounded-lg transition-colors ${isEditingNote ? 'text-primary bg-rose-50' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    aria-label="Edit note"
                >
                    <Edit3 size={16} />
                </button>
            </div>

            {/* Note Input */}
            {isEditingNote && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                >
                    <input
                        type="text"
                        placeholder="Add note (e.g. No onions)"
                        className="w-full text-sm p-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-primary"
                        autoFocus
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

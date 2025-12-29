import { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '@/lib/store';

interface ModifierGroup {
    id: string;
    name: string; // e.g., "Toppings", "Crust", "Spice Level"
    min: number;
    max: number;
    options: {
        id: string;
        name: string;
        price: number;
    }[];
}

// MOCK CONFIG - In real app, this comes from item.modifiers
const MOCK_MODIFIERS: Record<string, ModifierGroup[]> = {
    'Food': [
        {
            id: 'toppings',
            name: 'Extra Toppings',
            min: 0,
            max: 3,
            options: [
                { id: 'cheese', name: 'Extra Cheese', price: 20 },
                { id: 'onion', name: 'Caramelized Onion', price: 15 },
                { id: 'mushrooms', name: 'Mushrooms', price: 25 },
                { id: 'jalapeno', name: 'Jalapenos', price: 10 },
            ]
        },
        {
            id: 'notes',
            name: 'Preparation',
            min: 0,
            max: 1,
            options: [
                { id: 'no_onion', name: 'No Onions', price: 0 },
                { id: 'spicy', name: 'Make it Spicy', price: 0 },
                { id: 'cut_1_2', name: 'Cut 1/2', price: 0 },
            ]
        }
    ],
    'Drinks': [
        {
            id: 'sugar',
            name: 'Sugar Level',
            min: 1,
            max: 1,
            options: [
                { id: '100', name: '100%', price: 0 },
                { id: '75', name: '75%', price: 0 },
                { id: '50', name: '50%', price: 0 },
                { id: '0', name: '0% (No Sugar)', price: 0 },
            ]
        },
        {
            id: 'ice',
            name: 'Ice',
            min: 0,
            max: 1,
            options: [
                { id: 'normal', name: 'Normal Ice', price: 0 },
                { id: 'less', name: 'Less Ice', price: 0 },
                { id: 'no', name: 'No Ice', price: 0 },
            ]
        }
    ]
};

interface ModifierModalProps {
    isOpen: boolean;
    item: MenuItem | null;
    onClose: () => void;
    onAddToCart: (item: MenuItem, quantity: number, modifiers: any) => void;
}

export function ModifierModal({ isOpen, item, onClose, onAddToCart }: ModifierModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({}); // groupId -> [optionId]
    const [notes, setNotes] = useState('');

    if (!isOpen || !item) return null;

    // Determine modifiers based on category (Simple Mock Logic)
    // Fallback to 'Food' if unmapped, or empty if unrelated
    const categoryName = item.categoryId === 'uncategorized' ? 'Food' : (MOCK_MODIFIERS[item.categoryId!] ? item.categoryId : 'Food');
    // For this demo, let's just map everything to Food or Drinks if name contains certain keywords, else default
    const isDrink = item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('tea') || item.name.toLowerCase().includes('shake') || item.name.toLowerCase().includes('coke');
    const modifierGroups = isDrink ? MOCK_MODIFIERS['Drinks'] : MOCK_MODIFIERS['Food'];

    // Calculate Total Price
    const modifierTotal = modifierGroups.reduce((acc, group) => {
        const selectedIds = selectedModifiers[group.id] || [];
        const groupTotal = selectedIds.reduce((sum, optId) => {
            const opt = group.options.find(o => o.id === optId);
            return sum + (opt?.price || 0);
        }, 0);
        return acc + groupTotal;
    }, 0);

    const basePrice = item.price;
    const finalPrice = (basePrice + modifierTotal) * quantity;

    const toggleOption = (groupId: string, optionId: string, group: ModifierGroup) => {
        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            const isSelected = current.includes(optionId);

            if (isSelected) {
                return { ...prev, [groupId]: current.filter(id => id !== optionId) };
            } else {
                // Check Max limit
                if (group.max === 1) {
                    // Radio button behavior
                    return { ...prev, [groupId]: [optionId] };
                } else {
                    if (current.length >= group.max) return prev; // Max reached
                    return { ...prev, [groupId]: [...current, optionId] };
                }
            }
        });
    };

    const handleAdd = () => {
        // Validation: Check Min requirements
        for (const group of modifierGroups) {
            const current = selectedModifiers[group.id] || [];
            if (current.length < group.min) {
                alert(`Please select at least ${group.min} option(s) for ${group.name}`);
                return;
            }
        }

        // Construct Modifier Object for Cart
        const modifiersPayload = {
            _text: '', // Summary text
            ...selectedModifiers,
            notes
        };

        // Create human readable string
        const validSelections: string[] = [];
        Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
            const group = modifierGroups.find(g => g.id === groupId);
            if (!group) return;
            optionIds.forEach(optId => {
                const opt = group.options.find(o => o.id === optId);
                if (opt) validSelections.push(opt.name);
            });
        });
        if (notes) validSelections.push(`Note: ${notes}`);
        modifiersPayload._text = validSelections.join(', ');

        onAddToCart(item, quantity, modifiersPayload);

        // Reset and close
        setQuantity(1);
        setSelectedModifiers({});
        setNotes('');
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                            <p className="text-gray-500 font-mono">₹{basePrice.toFixed(2)} Base Price</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {modifierGroups.map(group => (
                            <div key={group.id}>
                                <div className="flex justify-between items-baseline mb-3">
                                    <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {group.max === 1 ? 'Select 1' : `Max ${group.max}`}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.options.map(option => {
                                        const isSelected = (selectedModifiers[group.id] || []).includes(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => toggleOption(group.id, option.id, group)}
                                                className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all ${isSelected
                                                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                                                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                                    </div>
                                                    <span className="font-medium">{option.name}</span>
                                                </div>
                                                {option.price > 0 && (
                                                    <span className="text-sm font-mono">+₹{option.price}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Special Notes */}
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 mb-3">Special Instructions</h3>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-rose-500 focus:ring-0 outline-none resize-none h-24 text-gray-700"
                                placeholder="Add specific preferences..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-30"
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={20} />
                                </button>
                                <span className="font-bold text-xl w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-3 hover:bg-gray-100 rounded-lg text-gray-600"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <button
                                onClick={handleAdd}
                                className="flex-1 ml-4 bg-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 flex justify-between px-8"
                            >
                                <span>Add to Order</span>
                                <span>₹{finalPrice.toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

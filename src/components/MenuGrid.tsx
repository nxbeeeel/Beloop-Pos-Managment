'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2 } from 'lucide-react';
import { usePOSStore, MenuItem } from '@/lib/store';
import { CategoryFilter } from './CategoryFilter';

interface MenuGridProps {
    categories: { id: string; name: string }[];
    items: MenuItem[];
    onEditItem: (item: MenuItem) => void;
}

export const MenuGrid = ({ categories, items, onEditItem }: MenuGridProps) => {
    const addToCart = usePOSStore((state) => state.addToCart);
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesCategory =
                activeCategory === 'all' || item.categoryId === activeCategory; // Assuming item has categoryId
            const matchesSearch = item.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [items, activeCategory, searchQuery]);

    return (
        <div className="flex flex-col h-full">
            {/* Search & Filter Header */}
            <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm pt-4 pb-2 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary bg-white text-lg"
                    />
                </div>
                <CategoryFilter
                    categories={[{ id: 'all', name: 'All' }, ...categories]}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            {/* Grid */}
            <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20"
            >
                <AnimatePresence>
                    {filteredItems.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.id}
                            className="group relative bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 text-left overflow-hidden flex flex-col justify-between"
                        >
                            {/* Edit Button (Visible on Hover) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditItem(item);
                                }}
                                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-primary z-10"
                                aria-label="Edit item"
                            >
                                <Edit2 size={16} />
                            </button>

                            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                                {/* Placeholder for Image - In real app use Next/Image */}
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center text-4xl">
                                    🍔
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                                    {item.name}
                                </h3>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-rose-600 font-extrabold text-xl">
                                        ₹{item.price.toFixed(2)}
                                    </p>
                                    <button
                                        onClick={() => addToCart(item, 1)}
                                        className="bg-rose-600 text-white p-2 rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
                                        aria-label={`Add ${item.name} to cart`}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

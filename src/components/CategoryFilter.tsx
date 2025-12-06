'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
}

interface CategoryFilterProps {
    categories: Category[];
    activeCategory: string;
    onSelect: (id: string) => void;
}

export const CategoryFilter = ({
    categories,
    activeCategory,
    onSelect,
}: CategoryFilterProps) => {
    return (
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onSelect(category.id)}
                    className={cn(
                        'relative px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap',
                        activeCategory === category.id
                            ? 'text-white shadow-lg shadow-rose-500/30'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                    )}
                >
                    {activeCategory === category.id && (
                        <motion.div
                            layoutId="activeCategory"
                            className="absolute inset-0 bg-primary rounded-full"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{category.name}</span>
                </button>
            ))}
        </div>
    );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Phone, Star, Plus } from 'lucide-react';
import { usePOSStore } from '@/lib/store';

interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Mock Data
const MOCK_CUSTOMERS = [
    { id: '1', name: 'Rahul Sharma', phone: '9876543210', visits: 12, balance: 0, points: 150 },
    { id: '2', name: 'Priya Patel', phone: '9988776655', visits: 5, balance: 0, points: 50 },
    { id: '3', name: 'Amit Kumar', phone: '9123456780', visits: 1, balance: 0, points: 10 },
];

export const CustomerSearchModal = ({ isOpen, onClose }: CustomerSearchModalProps) => {
    const { registerCustomer, updateCustomerName, loyalty } = usePOSStore();
    // Assuming registerCustomer sets the customer in store immediately for now
    // But store.ts implementation of registerCustomer was checking backend or just setting state
    // Let's use registerCustomer as "Select Customer" for existing ones too if needed, or update store manually if method missing

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<typeof MOCK_CUSTOMERS>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setIsCreating(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim().length > 2) {
            const filtered = MOCK_CUSTOMERS.filter(c =>
                c.phone.includes(query) || c.name.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSelect = (customer: typeof MOCK_CUSTOMERS[0]) => {
        // Use store method to set customer context
        // We might need to expose a direct "setCustomer" method in store or use registerCustomer as a proxy
        // Looking at store.ts, registerCustomer calls set({ loyalty: { customer: ... } })
        registerCustomer(customer.name, customer.phone, { tenantId: '', outletId: '' });
        onClose();
    };

    const handleCreate = () => {
        if (newCustomerName && newCustomerPhone) {
            registerCustomer(newCustomerName, newCustomerPhone, { tenantId: '', outletId: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10">
                        <h2 className="font-bold text-lg text-gray-800">Customer Lookup</h2>
                        <button onClick={onClose} aria-label="Close">
                            <X size={24} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    </div>

                    {!isCreating ? (
                        <>
                            <div className="p-4 bg-white space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search name or phone..."
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={() => { setIsCreating(true); setNewCustomerPhone(query); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-colors"
                                >
                                    <Plus size={18} />
                                    <span>Create New Customer</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {results.length > 0 ? (
                                    results.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 group-hover:text-rose-700">{c.name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Phone size={12} />
                                                        <span>{c.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm font-bold text-amber-500 justify-end">
                                                    <Star size={12} fill="currentColor" />
                                                    <span>{c.points}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{c.visits} visits</p>
                                            </div>
                                        </button>
                                    ))
                                ) : query.length > 2 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No customers found.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Start typing to search...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-6 space-y-4 bg-white flex-1">
                            <div>
                                <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    id="customer-phone"
                                    type="tel"
                                    value={newCustomerPhone}
                                    onChange={e => setNewCustomerPhone(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-rose-500 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input
                                    id="customer-name"
                                    type="text"
                                    value={newCustomerName}
                                    onChange={e => setNewCustomerName(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-rose-500 outline-none"
                                    placeholder="Jane Doe"
                                    autoFocus
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newCustomerName || !newCustomerPhone}
                                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50"
                                >
                                    Save Customer
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

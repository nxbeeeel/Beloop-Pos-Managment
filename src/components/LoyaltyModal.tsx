'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Check, Search, User } from 'lucide-react';
import { usePOSStore } from '@/lib/store';

interface LoyaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    saasContext: { tenantId: string; outletId: string };
}

export const LoyaltyModal = ({ isOpen, onClose, saasContext }: LoyaltyModalProps) => {
    const { loyalty, checkLoyalty, applyReward, clearLoyalty, updateCustomerName } = usePOSStore();
    const [phone, setPhone] = useState('');
    const [tempName, setTempName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await checkLoyalty(phone, saasContext);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-rose-600 to-rose-500 text-white">
                        <div className="flex items-center gap-2">
                            <Gift className="text-white" />
                            <h2 className="text-xl font-bold">Loyalty Program</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors" aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {!loyalty.customer?.name && !loyalty.progress ? (
                            <form onSubmit={handleCheck} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter phone number"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                            autoFocus
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Try 9999999999 for demo</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Checking...' : 'Check Status'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="bg-rose-100 p-3 rounded-full text-rose-600">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        {loyalty.customer?.name ? (
                                            <>
                                                <h3 className="font-bold text-lg text-gray-900">{loyalty.customer.name}</h3>
                                                <p className="text-gray-500 text-sm">{loyalty.customer.phoneNumber}</p>
                                            </>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">New Customer</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Name"
                                                        className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        value={tempName}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (tempName) {
                                                                const { registerCustomer } = usePOSStore.getState();
                                                                registerCustomer(tempName, loyalty.customer?.phoneNumber || phone, saasContext);
                                                            }
                                                        }}
                                                        disabled={!tempName}
                                                        className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reward Section - Visible to ALL identified customers */}
                                {loyalty.progress?.rewardAvailable ? (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center space-y-3">
                                        <div className="flex justify-center text-green-600">
                                            <Gift size={32} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-800">Reward Available!</h4>
                                            <p className="text-green-600 text-sm">
                                                You have enough stamps for a {loyalty.progress.reward?.value || 0}% discount.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                applyReward(!loyalty.rewardApplied);
                                                if (!loyalty.rewardApplied) onClose();
                                            }}
                                            className={`w-full py-2 rounded-lg font-bold transition-colors ${loyalty.rewardApplied
                                                ? 'bg-gray-200 text-gray-600'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                        >
                                            {loyalty.rewardApplied ? 'Reward Applied' : 'Apply Reward'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-2">
                                        <p>Visits: {loyalty.progress?.stamps || 0} / {loyalty.progress?.visitsRequired || 6}</p>
                                        <p className="text-xs mt-1">Keep visiting to earn rewards!</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        clearLoyalty();
                                        setPhone('');
                                        setTempName('');
                                    }}
                                    className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm"
                                >
                                    Check Another Customer
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

"use client";

import { useState } from "react";
import { usePOSStore } from "@/lib/store";
import { CartItem } from "./CartItem";
import { ShoppingBag, Trash2, CreditCard, Gift, X, Percent, Tag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CartContent = () => {
    const {
        cart,
        clearCart,
        activeDiscount,
        applyDiscount,
        removeDiscount,
        loyalty,
        total,
        tenantId,
        outletId
    } = usePOSStore();

    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Calculate totals for display
    const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const finalTotal = total();

    let discountAmount = 0;
    if (activeDiscount) {
        if (activeDiscount.type === 'PERCENTAGE') {
            discountAmount = subtotal * (activeDiscount.value / 100);
        } else if (activeDiscount.type === 'FIXED') {
            discountAmount = activeDiscount.value;
        }
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim() || !tenantId || !outletId) return;
        setIsValidating(true);
        setCouponError(null);
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            const coupon = await POSExtendedService.validateCoupon(
                { tenantId, outletId },
                couponCode,
                subtotal
            );

            applyDiscount(coupon.type as any, Number(coupon.value), coupon.code);
            setCouponCode("");
        } catch (err: any) {
            console.error(err);
            setCouponError(err.message || 'Invalid coupon');
            removeDiscount();
        } finally {
            setIsValidating(false);
        }
    };

    const handleManualDiscount = (val: number) => {
        if (val === 0) {
            removeDiscount();
        } else {
            applyDiscount('PERCENTAGE', val);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full py-16"
                        >
                            <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                                <ShoppingBag size={36} className="text-slate-600" />
                            </div>
                            <p className="font-semibold text-slate-400 text-lg">Cart is empty</p>
                            <p className="text-sm text-slate-500 mt-1">Tap items to add them</p>
                        </motion.div>
                    ) : (
                        cart.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, height: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <CartItem item={item} />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Totals - Only show when cart has items */}
            {cart.length > 0 && (
                <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50">
                    {/* Summary Section */}
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-medium text-slate-300">₹{subtotal.toFixed(2)}</span>
                        </div>

                        {/* Tax Display */}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tax ({usePOSStore.getState().taxRate}%)</span>
                            <span className="font-medium text-slate-300">
                                ₹{((subtotal - discountAmount) * (usePOSStore.getState().taxRate / 100)).toFixed(2)}
                            </span>
                        </div>

                        {/* Discount Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Percent size={14} />
                                    Discount
                                </span>
                                {activeDiscount && (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                        {activeDiscount.code && (
                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase font-bold">
                                                {activeDiscount.code}
                                            </span>
                                        )}
                                        -₹{discountAmount.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Quick Discount Actions */}
                            {!activeDiscount?.code && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        {[0, 5, 10, 20].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => handleManualDiscount(d)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${(!activeDiscount && d === 0) || (activeDiscount?.type === 'PERCENTAGE' && activeDiscount.value === d)
                                                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                                                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-rose-500/50 hover:text-rose-400'
                                                    }`}
                                            >
                                                {d === 0 ? 'None' : `${d}%`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Coupon Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="w-full py-2 pl-9 pr-3 text-xs font-bold rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 placeholder-slate-500 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 outline-none uppercase transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isValidating || !couponCode}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isValidating ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && (
                                        <p className="text-xs text-red-400 font-medium">{couponError}</p>
                                    )}
                                </div>
                            )}

                            {/* Applied Coupon Badge */}
                            {activeDiscount?.code && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <Tag size={14} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-emerald-400 block">Coupon Applied</span>
                                            <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest">{activeDiscount.code}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={removeDiscount}
                                        className="w-8 h-8 bg-emerald-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-emerald-400 hover:text-red-400 transition-all"
                                        aria-label="Remove coupon"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                        {/* Total */}
                        <div className="flex justify-between items-end pt-1">
                            <span className="text-lg font-bold text-slate-300">Total</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                                ₹{finalTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-[1fr,2fr] gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => document.dispatchEvent(new CustomEvent('open-loyalty'))}
                            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Gift size={18} className="text-amber-400" />
                            <span className="hidden sm:inline">Loyalty</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => document.dispatchEvent(new CustomEvent('open-payment'))}
                            disabled={cart.length === 0}
                            className="py-3.5 px-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:from-rose-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            Pay Now
                        </motion.button>
                    </div>

                    {/* Clear Cart Link */}
                    <button
                        onClick={clearCart}
                        className="w-full mt-3 py-2 text-slate-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Trash2 size={14} />
                        Clear Cart
                    </button>
                </div>
            )}
        </div>
    );
};

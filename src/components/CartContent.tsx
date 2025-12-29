"use client";

import { useState } from "react";
import { usePOSStore } from "@/lib/store";
import { CartItem } from "./CartItem";
import { ShoppingBag, Trash2, CreditCard, Gift, X } from "lucide-react";
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

    // Reverse calculate discount amount from total for display
    // Logic: Subtotal - (Discount) - (Loyalty) = Total
    // But Loyalty is applied AFTER discount usually.
    // Store logic: Total = (Subtotal - Discount) - Loyalty
    // So Discount = Subtotal - (Total + Loyalty) ??? 
    // Easier to just recalculate discount amount based on activeDiscount

    let discountAmount = 0;
    if (activeDiscount) {
        if (activeDiscount.type === 'PERCENTAGE') {
            discountAmount = subtotal * (activeDiscount.value / 100);
        } else if (activeDiscount.type === 'FIXED') {
            discountAmount = activeDiscount.value;
        }
    }
    // Cap discount to subtotal
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
            applyDiscount('PERCENTAGE', val); // Manual is always percentage for now
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-gray-900 tracking-tight">Current Order</h2>
                        <p className="text-xs text-gray-500 font-medium">{cart.length} items</p>
                    </div>
                </div>
                {cart.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4"
                        >
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag size={40} className="opacity-20 text-gray-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-600">Your cart is empty</p>
                                <p className="text-sm text-gray-400 mt-1">Add items from the menu to start</p>
                            </div>
                        </motion.div>
                    ) : (
                        cart.map((item) => (
                            <CartItem key={item.id} item={item} />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Totals */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-20 pb-safe">
                <div className="space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {/* Tax Display */}
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Tax ({usePOSStore.getState().taxRate}%)</span>
                        <span className="font-medium text-gray-900">₹{(subtotal - discountAmount) * (usePOSStore.getState().taxRate / 100) > 0 ? ((subtotal - discountAmount) * (usePOSStore.getState().taxRate / 100)).toFixed(2) : '0.00'}</span>
                    </div>

                    {/* Discount Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Discount</span>
                            {activeDiscount && (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                    {activeDiscount.code ? (
                                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">{activeDiscount.code}</span>
                                    ) : (
                                        <span>MANUAL</span>
                                    )}
                                    -₹{discountAmount.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Quick Actions / Coupon Input */}
                        {!activeDiscount?.code ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    {[0, 5, 10, 20].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => handleManualDiscount(d)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${(!activeDiscount && d === 0) || (activeDiscount?.type === 'PERCENTAGE' && activeDiscount.value === d)
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-rose-200 hover:text-rose-600'
                                                }`}
                                        >
                                            {d === 0 ? 'None' : `${d}%`}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border border-gray-200 focus:border-rose-500 outline-none uppercase"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={isValidating || !couponCode}
                                        className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                    >
                                        {isValidating ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                            </div>
                        ) : (
                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-rose-700">COUPON APPLIED</span>
                                    <span className="text-[10px] text-rose-500 uppercase tracking-widest">{activeDiscount.code}</span>
                                </div>
                                <button onClick={removeDiscount} className="text-rose-400 hover:text-rose-600" aria-label="Remove coupon"><X size={16} /></button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-100 my-2" />

                    <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-rose-600 tracking-tight">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr,2fr] gap-3 mb-2 sm:mb-0">
                    <button
                        onClick={() => document.dispatchEvent(new CustomEvent('open-loyalty'))}
                        className="py-3.5 px-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold hover:bg-rose-100 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Gift size={18} />
                        <span className="hidden sm:inline">Loyalty</span>
                    </button>
                    <button
                        onClick={() => document.dispatchEvent(new CustomEvent('open-payment'))}
                        disabled={cart.length === 0}
                        className="py-3.5 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <CreditCard size={18} />
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
};

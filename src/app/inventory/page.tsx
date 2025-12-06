"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { POSExtendedService } from "@/services/pos-extended";
import { ArrowLeft, Search, Plus, Minus, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [adjusting, setAdjusting] = useState<string | null>(null); // SKU being adjusted
    const [adjustQty, setAdjustQty] = useState(0);

    const tenantId = (user?.publicMetadata?.tenantId as string);
    const outletId = (user?.publicMetadata?.outletId as string);

    useEffect(() => {
        if (isLoaded && tenantId && outletId) {
            loadInventory();
        }
    }, [isLoaded, tenantId, outletId]);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await POSExtendedService.getInventory({ tenantId, outletId });
            // Ensure data is an array
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load inventory", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async (sku: string) => {
        if (adjustQty === 0) return;
        try {
            await POSExtendedService.updateStock(
                { tenantId, outletId },
                sku,
                adjustQty,
                "ADJUSTMENT",
                "Manual adjustment from POS"
            );
            setAdjusting(null);
            setAdjustQty(0);
            loadInventory(); // Refresh
        } catch (error) {
            console.error("Failed to adjust stock", error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors" aria-label="Back to Home">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Inventory Management</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            title="Search Products"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-medium text-gray-500">Product</th>
                                <th className="p-4 font-medium text-gray-500">SKU</th>
                                <th className="p-4 font-medium text-gray-500 text-right">Current Stock</th>
                                <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No products found</td></tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 font-medium">{product.name}</td>
                                        <td className="p-4 text-gray-500 text-sm">{product.sku}</td>
                                        <td className="p-4 text-right font-mono">
                                            {product.currentStock} {product.unit}
                                        </td>
                                        <td className="p-4 text-right">
                                            {adjusting === product.sku ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setAdjustQty(q => q - 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200" aria-label="Decrease quantity"><Minus size={14} /></button>
                                                    <input
                                                        type="number"
                                                        className="w-16 text-center border rounded py-1"
                                                        value={adjustQty}
                                                        onChange={e => setAdjustQty(Number(e.target.value))}
                                                        title="Adjustment Quantity"
                                                        placeholder="Qty"
                                                    />
                                                    <button onClick={() => setAdjustQty(q => q + 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200" aria-label="Increase quantity"><Plus size={14} /></button>
                                                    <button onClick={() => handleAdjust(product.sku)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 ml-2" aria-label="Save adjustment"><Save size={14} /></button>
                                                    <button onClick={() => { setAdjusting(null); setAdjustQty(0); }} className="text-xs text-gray-500 hover:text-gray-700 ml-1" aria-label="Cancel adjustment">Cancel</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setAdjusting(product.sku); setAdjustQty(0); }}
                                                    className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Adjust Stock
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

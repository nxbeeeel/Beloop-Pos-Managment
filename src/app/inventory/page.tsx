"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { POSExtendedService } from "@/services/pos-extended";
import { ArrowLeft, Search, Plus, Minus, Save, Loader2, ClipboardCheck, ArrowUpCircle, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function InventoryPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'items' | 'verify' | 'order'>('items');

    // Verification State
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Order State
    const [orderQtys, setOrderQtys] = useState<Record<string, number>>({});

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
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load inventory", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdjust = async (sku: string, qty: number) => {
        try {
            await POSExtendedService.updateStock({ tenantId, outletId }, sku, qty, "ADJUSTMENT", "Quick Adjust");
            toast.success("Stock updated");
            loadInventory();
        } catch (e) { toast.error("Failed to update"); }
    };

    const submitVerification = async () => {
        const items = Object.entries(counts).map(([productId, countedQty]) => ({ productId, countedQty }));
        if (items.length === 0) return;

        try {
            setLoading(true);
            await POSExtendedService.submitStockCount({ tenantId, outletId }, items, "POS Verification");
            toast.success("Stock Verification Submitted!");
            setCounts({});
            loadInventory();
            setActiveTab('items');
        } catch (e) {
            console.error(e);
            toast.error("Submission failed");
            setLoading(false);
        }
    };

    const submitOrder = async () => {
        const items = Object.entries(orderQtys).map(([productId, qty]) => ({ productId, qty })).filter(i => i.qty > 0);
        if (items.length === 0) return;

        try {
            setLoading(true);
            await POSExtendedService.createStockOrder({ tenantId, outletId }, items, "POS Order");
            toast.success("Purchase Order Created!");
            setOrderQtys({});
            setActiveTab('items');
            setLoading(false);
        } catch (e) {
            toast.error("Failed to create PO");
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors shadow-sm" aria-label="Back to Home">
                            <ArrowLeft className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Inventory Manager</h1>
                            <p className="text-sm text-gray-500">Track, Count, and Replenish</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('items')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'items' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Search size={16} /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('verify')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'verify' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ClipboardCheck size={16} /> Verify Stock
                        </button>
                        <button
                            onClick={() => setActiveTab('order')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'order' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ShoppingCart size={16} /> Order Stock
                        </button>
                    </div>
                </div>

                {/* Sub-Header / Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {activeTab === 'verify' && (
                        <div className="flex gap-4 items-center">
                            <span className="text-sm text-gray-500">Unsaved counts: <span className="font-bold text-gray-900">{Object.keys(counts).length}</span></span>
                            <button onClick={submitVerification} disabled={loading || Object.keys(counts).length === 0} className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-lg shadow-rose-200">
                                {loading ? <Loader2 className="animate-spin" /> : 'Submit Verification'}
                            </button>
                        </div>
                    )}
                    {activeTab === 'order' && (
                        <div className="flex gap-4 items-center">
                            <span className="text-sm text-gray-500">Items in PO: <span className="font-bold text-gray-900">{Object.keys(orderQtys).length}</span></span>
                            <button onClick={submitOrder} disabled={loading || Object.keys(orderQtys).length === 0} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200">
                                {loading ? <Loader2 className="animate-spin" /> : 'Create Purchase Order'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-medium text-gray-500">Product</th>
                                <th className="p-4 font-medium text-gray-500 text-right">Current Stock</th>
                                {activeTab === 'items' && <th className="p-4 font-medium text-gray-500 text-right">Actions</th>}
                                {activeTab === 'verify' && <th className="p-4 font-medium text-gray-500 text-center w-48">Actual Count</th>}
                                {activeTab === 'verify' && <th className="p-4 font-medium text-gray-500 text-right w-32">Variance</th>}
                                {activeTab === 'order' && <th className="p-4 font-medium text-gray-500 text-center w-48">Order Qty</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && filteredProducts.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-gray-300" /></td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-500">No products found</td></tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const current = product.currentStock || 0;
                                    const counted = counts[product.id] ?? current; // Default to current if not counted
                                    const variance = (counts[product.id] !== undefined) ? counted - current : 0;
                                    const orderQty = orderQtys[product.id] || 0;

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 group transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900">{product.name}</p>
                                                <p className="text-xs text-gray-500 font-mono tracking-wide">{product.sku}</p>
                                            </td>
                                            <td className="p-4 text-right font-mono text-gray-700 font-medium">
                                                {current} <span className="text-gray-400 text-xs">{product.unit}</span>
                                            </td>

                                            {/* TAB: ITEMS (Quick Actions) */}
                                            {activeTab === 'items' && (
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Simple +/- for quick usage */}
                                                        <button
                                                            className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"
                                                            onClick={() => handleQuickAdjust(product.sku, -1)}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <Link href={`/inventory/history/${product.id}`}> {/* Placeholder link */}
                                                            <button className="text-xs text-blue-600 font-medium hover:underline ml-2">History</button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            )}

                                            {/* TAB: VERIFY STOCK */}
                                            {activeTab === 'verify' && (
                                                <>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
                                                                onClick={() => setCounts(prev => ({ ...prev, [product.id]: (prev[product.id] ?? current) - 1 }))}
                                                            ><Minus size={14} /></button>
                                                            <input
                                                                type="number"
                                                                className={`w-20 text-center font-bold text-lg border-b-2 bg-transparent focus:outline-none ${counts[product.id] !== undefined ? 'border-rose-500 text-rose-600' : 'border-gray-200 text-gray-900'}`}
                                                                value={counts[product.id] ?? current}
                                                                onChange={(e) => setCounts(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                                                            />
                                                            <button
                                                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
                                                                onClick={() => setCounts(prev => ({ ...prev, [product.id]: (prev[product.id] ?? current) + 1 }))}
                                                            ><Plus size={14} /></button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {variance !== 0 ? (
                                                            <span className={`font-bold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {variance > 0 ? '+' : ''}{variance}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}

                                            {/* TAB: ORDER STOCK */}
                                            {activeTab === 'order' && (
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${orderQty > 0 ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200'}`}
                                                            onClick={() => setOrderQtys(prev => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))}
                                                        ><Minus size={14} /></button>
                                                        <input
                                                            type="number"
                                                            className={`w-20 text-center font-bold text-lg border-b-2 bg-transparent focus:outline-none ${orderQty > 0 ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-300'}`}
                                                            value={orderQty}
                                                            onChange={(e) => setOrderQtys(prev => ({ ...prev, [product.id]: Math.max(0, Number(e.target.value)) }))}
                                                        />
                                                        <button
                                                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${orderQty > 0 ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200'}`}
                                                            onClick={() => setOrderQtys(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))}
                                                        ><Plus size={14} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

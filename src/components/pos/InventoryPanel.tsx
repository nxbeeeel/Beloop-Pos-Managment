import { useState, useEffect } from "react";
import { Loader2, Search, AlertTriangle } from "lucide-react";

interface InventoryPanelProps {
    tenantId: string;
    outletId: string;
}

export function InventoryPanel({ tenantId, outletId }: InventoryPanelProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                if (!tenantId || !outletId) {
                    setLoading(false);
                    return;
                }

                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:inventory');
                if (cached) { setProducts(cached as any[]); setLoading(false); }

                if (navigator.onLine) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getInventory({ tenantId, outletId });
                    setProducts(Array.isArray(data) ? data : []); await setIDB('offline:inventory', data);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        load();
    }, [tenantId, outletId]);

    const low = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.reorderLevel || 5));
    const out = products.filter(p => (p.stock || 0) === 0);
    const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

    if (loading && products.length === 0) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Live Inventory</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-gray-600 uppercase tracking-wide">Total Items</p><p className="text-xl font-bold text-blue-600">{products.length}</p></div>
                    <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-600 uppercase tracking-wide">Low Stock</p><p className="text-xl font-bold text-amber-600">{low.length}</p></div>
                    <div className="bg-red-50 rounded-xl p-3"><p className="text-xs text-gray-600 uppercase tracking-wide">Out of Stock</p><p className="text-xl font-bold text-red-600">{out.length}</p></div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search product name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filtered.map(p => {
                    const isLow = (p.stock || 0) > 0 && (p.stock || 0) <= (p.reorderLevel || 5), isOut = (p.stock || 0) === 0;
                    return (
                        <div key={p.id} className={`bg-white rounded-xl p-4 border transition-all ${isOut ? 'border-red-300 bg-red-50' : isLow ? 'border-amber-300 bg-amber-50' : 'border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex justify-between items-start">
                                <div><h3 className="font-semibold text-gray-900">{p.name}</h3><p className="text-sm text-gray-500 font-mono">{p.sku}</p></div>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>{p.stock || 0}</p>
                                    <p className="text-xs text-gray-500">units</p>
                                </div>
                            </div>
                            {(isLow || isOut) && <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${isOut ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle size={14} />{isOut ? 'Out of stock' : 'Low stock warning'}</div>}
                        </div>
                    );
                })}
                {filtered.length === 0 && <div className="text-center py-10 text-gray-400">No items found</div>}
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Loader2, History, Search, Clock } from "lucide-react";
import { usePOSStore } from "@/lib/store";

interface OrdersPanelProps {
    tenantId: string;
    outletId: string;
}

export function OrdersPanel({ tenantId, outletId }: OrdersPanelProps) {
    const { orders } = usePOSStore();
    const [serverOrders, setServerOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                if (!tenantId || !outletId) {
                    setIsLoading(false);
                    return;
                }

                // Load from IDB first
                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:orders_history');
                if (cached) {
                    setServerOrders(cached as any[]);
                    setIsLoading(false);
                }

                // If online, fetch from API
                if (navigator.onLine) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getOrders({ tenantId, outletId });
                    setServerOrders(data);
                    await setIDB('offline:orders_history', data);
                }
            } catch (err) {
                console.error("Failed to load orders:", err);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [tenantId, outletId]);

    const allOrders = [...orders, ...serverOrders]
        .reduce((acc, o) => { if (!acc.find((x: any) => x.id === o.id)) acc.push(o); return acc; }, [] as any[])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const todayOrders = allOrders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const todayTotal = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const filtered = search ? allOrders.filter((o: any) => o.id.includes(search)) : allOrders;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-rose-50 rounded-xl p-3"><p className="text-xs text-gray-600">Today</p><p className="text-xl font-bold text-rose-600">{todayOrders.length}</p></div>
                    <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-gray-600">Revenue</p><p className="text-xl font-bold text-green-600">₹{todayTotal.toFixed(0)}</p></div>
                    <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-gray-600">Avg</p><p className="text-xl font-bold text-blue-600">₹{todayOrders.length ? (todayTotal / todayOrders.length).toFixed(0) : 0}</p></div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading && serverOrders.length === 0 ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" /></div> :
                    filtered.length === 0 ? <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 opacity-30" /><p>No orders found</p></div> :
                        filtered.map((o: any) => (
                            <div key={o.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-rose-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold font-mono text-gray-900">#{o.id.slice(-6).toUpperCase()}</span>
                                    <span className="font-bold text-rose-600">₹{(o.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={14} />{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase font-medium">{o.paymentMethod || 'Unknown'}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${o.status === 'VOIDED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {o.status}
                                    </span>
                                </div>
                            </div>
                        ))}
            </div>
        </div>
    );
}

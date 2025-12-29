import { useState, useEffect } from "react";
import { Loader2, ChefHat, CheckCircle } from "lucide-react";

interface KitchenPanelProps {
    tenantId: string;
    outletId: string;
}

export function KitchenPanel({ tenantId, outletId }: KitchenPanelProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                if (!tenantId || !outletId) {
                    setIsLoading(false);
                    return;
                }

                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:kitchen');
                if (cached) { setOrders(cached as any[]); setIsLoading(false); }

                if (navigator.onLine) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getKitchenOrders({ tenantId, outletId });
                    setOrders(data); await setIDB('offline:kitchen', data);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };

        if (tenantId && outletId) {
            load();
            // Poll for updates every 15s
            const i = setInterval(() => navigator.onLine && load(), 15000);
            return () => clearInterval(i);
        }
    }, [tenantId, outletId]);

    const bump = async (id: string, status: string) => {
        const next = status === 'NEW' ? 'PREPARING' : 'READY';
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === id ? { ...o, kitchenStatus: next } : o));

            const { POSExtendedService } = await import('@/services/pos-extended');
            await POSExtendedService.updateKitchenStatus({ tenantId, outletId }, id, next as any);
            // Refresh
            const data = await POSExtendedService.getKitchenOrders({ tenantId, outletId });
            setOrders(data);
        } catch (err) { console.error(err); }
    };

    const elapsed = (t: string) => Math.floor((Date.now() - new Date(t).getTime()) / 60000);

    if (isLoading && orders.length === 0) return <div className="flex h-full items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><ChefHat className="text-orange-500" />Kitchen Display</h2>
                <div className="flex gap-2">
                    <span className="bg-red-600 px-3 py-1 rounded-full text-sm font-bold">{orders.filter(o => o.kitchenStatus === 'NEW').length} New</span>
                    <span className="bg-green-600 px-3 py-1 rounded-full text-sm font-bold">{orders.filter(o => o.kitchenStatus === 'READY').length} Ready</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {orders.length === 0 ? <div className="text-center py-20 text-gray-500"><ChefHat size={64} className="mx-auto mb-4 opacity-30" /><p>No active orders</p></div> :
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {orders.filter(o => o.kitchenStatus !== 'SERVED').map(o => {
                            const isNew = o.kitchenStatus === 'NEW', isReady = o.kitchenStatus === 'READY';
                            return (
                                <div key={o.id} className={`rounded-xl overflow-hidden shadow-lg transition-all ${isNew ? 'bg-red-600 ring-2 ring-red-400' : isReady ? 'bg-green-700' : 'bg-gray-800'}`}>
                                    <div className="p-3 flex justify-between border-b border-white/10 bg-black/10">
                                        <span className="font-bold text-lg">{o.tableNumber ? `T${o.tableNumber}` : `#${o.id.slice(-4)}`}</span>
                                        <span className="text-sm font-mono opacity-80">{elapsed(o.createdAt)}m</span>
                                    </div>
                                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                                        {(o.items || []).map((i: any, idx: number) => <div key={idx} className="flex items-start text-sm"><span className="text-orange-300 font-bold mr-2 w-6 text-right">{i.quantity}x</span><span className="flex-1">{i.name}</span></div>)}
                                    </div>
                                    {!isReady && <button onClick={() => bump(o.id, o.kitchenStatus)} className={`w-full py-4 font-bold flex items-center justify-center gap-2 transition-colors ${isNew ? 'bg-white text-red-600 hover:bg-gray-100' : 'bg-green-600 hover:bg-green-500'}`}><CheckCircle size={18} />{isNew ? 'Start Preparing' : 'Mark Ready'}</button>}
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        </div>
    );
}

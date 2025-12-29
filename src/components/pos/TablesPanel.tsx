import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TablesPanelProps {
    tenantId: string;
    outletId: string;
}

export function TablesPanel({ tenantId, outletId }: TablesPanelProps) {
    const [tables, setTables] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newNum, setNewNum] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                if (!tenantId || !outletId) {
                    setIsLoading(false);
                    return;
                }

                const { get: getIDB, set: setIDB } = await import('idb-keyval');
                const cached = await getIDB('offline:tables');
                if (cached) { setTables(cached as any[]); setIsLoading(false); }

                if (navigator.onLine) {
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const data = await POSExtendedService.getOpenTables({ tenantId, outletId });
                    setTables(data); await setIDB('offline:tables', data);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        load();
    }, [tenantId, outletId]);

    const openTable = async () => {
        if (!newNum.trim()) return;
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            await POSExtendedService.openTable({ tenantId, outletId }, newNum);
            setNewNum(""); setShowNew(false);
            const data = await POSExtendedService.getOpenTables({ tenantId, outletId });
            setTables(data);
        } catch (err: any) { alert(err.message); }
    };

    const slots = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const getTable = (n: string) => tables.find(t => t.tableNumber === n);

    if (isLoading && tables.length === 0) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4 flex justify-between items-center">
                <div><h2 className="text-xl font-bold text-gray-900">Tables</h2><p className="text-sm text-gray-500">{tables.length} active</p></div>
                <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"><Plus size={20} />Open</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {slots.map(n => {
                        const t = getTable(n);
                        return (
                            <button key={n} onClick={() => !t && (setNewNum(n), setShowNew(true))} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${t ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                <div className={`text-3xl font-bold ${t ? 'text-rose-600' : 'text-gray-300'}`}>{n}</div>
                                {t ? <div className="text-sm font-bold text-gray-900">₹{Number(t.totalAmount || 0).toFixed(0)}</div> : <div className="text-xs text-gray-400">Available</div>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <AnimatePresence>
                {showNew && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4 shadow-2xl">
                            <h3 className="text-xl font-bold">Open Table</h3>
                            <input type="text" placeholder="Table #" value={newNum} onChange={(e) => setNewNum(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500" autoFocus />
                            <div className="flex gap-3">
                                <button onClick={() => setShowNew(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button onClick={openTable} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">Open</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

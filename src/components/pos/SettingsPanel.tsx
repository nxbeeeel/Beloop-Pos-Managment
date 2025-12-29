import { useState, useEffect } from "react";
import { Settings, Wifi, WifiOff, AlertTriangle, Info, Database, RefreshCw, Trash2 } from "lucide-react";
import { usePOSStore } from "@/lib/store";

interface SettingsPanelProps {
    user: any;
}

export function SettingsPanel({ user }: SettingsPanelProps) {
    const {
        products,
        error: storeError,
        fetchMenu,
        taxRate,
        setTaxRate
    } = usePOSStore();

    const [cacheStats, setCacheStats] = useState<{ keys: number; lastSync: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    // Debug Data
    const tenantId = (user?.publicMetadata?.tenantId as string) || "MISSING";
    const outletId = (user?.publicMetadata?.outletId as string) || "MISSING";

    useEffect(() => {
        const load = async () => {
            const { OfflineStore } = await import("@/lib/offline-store");
            setCacheStats(await OfflineStore.getStats());
        };
        load();
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const sync = async () => {
        setIsSyncing(true);
        try {
            const { SyncManager } = await import("@/lib/sync-manager");
            await SyncManager.processQueue();
            await SyncManager.pullLatestData();
            const { OfflineStore } = await import("@/lib/offline-store");
            setCacheStats(await OfflineStore.getStats());
        } catch (err) {
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const clear = async () => {
        if (!confirm("Are you sure you want to clear all offline data? This will require a re-sync.")) return;

        const { OfflineStore } = await import("@/lib/offline-store");
        await OfflineStore.clearAll();
        setCacheStats(await OfflineStore.getStats());
        // Reload to ensure store is fresh
        window.location.reload();
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b p-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings size={24} className="text-gray-500" />Settings
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Debug Info (Temporary) */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-mono">
                    <h3 className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={14} /> System Info
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-rose-600">
                        <div>Tenant: {tenantId.slice(0, 8)}...</div>
                        <div>Outlet: {outletId.slice(0, 8)}...</div>
                        <div>Products: {products.length}</div>
                        <div>Connection: {isOnline ? "Online" : "Offline"}</div>
                    </div>
                    {storeError && <div className="mt-2 text-red-600 font-bold">Error: {storeError}</div>}
                    <button onClick={() => fetchMenu({ tenantId, outletId })} className="mt-2 text-rose-700 underline hover:text-rose-900">
                        Force Retry Data Fetch
                    </button>
                </div>

                {/* Connection Status */}
                <div className={`rounded-xl p-4 border ${isOnline ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                        {isOnline ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-amber-600" />}
                        <div>
                            <h3 className="font-bold text-gray-900">{isOnline ? 'Online' : 'Offline'}</h3>
                            <p className="text-sm text-gray-600">{isOnline ? 'Connected to BEloop Servers' : 'Running in offline mode'}</p>
                        </div>
                    </div>
                </div>

                {/* Account */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h3 className="font-bold mb-3 text-gray-900">Account</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium text-gray-900">{user?.fullName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-xs text-gray-900">{user?.primaryEmailAddress?.emailAddress || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium text-xs capitalize text-gray-900">{user?.publicMetadata?.role as string || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Tax Settings */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                        <Info size={18} className="text-rose-500" /> Tax Configuration
                    </h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-medium">Default Tax Rate (%)</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTaxRate(Math.max(0, taxRate - 1))}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-700 font-bold transition-all shadow-sm"
                            >-</button>
                            <span className="font-mono font-bold w-12 text-center text-lg">{taxRate}%</span>
                            <button
                                onClick={() => setTaxRate(taxRate + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-700 font-bold transition-all shadow-sm"
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                        <Database size={18} className="text-rose-500" />Offline Data
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Cached Items</span>
                            <p className="font-bold text-lg text-gray-900">{cacheStats?.keys || 0}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Last Sync</span>
                            <p className="font-bold text-xs text-gray-900 mt-1">{cacheStats?.lastSync ? new Date(cacheStats.lastSync).toLocaleTimeString() : 'Never'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={sync}
                            disabled={isSyncing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Data'}
                        </button>
                        <button
                            onClick={clear}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors"
                        >
                            <Trash2 size={18} />
                            Clear Cache
                        </button>
                    </div>
                </div>

                {/* Printer Settings (Placeholder) */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 border-dashed opacity-75">
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-gray-400">
                        <Info size={18} /> Printer Setup
                    </h3>
                    <p className="text-xs text-gray-400">Bluetooth/Thermal printer configuration coming soon.</p>
                </div>
            </div>
        </div>
    );
}

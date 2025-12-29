import { RefreshCw } from 'lucide-react';

export const SyncStatus = () => {
    return (
        <div className="flex items-center gap-2 text-xs text-green-600">
            <RefreshCw size={14} />
            <span>Synced</span>
        </div>
    );
};

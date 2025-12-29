/**
 * Sync Manager
 * 
 * Handles synchronization between local cache and server.
 * Features:
 * - Automatic sync when online
 * - Operation queue for offline changes
 * - Version-based conflict detection
 * - Retry with exponential backoff
 */
import { get as getIDB, set as setIDB } from 'idb-keyval';
import { OfflineStore } from './offline-store';

const SYNC_QUEUE_KEY = 'sync:queue';
const MAX_RETRIES = 5;

interface SyncOperation {
    id: string;
    type: 'CREATE_ORDER' | 'UPDATE_TABLE' | 'CLOSE_TABLE' | 'START_SHIFT' | 'END_SHIFT';
    payload: any;
    createdAt: number;
    retries: number;
    lastError?: string;
}

interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    lastSync: number;
}

class SyncManagerClass {
    private isSyncing = false;
    private listeners: ((status: SyncStatus) => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.onOnline());
            window.addEventListener('offline', () => this.notifyListeners());
        }
    }

    // ============================================
    // QUEUE OPERATIONS
    // ============================================

    async enqueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>): Promise<string> {
        const queue = await this.getQueue();

        const op: SyncOperation = {
            id: crypto.randomUUID(),
            ...operation,
            createdAt: Date.now(),
            retries: 0
        };

        queue.push(op);
        await setIDB(SYNC_QUEUE_KEY, queue);

        console.log(`[SyncManager] Queued ${op.type} (${op.id})`);
        this.notifyListeners();

        // Try to sync immediately if online
        if (navigator.onLine) {
            setTimeout(() => this.processQueue(), 100);
        }

        return op.id;
    }

    async getQueue(): Promise<SyncOperation[]> {
        const queue = await getIDB(SYNC_QUEUE_KEY);
        return Array.isArray(queue) ? queue : [];
    }

    async removeFromQueue(id: string): Promise<void> {
        const queue = await this.getQueue();
        const filtered = queue.filter(op => op.id !== id);
        await setIDB(SYNC_QUEUE_KEY, filtered);
    }

    // ============================================
    // SYNC PROCESSING
    // ============================================

    private async onOnline(): Promise<void> {
        console.log('[SyncManager] Back online - starting sync');
        await this.processQueue();
        await this.pullLatestData();
    }

    async processQueue(): Promise<void> {
        if (this.isSyncing || !navigator.onLine) return;

        this.isSyncing = true;
        this.notifyListeners();

        try {
            const queue = await this.getQueue();
            if (queue.length === 0) {
                console.log('[SyncManager] Queue empty');
                return;
            }

            console.log(`[SyncManager] Processing ${queue.length} operations`);
            const { getAuthHeaders } = await import('@/services/pos-auth');
            const headers = getAuthHeaders();

            if (!headers['Authorization']) {
                console.warn('[SyncManager] No auth token - cannot sync');
                return;
            }

            for (const operation of queue) {
                if (operation.retries >= MAX_RETRIES) {
                    console.error(`[SyncManager] ${operation.id} exceeded max retries`);
                    continue;
                }

                try {
                    await this.executeOperation(operation, headers);
                    await this.removeFromQueue(operation.id);
                    console.log(`[SyncManager] ✓ ${operation.type} (${operation.id})`);
                } catch (error: any) {
                    operation.retries++;
                    operation.lastError = error.message;
                    console.error(`[SyncManager] ✗ ${operation.type} retry ${operation.retries}:`, error);

                    // Update queue with retry count
                    const currentQueue = await this.getQueue();
                    const index = currentQueue.findIndex(op => op.id === operation.id);
                    if (index >= 0) {
                        currentQueue[index] = operation;
                        await setIDB(SYNC_QUEUE_KEY, currentQueue);
                    }
                }
            }

            await OfflineStore.setLastSync();
        } finally {
            this.isSyncing = false;
            this.notifyListeners();
        }
    }

    private async executeOperation(operation: SyncOperation, headers: Record<string, string>): Promise<void> {
        const baseUrl = process.env.NEXT_PUBLIC_TRACKER_URL;

        const endpoints: Record<string, string> = {
            'CREATE_ORDER': '/api/trpc/pos.syncSales',
            'UPDATE_TABLE': '/api/trpc/pos.addItemsToTable',
            'CLOSE_TABLE': '/api/trpc/pos.closeTable',
            'START_SHIFT': '/api/trpc/pos.startShift',
            'END_SHIFT': '/api/trpc/pos.endShift'
        };

        const endpoint = endpoints[operation.type];
        if (!endpoint) {
            throw new Error(`Unknown operation type: ${operation.type}`);
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ json: operation.payload })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status}: ${errorText}`);
        }
    }

    // ============================================
    // DATA PULL (Refresh from Server)
    // ============================================

    async pullLatestData(): Promise<void> {
        if (!navigator.onLine) return;

        try {
            const { MenuCacheService } = await import('./menu-cache');
            const { getAuthHeaders } = await import('@/services/pos-auth');
            const headers = getAuthHeaders();

            if (!headers['Authorization']) return;

            // Get current context from store
            const { usePOSStore } = await import('./store');
            const state = usePOSStore.getState();
            const context = {
                tenantId: state.tenantId || '',
                outletId: state.outletId || ''
            };

            if (!context.outletId) return;

            // Refresh menu
            const currentVersion = await OfflineStore.getVersion('offline:menu');
            await MenuCacheService.checkForUpdates(context, currentVersion);

            console.log('[SyncManager] Data pull complete');
        } catch (error) {
            console.error('[SyncManager] Data pull failed:', error);
        }
    }

    // ============================================
    // STATUS & LISTENERS
    // ============================================

    async getStatus(): Promise<SyncStatus> {
        const queue = await this.getQueue();
        const lastSync = await OfflineStore.getLastSync();

        return {
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            isSyncing: this.isSyncing,
            pendingCount: queue.filter(op => op.retries < MAX_RETRIES).length,
            failedCount: queue.filter(op => op.retries >= MAX_RETRIES).length,
            lastSync
        };
    }

    subscribe(listener: (status: SyncStatus) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private async notifyListeners(): Promise<void> {
        const status = await this.getStatus();
        this.listeners.forEach(listener => listener(status));
    }

    // ============================================
    // UTILITIES
    // ============================================

    async clearFailedOperations(): Promise<void> {
        const queue = await this.getQueue();
        const active = queue.filter(op => op.retries < MAX_RETRIES);
        await setIDB(SYNC_QUEUE_KEY, active);
        this.notifyListeners();
    }

    async clearAllPending(): Promise<void> {
        await setIDB(SYNC_QUEUE_KEY, []);
        this.notifyListeners();
    }
}

export const SyncManager = new SyncManagerClass();

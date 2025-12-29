/**
 * Offline Queue Manager
 * Stores orders when offline and syncs when back online
 */
import { get as getIDB, set as setIDB } from 'idb-keyval';

const OFFLINE_QUEUE_KEY = 'pos_offline_queue';

export interface QueuedOrder {
    id: string;
    payload: any;
    context: { tenantId: string; outletId: string };
    createdAt: string;
    retries: number;
    lastError?: string;
}

class OfflineQueueManager {
    private isProcessing = false;

    /**
     * Add an order to the offline queue
     */
    async enqueue(order: any, context: { tenantId: string; outletId: string }): Promise<void> {
        const queue = await this.getQueue();

        const queuedOrder: QueuedOrder = {
            id: order.id || crypto.randomUUID(),
            payload: order,
            context,
            createdAt: new Date().toISOString(),
            retries: 0
        };

        queue.push(queuedOrder);
        await setIDB(OFFLINE_QUEUE_KEY, queue);

        console.log(`[OfflineQueue] Order ${queuedOrder.id} queued. Queue size: ${queue.length}`);

        // Try to process immediately if online
        if (navigator.onLine) {
            this.processQueue();
        }
    }

    /**
     * Get current queue
     */
    async getQueue(): Promise<QueuedOrder[]> {
        const queue = await getIDB(OFFLINE_QUEUE_KEY);
        return Array.isArray(queue) ? queue : [];
    }

    /**
     * Get queue status
     */
    async getStatus(): Promise<{ pending: number; failed: number }> {
        const queue = await this.getQueue();
        return {
            pending: queue.filter(o => o.retries < 3).length,
            failed: queue.filter(o => o.retries >= 3).length
        };
    }

    /**
     * Process all queued orders
     */
    async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        if (!navigator.onLine) {
            console.log('[OfflineQueue] Offline - skipping queue processing');
            return;
        }

        this.isProcessing = true;
        console.log('[OfflineQueue] Processing queue...');

        try {
            const queue = await this.getQueue();
            if (queue.length === 0) {
                console.log('[OfflineQueue] Queue empty');
                return;
            }

            const { SyncService } = await import('@/services/sync');
            const successfulIds: string[] = [];

            for (const order of queue) {
                if (order.retries >= 3) {
                    console.log(`[OfflineQueue] Order ${order.id} exceeded retries, skipping`);
                    continue;
                }

                try {
                    await SyncService.pushMutation('CREATE_ORDER', order.payload, order.context);
                    successfulIds.push(order.id);
                    console.log(`[OfflineQueue] Order ${order.id} synced successfully`);
                } catch (err: any) {
                    order.retries++;
                    order.lastError = err.message || 'Unknown error';
                    console.error(`[OfflineQueue] Order ${order.id} failed (retry ${order.retries}):`, err);
                }
            }

            // Remove successful orders from queue
            const remainingQueue = queue.filter(o => !successfulIds.includes(o.id));
            await setIDB(OFFLINE_QUEUE_KEY, remainingQueue);

            console.log(`[OfflineQueue] Processed. Synced: ${successfulIds.length}, Remaining: ${remainingQueue.length}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Clear failed orders from queue
     */
    async clearFailed(): Promise<void> {
        const queue = await this.getQueue();
        const activeQueue = queue.filter(o => o.retries < 3);
        await setIDB(OFFLINE_QUEUE_KEY, activeQueue);
    }

    /**
     * Start listening for online events
     */
    startAutoSync(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('online', () => {
            console.log('[OfflineQueue] Back online - processing queue');
            this.processQueue();
        });

        // Process queue on startup if online
        if (navigator.onLine) {
            setTimeout(() => this.processQueue(), 2000);
        }
    }
}

export const offlineQueue = new OfflineQueueManager();

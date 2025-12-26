import { usePOSStore } from '@/lib/store';
import { get, set, del, keys } from 'idb-keyval';
import { getPosToken, isTokenExpiringSoon, refreshPosToken, getAuthHeaders } from './pos-auth';

export interface QueuedMutation {
    id: string;
    type: 'CREATE_ORDER' | 'STOCK_MOVE' | 'CLOSE_DAY';
    payload: any;
    createdAt: number;
    retryCount: number;
}

const QUEUE_KEY = 'offline_mutations';

export const SyncService = {
    async queueMutation(type: QueuedMutation['type'], payload: any) {
        const mutation: QueuedMutation = {
            id: crypto.randomUUID(),
            type,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
        };

        const queue = (await get<QueuedMutation[]>(QUEUE_KEY)) || [];
        queue.push(mutation);
        await set(QUEUE_KEY, queue);

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (!navigator.onLine) return;

        // Check if token needs refresh before processing
        if (isTokenExpiringSoon()) {
            await refreshPosToken();
        }

        const queue = (await get<QueuedMutation[]>(QUEUE_KEY)) || [];
        if (queue.length === 0) return;

        const remainingQueue: QueuedMutation[] = [];

        for (const mutation of queue) {
            try {
                await this.sendToBackend(mutation);
            } catch (error) {
                console.error('Sync failed for mutation:', mutation.id, error);
                if (mutation.retryCount < 5) {
                    mutation.retryCount++;
                    remainingQueue.push(mutation);
                }
            }
        }

        await set(QUEUE_KEY, remainingQueue);
    },

    async sendToBackend(mutation: QueuedMutation) {
        const url = `${process.env.NEXT_PUBLIC_TRACKER_URL}/api/trpc/pos.${mutation.type === 'CREATE_ORDER' ? 'syncSales' : mutation.type === 'STOCK_MOVE' ? 'stockMove' : 'closeDay'}`;

        console.log(`[POS SyncService] Sending mutation: ${mutation.type}`, mutation.payload);

        // ✅ SECURITY FIX: Use signed token instead of raw headers
        const headers = getAuthHeaders();

        if (!headers['Authorization']) {
            throw new Error('No POS authentication token - please log in again');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ json: mutation.payload }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[POS SyncService] Failed to sync: ${response.status} ${response.statusText}`, errorText);

            // If unauthorized, token may have expired
            if (response.status === 401) {
                throw new Error('Session expired - please log in again');
            }

            throw new Error(`Failed to sync: ${response.statusText}`);
        }

        let result;
        try {
            result = await response.json();
            console.log(`[POS SyncService] Sync success:`, result);
        } catch (e) {
            console.error(`[POS SyncService] Failed to parse response JSON`, e);
            throw new Error('Invalid JSON response from server');
        }
        return result;
    },

    // Wrapper for immediate push (used by checkout)
    async pushMutation(type: QueuedMutation['type'], payload: any, saasContext: { tenantId: string; outletId: string }) {
        // We still queue it first for safety
        await this.queueMutation(type, payload);
        // queueMutation already calls processQueue if online, so we don't need to do much else.
        // But if we want to wait for the result of *this specific* mutation, we might need a different approach.
        // For now, let's just trust the queue.
        return true;
    },

    async pullProducts(saasContext: { tenantId: string; outletId: string }) {
        const url = `${process.env.NEXT_PUBLIC_TRACKER_URL}/api/trpc/pos.getProducts?input={}`;

        // ✅ SECURITY FIX: Use signed token instead of raw headers
        const headers = getAuthHeaders();

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch products:', errorText);

            if (response.status === 401) {
                throw new Error('Session expired - please log in again');
            }

            throw new Error(`Failed to fetch from ${url}. Status: ${response.status}. Msg: ${errorText}`);
        }
        const json = await response.json();

        // Handle SuperJSON structure
        if (json.result?.data?.json) {
            return json.result.data.json;
        }

        return json.result?.data; // Fallback or standard JSON
    },

    async checkLoyalty(phoneNumber: string, saasContext: { tenantId: string; outletId: string }) {
        // Mock implementation or real one if backend exists
        // For now, let's assume we don't have a dedicated endpoint yet or use a generic one
        return { found: false, customer: null, progress: null };
    },

    // Polling for updates (e.g., menu changes)
    startPolling(intervalMs = 60000) {
        setInterval(async () => {
            if (!navigator.onLine) return;

            try {
                // ✅ SECURITY FIX: Use signed token instead of raw headers
                const headers = getAuthHeaders();
                if (!headers['Authorization']) return;

                const response = await fetch(`${process.env.NEXT_PUBLIC_TRACKER_URL}/api/trpc/pos.checkSync?input=${encodeURIComponent(JSON.stringify({ json: { productsVersion: 0 } }))}`, {
                    headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.result.data.json.hasChanges) {
                        // Trigger menu refresh
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error('Polling failed:', error);
            }
        }, intervalMs);
    }
};

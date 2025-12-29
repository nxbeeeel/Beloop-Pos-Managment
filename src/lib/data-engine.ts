/**
 * Data Engine (Local-First Repository)
 * 
 * The primary data access layer for the POS. 
 * Strategies:
 * 1. Read-Local-First: Always return data from IndexedDB immediately (0ms).
 * 2. Stale-While-Revalidate: Trigger background network fetch to update cache.
 * 3. Silent Fallback: If network fails, suppress errors and serve local data.
 */

import { OfflineStore } from './offline-store';
import { MenuCacheService } from './menu-cache';

export const DataEngine = {

    /**
     * Get Menu (Products + Categories)
     * Returns local data immediately. Triggers background refresh.
     */
    async getMenu(context: { tenantId: string; outletId: string }) {
        // 1. Fast Path: Read from IDB
        const localMenu = await OfflineStore.getMenu();
        const hasData = localMenu && localMenu.products.length > 0;

        // 2. Background Refresh (SWR Pattern)
        // We don't await this unless we have NO data
        const refreshPromise = (async () => {
            try {
                if (!navigator.onLine) return;

                const currentVersion = await OfflineStore.getVersion('offline:menu');
                await MenuCacheService.checkForUpdates(context, currentVersion);
            } catch (err) {
                console.warn('[DataEngine] Background menu refresh failed:', err);
            }
        })();

        // 3. Return Logic
        if (hasData) {
            // If we have data, return it immediately and let refresh happen in background
            return localMenu;
        } else {
            // Critical Miss: We must wait for network (First load scenario)
            await refreshPromise;
            return await OfflineStore.getMenu();
        }
    },

    /**
     * Get Customers
     * Local-First with 1-hour validity check in OfflineStore
     */
    async getCustomers(context: { tenantId: string; outletId: string }) {
        const local = await OfflineStore.getCustomers();

        if (local) {
            // Trigger background update if online to keep fresh
            if (navigator.onLine) {
                this.refreshCustomers(context).catch(console.error);
            }
            return local;
        }

        // If missing, fetch
        return await this.refreshCustomers(context);
    },

    /**
     * Background Fetcher for Customers
     */
    async refreshCustomers(context: { tenantId: string }) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_TRACKER_URL;
            if (!baseUrl) {
                console.error("[DataEngine] Missing NEXT_PUBLIC_TRACKER_URL");
                return null;
            }
            // Needed: Access token
            const { getAuthHeaders } = await import('@/services/pos-auth');
            const headers = getAuthHeaders();

            if (!headers['Authorization']) return null;

            const res = await fetch(`${baseUrl}/api/trpc/pos.getCustomers?batch=1&input={"0":{"json":null}}`, {
                headers
            });

            const envelope = await res.json();
            const customers = envelope[0]?.result?.data?.json; // tRPC format structure

            if (customers) {
                await OfflineStore.setCustomers(customers);
                return customers;
            }
        } catch (err) {
            console.warn('[DataEngine] Customer fetch failed:', err);
            return null;
        }
    },

    /**
     * Get Staff List (For Offline Auth)
     */
    async getStaff(context: { tenantId: string; outletId: string }) {
        // ... (Similar logic to Menu)
        // This will be implemented when we wire up Offline Auth
    }
};

/**
 * Menu Cache Service
 * 
 * Stores menu locally in IndexedDB and only fetches from server when:
 * 1. No local cache exists
 * 2. Server has a newer version
 * 
 * This enables offline-first operation where POS works even without network.
 */
import { get as getIDB, set as setIDB } from 'idb-keyval';

const MENU_CACHE_KEY = 'pos_menu_cache';
const MENU_VERSION_KEY = 'pos_menu_version';
const MENU_TIMESTAMP_KEY = 'pos_menu_timestamp';
const OUTLET_CACHE_KEY = 'pos_outlet_cache';

export interface CachedMenu {
    products: any[];
    categories: any[];
    outlet: any;
    version: number;
    cachedAt: number;
}

export const MenuCacheService = {
    /**
     * Get menu - returns cached first, then checks for updates
     */
    async getMenu(
        saasContext: { tenantId: string; outletId: string },
        forceRefresh: boolean = false
    ): Promise<{ data: CachedMenu; source: 'cache' | 'server' }> {
        // 1. Try to get cached menu first
        const cached = await this.getCachedMenu();

        // 2. If no cache or force refresh, fetch from server
        if (!cached || forceRefresh) {
            console.log('[MenuCache] No cache or force refresh - fetching from server');
            try {
                const serverData = await this.fetchFromServer(saasContext);
                return { data: serverData, source: 'server' };
            } catch (error) {
                // If fetch fails but we have cache, return stale cache
                if (cached) {
                    console.warn('[MenuCache] Server fetch failed, using stale cache');
                    return { data: cached, source: 'cache' };
                }
                throw error;
            }
        }

        // 3. Return cache immediately, check for updates in background
        console.log('[MenuCache] Returning cached menu, checking for updates...');
        this.checkForUpdates(saasContext, cached.version);

        return { data: cached, source: 'cache' };
    },

    /**
     * Get cached menu from IndexedDB
     */
    async getCachedMenu(): Promise<CachedMenu | null> {
        try {
            const cache = await getIDB(MENU_CACHE_KEY);
            if (!cache) return null;

            const parsed = typeof cache === 'string' ? JSON.parse(cache) : cache;
            return parsed as CachedMenu;
        } catch (error) {
            console.error('[MenuCache] Error reading cache:', error);
            return null;
        }
    },

    /**
     * Fetch menu from server and cache it
     */
    async fetchFromServer(saasContext: { tenantId: string; outletId: string }): Promise<CachedMenu> {
        const { SyncService } = await import('@/services/sync');
        const result = await SyncService.pullProducts(saasContext);

        if (!result || !result.data) {
            throw new Error('Failed to fetch menu from server');
        }

        // Extract categories
        const uniqueCategories = Array.from(new Set(
            result.data
                .map((p: any) => p.category ? JSON.stringify({ id: p.category.id, name: p.category.name }) : null)
                .filter(Boolean)
        )).map((s: any) => JSON.parse(s));

        // Calculate max version
        const maxVersion = result.data.reduce((max: number, p: any) => Math.max(max, p.version || 0), 0);

        const cachedMenu: CachedMenu = {
            products: result.data,
            categories: uniqueCategories.sort((a: any, b: any) => a.name.localeCompare(b.name)),
            outlet: result.outlet || null,
            version: maxVersion,
            cachedAt: Date.now()
        };

        // Save to IndexedDB
        await setIDB(MENU_CACHE_KEY, cachedMenu);
        await setIDB(MENU_VERSION_KEY, maxVersion);
        await setIDB(MENU_TIMESTAMP_KEY, Date.now());

        console.log(`[MenuCache] Cached ${result.data.length} products, version ${maxVersion}`);

        return cachedMenu;
    },

    /**
     * Check if server has newer version (background check)
     */
    async checkForUpdates(
        saasContext: { tenantId: string; outletId: string },
        currentVersion: number
    ): Promise<boolean> {
        try {
            // Check if online
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                console.log('[MenuCache] Offline - skipping update check');
                return false;
            }

            const { getAuthHeaders } = await import('@/services/pos-auth');
            const headers = getAuthHeaders();

            if (!headers['Authorization']) {
                console.log('[MenuCache] No auth token - skipping update check');
                return false;
            }

            const url = `${process.env.NEXT_PUBLIC_TRACKER_URL}/api/trpc/pos.checkSync?input=${encodeURIComponent(JSON.stringify({ json: { productsVersion: currentVersion } }))}`;

            const response = await fetch(url, { headers });

            if (response.ok) {
                const data = await response.json();
                const hasChanges = data.result?.data?.json?.hasChanges || data.result?.data?.hasChanges;

                if (hasChanges) {
                    console.log('[MenuCache] Server has updates, refreshing...');
                    await this.fetchFromServer(saasContext);

                    // Dispatch event for UI to refresh
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('menu-updated'));
                    }
                    return true;
                }
            }

            console.log('[MenuCache] Menu is up to date');
            return false;
        } catch (error) {
            console.warn('[MenuCache] Update check failed:', error);
            return false;
        }
    },

    /**
     * Force refresh menu from server
     */
    async refresh(saasContext: { tenantId: string; outletId: string }): Promise<CachedMenu> {
        return this.fetchFromServer(saasContext);
    },

    /**
     * Clear cached menu
     */
    async clearCache(): Promise<void> {
        await setIDB(MENU_CACHE_KEY, null);
        await setIDB(MENU_VERSION_KEY, 0);
        await setIDB(MENU_TIMESTAMP_KEY, 0);
        console.log('[MenuCache] Cache cleared');
    },

    /**
     * Get cache age in minutes
     */
    async getCacheAge(): Promise<number> {
        const timestamp = await getIDB(MENU_TIMESTAMP_KEY);
        if (!timestamp) return Infinity;
        return Math.floor((Date.now() - Number(timestamp)) / 60000);
    }
};

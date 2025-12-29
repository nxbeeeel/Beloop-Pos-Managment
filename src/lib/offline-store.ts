/**
 * Unified Offline Store
 * 
 * Central service for managing all offline data in IndexedDB.
 * Provides a simple API for caching any data type with automatic
 * serialization and expiration handling.
 */
import { get as getIDB, set as setIDB, del as delIDB, keys as keysIDB } from 'idb-keyval';

// Cache key prefixes
const KEYS = {
    MENU: 'offline:menu',
    OUTLET: 'offline:outlet',
    CUSTOMERS: 'offline:customers',
    SETTINGS: 'offline:settings',
    TABLES: 'offline:tables',
    SHIFTS: 'offline:shifts',
    ORDERS: 'offline:orders',
    AUTH: 'offline:auth',
    VERSION: 'offline:version',
    LAST_SYNC: 'offline:last_sync'
} as const;

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
    expiresAt?: number;
    version?: number;
}

export const OfflineStore = {
    // ============================================
    // GENERIC CACHE OPERATIONS
    // ============================================

    async get<T>(key: string): Promise<T | null> {
        try {
            const entry = await getIDB(key) as CacheEntry<T> | null;
            if (!entry) return null;

            // Check expiration
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                console.log(`[OfflineStore] Cache expired for ${key}`);
                await delIDB(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error(`[OfflineStore] Error getting ${key}:`, error);
            return null;
        }
    },

    async set<T>(key: string, data: T, ttlMinutes?: number, version?: number): Promise<void> {
        try {
            const entry: CacheEntry<T> = {
                data,
                cachedAt: Date.now(),
                version,
                expiresAt: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : undefined
            };
            await setIDB(key, entry);
            console.log(`[OfflineStore] Cached ${key}${ttlMinutes ? ` (TTL: ${ttlMinutes}m)` : ''}`);
        } catch (error) {
            console.error(`[OfflineStore] Error setting ${key}:`, error);
        }
    },

    async delete(key: string): Promise<void> {
        try {
            await delIDB(key);
        } catch (error) {
            console.error(`[OfflineStore] Error deleting ${key}:`, error);
        }
    },

    async getVersion(key: string): Promise<number> {
        const entry = await getIDB(key) as CacheEntry<any> | null;
        return entry?.version || 0;
    },

    async getCacheAge(key: string): Promise<number> {
        const entry = await getIDB(key) as CacheEntry<any> | null;
        if (!entry?.cachedAt) return Infinity;
        return Math.floor((Date.now() - entry.cachedAt) / 60000);
    },

    // ============================================
    // MENU CACHE
    // ============================================

    async getMenu(): Promise<{ products: any[]; categories: any[]; outlet: any } | null> {
        return this.get(KEYS.MENU);
    },

    async setMenu(products: any[], categories: any[], outlet: any, version?: number): Promise<void> {
        await this.set(KEYS.MENU, { products, categories, outlet }, undefined, version);
    },

    // ============================================
    // OUTLET SETTINGS
    // ============================================

    async getOutlet(): Promise<any | null> {
        return this.get(KEYS.OUTLET);
    },

    async setOutlet(outlet: any): Promise<void> {
        await this.set(KEYS.OUTLET, outlet, 60 * 24); // 24 hour TTL
    },

    // ============================================
    // CUSTOMERS
    // ============================================

    async getCustomers(): Promise<any[] | null> {
        return this.get(KEYS.CUSTOMERS);
    },

    async setCustomers(customers: any[]): Promise<void> {
        await this.set(KEYS.CUSTOMERS, customers, 60); // 1 hour TTL
    },

    // ============================================
    // TABLES STATE
    // ============================================

    async getTables(): Promise<any[] | null> {
        return this.get(KEYS.TABLES);
    },

    async setTables(tables: any[]): Promise<void> {
        await this.set(KEYS.TABLES, tables, 5); // 5 minute TTL (frequently changing)
    },

    // ============================================
    // SHIFTS
    // ============================================

    async getActiveShift(): Promise<any | null> {
        return this.get(KEYS.SHIFTS);
    },

    async setActiveShift(shift: any): Promise<void> {
        await this.set(KEYS.SHIFTS, shift);
    },

    // ============================================
    // ORDERS (Local History)
    // ============================================

    async getOrders(): Promise<any[]> {
        const orders = await this.get<any[]>(KEYS.ORDERS);
        return orders || [];
    },

    async addOrder(order: any): Promise<void> {
        const orders = await this.getOrders();
        orders.unshift(order);
        // Keep last 500 orders locally
        const trimmed = orders.slice(0, 500);
        await this.set(KEYS.ORDERS, trimmed);
    },

    // ============================================
    // AUTH CACHE
    // ============================================

    async getAuth(): Promise<{ token: string; expiresAt: number } | null> {
        return this.get(KEYS.AUTH);
    },

    async setAuth(token: string, expiresAt: number): Promise<void> {
        await this.set(KEYS.AUTH, { token, expiresAt });
    },

    // ============================================
    // SYNC TRACKING
    // ============================================

    async getLastSync(): Promise<number> {
        const timestamp = await this.get<number>(KEYS.LAST_SYNC);
        return timestamp || 0;
    },

    async setLastSync(): Promise<void> {
        await this.set(KEYS.LAST_SYNC, Date.now());
    },

    // ============================================
    // UTILITIES
    // ============================================

    async clearAll(): Promise<void> {
        try {
            const allKeys = await keysIDB();
            for (const key of allKeys) {
                if (typeof key === 'string' && key.startsWith('offline:')) {
                    await delIDB(key);
                }
            }
            console.log('[OfflineStore] All cache cleared');
        } catch (error) {
            console.error('[OfflineStore] Error clearing cache:', error);
        }
    },

    async getStats(): Promise<{ keys: number; lastSync: string }> {
        const allKeys = await keysIDB();
        const offlineKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('offline:'));
        const lastSync = await this.getLastSync();

        return {
            keys: offlineKeys.length,
            lastSync: lastSync ? new Date(lastSync).toISOString() : 'Never'
        };
    },

    // Check if we have minimum data for offline operation
    async isOfflineReady(): Promise<boolean> {
        const menu = await this.getMenu();
        const outlet = await this.getOutlet();
        return !!(menu?.products?.length && outlet);
    }
};

// Export keys for direct access if needed
export { KEYS as OFFLINE_KEYS };

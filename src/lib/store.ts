import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as getIDB, set as setIDB, del as delIDB } from 'idb-keyval';
import { SyncService } from '@/services/sync';

// --- Types ---
export interface MenuItem {
    id: string;
    name: string;
    price: number;
    sku?: string;
    categoryId?: string;
    options?: any;
}

export interface OrderItem {
    id: string;
    menuItem: MenuItem;
    quantity: number;
    modifiers: any;
    totalPrice: number;
}

export interface MenuOverride {
    price?: number;
    isAvailable?: boolean;
    alias?: string;
}

interface POSState {
    cart: OrderItem[];
    orders: any[];
    products: MenuItem[]; // Master List
    categories: { id: string; name: string }[]; // Dynamic Categories
    overrides: Record<string, MenuOverride>; // Local Overrides
    discount: number;
    tenantId: string | null;
    outletId: string | null;

    // Outlet Details
    outlet: { name: string; address: string; phone: string } | null;

    // Order Details
    orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

    // Loyalty State
    loyalty: {
        customer: { name: string; phoneNumber: string } | null;
        progress: { stamps: number; visitsRequired: number; rewardAvailable: boolean; reward: any } | null;
        rewardApplied: boolean;
    };

    // UI State
    isLoading: boolean;
    error: string | null;

    addToCart: (item: MenuItem, quantity: number, modifiers?: any) => void;
    removeFromCart: (itemId: string) => void;
    setDiscount: (percentage: number) => void;
    setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
    clearCart: () => void;
    checkout: (method: string, tendered: number, saasContext: { tenantId: string; outletId: string }) => Promise<any>;
    total: () => number;
    getDailyTotal: () => { cash: number; card: number; total: number };

    fetchMenu: (saasContext: { tenantId: string; outletId: string }) => Promise<void>;
    setOverride: (productId: string, override: MenuOverride) => void;
    getEffectiveMenu: () => MenuItem[];
    restoreOrder: (orderId: string) => void;

    // Loyalty Actions
    checkLoyalty: (phoneNumber: string, saasContext: { tenantId: string; outletId: string }) => Promise<void>;
    registerCustomer: (name: string, phoneNumber: string, saasContext: { tenantId: string; outletId: string }) => Promise<void>;
    updateCustomerName: (name: string) => void;
    applyReward: (apply: boolean) => void;
    clearLoyalty: () => void;
    setSaaSContext: (tenantId: string, outletId: string) => void;
}

// --- IDB Storage for Zustand ---
const storage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        return (await getIDB(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        await setIDB(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        await delIDB(name);
    },
};

// --- Store Implementation ---
export const usePOSStore = create<POSState>()(
    persist(
        (set, get) => ({
            cart: [],
            orders: [],
            products: [], // Initialize empty
            categories: [], // Initialize empty
            overrides: {},
            discount: 0,
            tenantId: null,
            outletId: null,
            outlet: null,
            orderType: 'DINE_IN',
            loyalty: {
                customer: null,
                progress: null,
                rewardApplied: false
            },
            isLoading: false,
            error: null,

            addToCart: (item, quantity, modifiers = {}) => {
                set((state) => {
                    const existingItemIndex = state.cart.findIndex(
                        (orderItem) => orderItem.menuItem.id === item.id && JSON.stringify(orderItem.modifiers) === JSON.stringify(modifiers)
                    );

                    if (existingItemIndex > -1) {
                        const updatedCart = [...state.cart];
                        const existingItem = updatedCart[existingItemIndex];
                        existingItem.quantity += quantity;
                        existingItem.totalPrice = existingItem.quantity * existingItem.menuItem.price;
                        return { cart: updatedCart };
                    } else {
                        const newItem: OrderItem = {
                            id: Math.random().toString(36).substring(7),
                            menuItem: item,
                            quantity,
                            modifiers,
                            totalPrice: quantity * item.price,
                        };
                        return { cart: [...state.cart, newItem] };
                    }
                });
            },
            removeFromCart: (itemId) => {
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== itemId),
                }));
            },
            setDiscount: (percentage) => set({ discount: percentage }),
            setOrderType: (type) => set({ orderType: type }),
            clearCart: () => set({ cart: [], discount: 0, loyalty: { customer: null, progress: null, rewardApplied: false } }),

            checkout: async (method: string, tendered: number, saasContext: { tenantId: string; outletId: string }) => {
                const state = get();
                if (state.cart.length === 0) return;

                const totalAmount = state.total();

                const orderPayload = {
                    id: Math.random().toString(36).substring(7),
                    items: state.cart.map(item => ({
                        id: item.id,
                        name: item.menuItem.name,
                        quantity: item.quantity,
                        price: item.menuItem.price,
                        totalPrice: item.totalPrice,
                        productId: item.menuItem.id,
                        modifiers: item.modifiers
                    })),
                    total: totalAmount,
                    discount: state.discount,
                    paymentMethod: method,
                    tendered: tendered,
                    createdAt: new Date().toISOString(),
                    status: 'COMPLETED',
                    customerName: state.loyalty.customer?.name,
                    customerPhone: state.loyalty.customer?.phoneNumber,
                    redeemedReward: state.loyalty.rewardApplied
                };

                // 1. Optimistic UI Update: Clear Cart & Add to History
                set((state) => ({
                    cart: [],
                    discount: 0,
                    orders: [orderPayload, ...state.orders],
                    loyalty: { customer: null, progress: null, rewardApplied: false }
                }));

                // 2. Trigger Async Sync
                try {
                    console.log('[POS Store] Checkout Context:', saasContext);
                    // A. Sync the Sale
                    await SyncService.pushMutation('CREATE_ORDER', orderPayload, saasContext);
                    console.log('Order processed and queued for sync:', orderPayload.id);

                    // B. Sync Inventory Deductions (Inventory Hook)
                    // MOVED TO BACKEND: syncSales now handles stock deduction to support recipes
                    // and prevent double counting.

                } catch (err) {
                    console.error('Failed to queue order sync:', err);
                }

                return orderPayload; // Return for Receipt display
            },

            total: () => {
                const state = get();
                const subtotal = state.cart.reduce((acc, item) => acc + item.totalPrice, 0);
                let total = subtotal;

                // 1. Apply Manual Discount
                if (state.discount > 0) {
                    total = total - (total * (state.discount / 100));
                }

                // 2. Apply Loyalty Reward
                if (state.loyalty.rewardApplied && state.loyalty.progress?.reward) {
                    const reward = state.loyalty.progress.reward;
                    if (reward.type === 'PERCENTAGE') {
                        total = total - (total * (Number(reward.value) / 100));
                    } else if (reward.type === 'FLAT') {
                        total = total - Number(reward.value);
                    }
                }

                return Math.max(0, total);
            },

            getDailyTotal: () => {
                const today = new Date().toDateString();
                const todaysOrders = get().orders.filter(o => new Date(o.createdAt).toDateString() === today);

                return {
                    cash: todaysOrders.filter(o => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0),
                    card: todaysOrders.filter(o => o.paymentMethod !== 'CASH').reduce((acc, o) => acc + o.total, 0),
                    total: todaysOrders.reduce((acc, o) => acc + o.total, 0)
                };
            },

            fetchMenu: async (saasContext: { tenantId: string; outletId: string }) => {
                const state = get();

                // 1. Try to load from cache first (instant)
                try {
                    const { MenuCacheService } = await import('@/lib/menu-cache');
                    const cached = await MenuCacheService.getCachedMenu();

                    if (cached && cached.products.length > 0) {
                        // Show cached data immediately
                        const menuItems: MenuItem[] = cached.products.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            price: Number(p.price || 0),
                            sku: p.sku,
                            categoryId: p.categoryId || 'uncategorized',
                        }));

                        set({
                            products: menuItems,
                            categories: cached.categories,
                            outlet: cached.outlet,
                            isLoading: false,
                            error: null
                        });

                        console.log(`[Store] Loaded ${menuItems.length} products from cache`);

                        // Check for updates in background
                        MenuCacheService.checkForUpdates(saasContext, cached.version).then((updated) => {
                            if (updated) {
                                // Reload from updated cache
                                MenuCacheService.getCachedMenu().then((newCache) => {
                                    if (newCache) {
                                        const newItems: MenuItem[] = newCache.products.map((p: any) => ({
                                            id: p.id,
                                            name: p.name,
                                            price: Number(p.price || 0),
                                            sku: p.sku,
                                            categoryId: p.categoryId || 'uncategorized',
                                        }));
                                        set({ products: newItems, categories: newCache.categories });
                                        console.log('[Store] Menu updated from server');
                                    }
                                });
                            }
                        });

                        return; // Done - showed cached data
                    }
                } catch (cacheError) {
                    console.warn('[Store] Cache read failed:', cacheError);
                }

                // 2. No cache - show loading and fetch from server
                set({ isLoading: true, error: null });

                try {
                    const { MenuCacheService } = await import('@/lib/menu-cache');
                    const serverData = await MenuCacheService.fetchFromServer(saasContext);

                    const menuItems: MenuItem[] = serverData.products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: Number(p.price || 0),
                        sku: p.sku,
                        categoryId: p.categoryId || 'uncategorized',
                    }));

                    set({
                        products: menuItems,
                        categories: serverData.categories,
                        outlet: serverData.outlet,
                        isLoading: false,
                        error: null
                    });

                    console.log(`[Store] Loaded ${menuItems.length} products from server`);
                } catch (err) {
                    console.error('[Store] Fetch Menu Error:', err);
                    set({
                        isLoading: false,
                        error: 'Failed to load menu. ' + (err instanceof Error ? err.message : 'Check connection')
                    });
                }
            },

            setOverride: (productId, override) => {
                set((state) => ({
                    overrides: {
                        ...state.overrides,
                        [productId]: { ...state.overrides[productId], ...override }
                    }
                }));
            },

            getEffectiveMenu: () => {
                const state = get();
                return state.products.map(p => {
                    const override = state.overrides[p.id];
                    if (!override) return p;

                    return {
                        ...p,
                        name: override.alias || p.name,
                        price: override.price !== undefined ? override.price : p.price,
                        // Add a flag to indicate it's overridden if needed
                    };
                }).filter(p => {
                    const override = state.overrides[p.id];
                    return override?.isAvailable !== false; // Filter out unavailable items
                });
            },

            restoreOrder: (orderId) => {
                set((state) => {
                    const orderToRestore = state.orders.find((o) => o.id === orderId);
                    if (!orderToRestore) return {};

                    // Remove from history
                    const updatedOrders = state.orders.filter((o) => o.id !== orderId);

                    // Restore to cart
                    return {
                        cart: orderToRestore.items,
                        discount: orderToRestore.discount || 0,
                        orders: updatedOrders
                    };
                });
            },

            checkLoyalty: async (phoneNumber, saasContext) => {
                // Mock for testing
                if (phoneNumber === '9999999999') {
                    set({
                        loyalty: {
                            customer: { name: 'Test Customer', phoneNumber: '9999999999' },
                            progress: { stamps: 5, visitsRequired: 6, rewardAvailable: true, reward: { type: 'PERCENTAGE', value: 10 } },
                            rewardApplied: false
                        }
                    });
                    return;
                }

                const result = await SyncService.checkLoyalty(phoneNumber, saasContext);
                if (result && result.found) {
                    set({
                        loyalty: {
                            customer: result.customer,
                            progress: result.progress,
                            rewardApplied: false
                        }
                    });
                } else {
                    set({
                        loyalty: {
                            customer: { name: '', phoneNumber },
                            progress: { stamps: 0, visitsRequired: 6, rewardAvailable: false, reward: null },
                            rewardApplied: false
                        }
                    });
                }
            },

            registerCustomer: async (name, phoneNumber, saasContext) => {
                try {
                    set({ isLoading: true });
                    // Import dynamically to avoid circular dependency if possible, or just use imported service
                    const { POSExtendedService } = await import('@/services/pos-extended');
                    const customer = await POSExtendedService.createCustomer(saasContext, name, phoneNumber);

                    if (customer) {
                        set({
                            loyalty: {
                                customer: { name: customer.name, phoneNumber: customer.phoneNumber },
                                progress: { stamps: 0, visitsRequired: 6, rewardAvailable: false, reward: null }, // New customer has 0 progress
                                rewardApplied: false
                            },
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error('Failed to register customer:', error);
                    set({ isLoading: false, error: 'Failed to register customer' });
                }
            },

            updateCustomerName: (name) => {
                set((state) => ({
                    loyalty: {
                        ...state.loyalty,
                        customer: state.loyalty.customer ? { ...state.loyalty.customer, name } : null
                    }
                }));
            },

            applyReward: (apply) => {
                set((state) => ({
                    loyalty: { ...state.loyalty, rewardApplied: apply }
                }));
            },

            clearLoyalty: () => {
                set({ loyalty: { customer: null, progress: null, rewardApplied: false } });
            },

            setSaaSContext: (tenantId, outletId) => {
                set({ tenantId, outletId });
            }
        }),
        {
            name: 'pos-storage',
            storage: createJSONStorage(() => storage),
            onRehydrateStorage: () => (state) => {
                // state?.fetchMenu(); // Removed: Called from page.tsx with context
            }
        }
    )
);

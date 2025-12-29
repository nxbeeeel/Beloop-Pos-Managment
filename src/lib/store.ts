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
    currentStock?: number; // Added for Live Inventory
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

    // Refactored Discount Logic
    activeDiscount: {
        type: 'PERCENTAGE' | 'FIXED';
        value: number;
        code?: string;
    } | null;
    discount: number; // Deprecated, but used for type compat (total discount amount)
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

    // Staff State
    activeStaff: { id: string; name: string; role: string } | null;
    setActiveStaff: (staff: { id: string; name: string; role: string } | null) => void;

    // UI State
    isLoading: boolean;
    error: string | null;

    addToCart: (item: MenuItem, quantity: number, modifiers?: any) => void;
    removeFromCart: (itemId: string) => void;

    applyDiscount: (type: 'PERCENTAGE' | 'FIXED', value: number, code?: string) => void;
    removeDiscount: () => void;
    setDiscount: (percentage: number) => void; // Deprecated legacy support

    setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
    clearCart: () => void;
    checkout: (method: string, tendered: number, saasContext: { tenantId: string; outletId: string }, existingOrderId?: string, payments?: any[]) => Promise<any>;
    createPendingOrder: (saasContext: { tenantId: string; outletId: string }) => Promise<string>;
    total: () => number;
    subtotal: () => number;
    taxRate: number;
    setTaxRate: (rate: number) => void;
    tipAmount: number;
    setTipAmount: (amount: number) => void;
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
// --- Store Implementation ---
export const usePOSStore = create<POSState>()(
    persist(
        (set, get) => ({
            cart: [],
            orders: [],
            products: [], // Initialize empty
            categories: [], // Initialize empty
            overrides: {},

            // Refactored Discount State
            activeDiscount: null,
            discount: 0, // Keep for backward compatibility/read-only access to amount

            tenantId: null,
            outletId: null,
            outlet: null,
            orderType: 'DINE_IN',
            taxRate: 5,
            tipAmount: 0,
            setTipAmount: (amount) => set({ tipAmount: amount }),

            setTaxRate: (rate) => set({ taxRate: rate }),

            subtotal: () => {
                const { cart } = get();
                return cart.reduce((sum, item) => sum + item.totalPrice, 0);
            },

            total: () => {
                const { subtotal, discount, taxRate } = get();
                const sub = subtotal();
                const discounted = Math.max(0, sub - discount);
                return discounted + (discounted * (taxRate / 100));
            },

            loyalty: {
                customer: null,
                progress: null,
                rewardApplied: false
            },

            activeStaff: null,
            setActiveStaff: (staff) => set({ activeStaff: staff }),

            isLoading: false,
            error: null,

            addToCart: (item, quantity, modifiers = {}) => {
                const state = get();

                // 🚨 INVENTORY CHECK
                if (item.currentStock !== undefined) {
                    // Calculate total quantity of this product already in cart (across all modifier variants)
                    const existingQty = state.cart
                        .filter(cartItem => cartItem.menuItem.id === item.id)
                        .reduce((acc, cartItem) => acc + cartItem.quantity, 0);

                    if (existingQty + quantity > item.currentStock) {
                        // In a real app we might show a toast, for now alert is fine
                        alert(`Cannot add ${quantity} more. Only ${item.currentStock - existingQty} remaining in stock.`);
                        return; // Block add
                    }
                }

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

            // New Actions
            applyDiscount: (type, value, code) => {
                set({ activeDiscount: { type, value, code } });
            },
            removeDiscount: () => set({ activeDiscount: null }),

            // Deprecated but kept for type safety if needed temporarily
            setDiscount: (percentage) => set({ activeDiscount: { type: 'PERCENTAGE', value: percentage } }),

            setOrderType: (type) => set({ orderType: type }),
            clearCart: () => set({ cart: [], activeDiscount: null, discount: 0, loyalty: { customer: null, progress: null, rewardApplied: false } }),

            createPendingOrder: async (saasContext: { tenantId: string; outletId: string }) => {
                const state = get();
                if (state.cart.length === 0) throw new Error("Cart is empty");

                const totalAmount = state.total();
                const subtotal = state.cart.reduce((acc, item) => acc + item.totalPrice, 0);
                const discountAmount = subtotal - totalAmount;

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
                    discount: discountAmount,
                    discountCode: state.activeDiscount?.code,
                    paymentMethod: 'SPLIT',
                    tendered: 0,
                    createdAt: new Date().toISOString(),
                    status: 'PENDING',
                    customerName: state.loyalty.customer?.name,
                    customerPhone: state.loyalty.customer?.phoneNumber,
                    redeemedReward: state.loyalty.rewardApplied
                };

                set((state) => ({
                    orders: [orderPayload, ...state.orders]
                }));

                try {
                    await SyncService.pushMutation('CREATE_ORDER', orderPayload, saasContext);
                } catch (err) {
                    console.error('Failed to queue pending order sync:', err);
                }

                return orderPayload.id;
            },

            checkout: async (method: string, tendered: number, saasContext: { tenantId: string; outletId: string }, existingOrderId?: string, payments?: any[]) => {
                const state = get();

                // If existing order (e.g. Split Bill flow - legacy or if we revived a parked order), update status
                if (existingOrderId) {
                    const orderIndex = state.orders.findIndex(o => o.id === existingOrderId);
                    if (orderIndex > -1) {
                        const updatedOrders = [...state.orders];
                        updatedOrders[orderIndex] = { ...updatedOrders[orderIndex], status: 'COMPLETED', paymentMethod: method, tendered, payments }; // Store payments
                        set({ orders: updatedOrders, cart: [], activeDiscount: null, discount: 0, tipAmount: 0, loyalty: { customer: null, progress: null, rewardApplied: false } });
                    }
                    return { id: existingOrderId };
                }

                if (state.cart.length === 0) return;

                const totalAmount = state.total();
                const subtotal = state.cart.reduce((acc, item) => acc + item.totalPrice, 0);
                const discountAmount = subtotal - totalAmount;

                const orderPayload = {
                    id: Math.random().toString(36).substring(7),
                    items: state.cart.map(item => ({
                        id: item.id,
                        name: item.menuItem.name,
                        quantity: item.quantity,
                        price: item.menuItem.price,
                        totalPrice: item.totalPrice,
                        productId: item.menuItem.id,
                        modifiers: item.modifiers,
                        category: item.menuItem.categoryId // Added for Kitchen Routing
                    })),
                    total: totalAmount,
                    discount: discountAmount,
                    discountCode: state.activeDiscount?.code,
                    paymentMethod: method,
                    payments: payments, // Added Split Payments
                    tendered: tendered,
                    createdAt: new Date().toISOString(),
                    status: 'COMPLETED',
                    customerName: state.loyalty.customer?.name,
                    customerPhone: state.loyalty.customer?.phoneNumber,
                    redeemedReward: state.loyalty.rewardApplied
                };

                set((state) => ({
                    cart: [],
                    activeDiscount: null,
                    discount: 0,
                    orders: [orderPayload, ...state.orders],
                    loyalty: { customer: null, progress: null, rewardApplied: false }
                }));

                try {
                    console.log('[POS Store] Checkout Context:', saasContext);
                    await SyncService.pushMutation('CREATE_ORDER', orderPayload, saasContext);
                } catch (err) {
                    console.error('Failed to queue order sync:', err);
                }

                return orderPayload;
            },


            // ... (rest of methods)

            // ... (rest of methods)
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
                            currentStock: p.currentStock, // Map stock
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
                                            currentStock: p.currentStock, // Map stock
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
                        currentStock: p.currentStock, // Map stock
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
                        activeDiscount: orderToRestore.discountCode ? { code: orderToRestore.discountCode, type: 'FIXED', value: orderToRestore.discount } : null,
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
            partialize: (state) => ({
                // Persist only long-term state
                cart: state.cart,
                orders: state.orders,
                products: state.products, // Cache products for offline
                categories: state.categories,
                overrides: state.overrides,
                activeStaff: state.activeStaff,
                tenantId: state.tenantId,
                outletId: state.outletId,
                outlet: state.outlet,
                taxRate: state.taxRate,
                loyalty: state.loyalty
            }),
            onRehydrateStorage: () => (state) => {
                // Reset transient state just in case
                if (state) {
                    state.isLoading = false;
                    state.error = null;
                }
            }
        }
    )
);

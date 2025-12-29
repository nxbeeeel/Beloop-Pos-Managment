import { api } from '@/lib/api';

export const POSExtendedService = {
    // --- Reports ---
    getReportStats: async (context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportStats?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getReportSalesTrend: async (context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportSalesTrend?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getReportTopItems: async (context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportTopItems?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // --- Customers ---
    getCustomers: async (context: { tenantId: string; outletId: string }, search?: string) => {
        const input = encodeURIComponent(JSON.stringify({
            search
        }));
        const response = await api.get(`/api/trpc/pos.getCustomers?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getCustomerHistory: async (context: { tenantId: string; outletId: string }, customerId: string) => {
        const input = encodeURIComponent(JSON.stringify({
            customerId
        }));
        const response = await api.get(`/api/trpc/pos.getCustomerHistory?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    createCustomer: async (context: { tenantId: string; outletId: string }, name: string, phoneNumber: string) => {
        const payload = { name, phoneNumber };
        const response = await api.post(`/api/trpc/pos.createCustomer`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // --- Inventory (Using existing stockMove but maybe need product list with stock) ---
    // We already have getProducts in SyncService, but maybe we need a dedicated one for management if different?
    // For now, we can reuse getProducts from SyncService or add a wrapper here.
    getInventory: async (context: { tenantId: string; outletId: string }) => {
        // Re-using the getProducts endpoint which returns current stock
        const response = await api.get(`/api/trpc/pos.getProducts`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        // API returns { data: products[], outlet: ... }
        // We need to return just the products array
        return response.data.result.data.data;
    },

    updateStock: async (context: { tenantId: string; outletId: string }, sku: string, quantity: number, type: 'ADJUSTMENT' | 'PURCHASE' | 'WASTE', notes?: string) => {
        const payload = {
            sku,
            quantity,
            type,
            referenceId: `POS-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        const response = await api.post(`/api/trpc/pos.stockMove`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data; // Fixed type return
    },

    // --- New Features (Orders & Advanced Inventory) ---

    getOrders: async (context: { tenantId: string; outletId: string }, limit = 50, offset = 0) => {
        const input = encodeURIComponent(JSON.stringify({ limit, offset }));
        const response = await api.get(`/api/trpc/pos.getOrders?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    submitStockCount: async (context: { tenantId: string; outletId: string }, items: { productId: string; countedQty: number }[], notes?: string) => {
        const payload = { items, notes };
        const response = await api.post(`/api/trpc/pos.createStockCount`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    createStockOrder: async (context: { tenantId: string; outletId: string }, items: { productId: string; qty: number }[], notes?: string) => {
        const payload = { items, notes };
        const response = await api.post(`/api/trpc/pos.createPurchaseOrder`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    voidOrder: async (context: { tenantId: string; outletId: string }, orderId: string, reason: string) => {
        const payload = { orderId, reason };
        const response = await api.post(`/api/trpc/pos.voidOrder`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getDailyStats: async (context: { tenantId: string; outletId: string }, date: string) => {
        const input = encodeURIComponent(JSON.stringify({ date }));
        const response = await api.get(`/api/trpc/pos.getDailyStats?input=${input}`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    submitDailyClose: async (context: { tenantId: string; outletId: string }, data: any) => {
        const response = await api.post(`/api/trpc/pos.submitDailyClose`, data, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: TABLE MANAGEMENT
    // ============================================

    openTable: async (context: { tenantId: string; outletId: string }, tableNumber: string, customerName?: string) => {
        const payload = { tableNumber, customerName };
        const response = await api.post(`/api/trpc/pos.openTable`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    addItemsToTable: async (context: { tenantId: string; outletId: string }, orderId: string, items: any[]) => {
        const payload = { orderId, items };
        const response = await api.post(`/api/trpc/pos.addItemsToTable`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getOpenTables: async (context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getOpenTables`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    closeTable: async (context: { tenantId: string; outletId: string }, orderId: string, paymentMethod: string, discount?: number) => {
        const payload = { orderId, paymentMethod, discount };
        const response = await api.post(`/api/trpc/pos.closeTable`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: KITCHEN DISPLAY
    // ============================================

    getKitchenOrders: async (context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getKitchenOrders`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    updateKitchenStatus: async (context: { tenantId: string; outletId: string }, orderId: string, status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => {
        const payload = { orderId, status };
        const response = await api.post(`/api/trpc/pos.updateKitchenStatus`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: SHIFT MANAGEMENT
    // ============================================

    startShift: async (context: { tenantId: string; outletId: string }, openingCash: number) => {
        const payload = { openingCash };
        const response = await api.post(`/api/trpc/pos.startShift`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    endShift: async (context: { tenantId: string; outletId: string }, shiftId: string, closingCash: number, notes?: string) => {
        const payload = { shiftId, closingCash, notes };
        const response = await api.post(`/api/trpc/pos.endShift`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getActiveShift: async (context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getActiveShift`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: HOLD ORDERS
    // ============================================

    holdOrder: async (context: { tenantId: string; outletId: string }, orderId: string, reason?: string) => {
        const payload = { orderId, reason };
        const response = await api.post(`/api/trpc/pos.holdOrder`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    resumeOrder: async (context: { tenantId: string; outletId: string }, orderId: string) => {
        const payload = { orderId };
        const response = await api.post(`/api/trpc/pos.resumeOrder`, payload, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    },

    getHeldOrders: async (context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getHeldOrders`, {
            headers: {
                'x-tenant-id': context.tenantId,
                'x-outlet-id': context.outletId
            }
        });
        return response.data.result.data;
    }
};

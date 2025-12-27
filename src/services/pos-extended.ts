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
    }
};

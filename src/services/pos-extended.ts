import { api } from '@/lib/api';

/**
 * POS Extended Service
 *
 * All methods use the POS Bearer token authentication via the api interceptor.
 * The x-tenant-id and x-outlet-id headers are NO LONGER needed as the signed
 * POS token contains this information.
 */

export const POSExtendedService = {
    // --- Reports ---
    getReportStats: async (_context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportStats?input=${input}`);
        return response.data.result.data;
    },

    getReportSalesTrend: async (_context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportSalesTrend?input=${input}`);
        return response.data.result.data;
    },

    getReportTopItems: async (_context: { tenantId: string; outletId: string }, startDate: Date, endDate: Date) => {
        const input = encodeURIComponent(JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }));
        const response = await api.get(`/api/trpc/pos.getReportTopItems?input=${input}`);
        return response.data.result.data;
    },

    // --- Customers ---
    getCustomers: async (_context: { tenantId: string; outletId: string }, search?: string) => {
        const input = encodeURIComponent(JSON.stringify({ search }));
        const response = await api.get(`/api/trpc/pos.getCustomers?input=${input}`);
        return response.data.result.data;
    },

    getCustomerHistory: async (_context: { tenantId: string; outletId: string }, customerId: string) => {
        const input = encodeURIComponent(JSON.stringify({ customerId }));
        const response = await api.get(`/api/trpc/pos.getCustomerHistory?input=${input}`);
        return response.data.result.data;
    },

    createCustomer: async (_context: { tenantId: string; outletId: string }, name: string, phoneNumber: string) => {
        const payload = { name, phoneNumber };
        const response = await api.post(`/api/trpc/pos.createCustomer`, payload);
        return response.data.result.data;
    },

    // --- Inventory ---
    getInventory: async (_context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getProducts`);
        return response.data.result.data.data;
    },

    updateStock: async (_context: { tenantId: string; outletId: string }, sku: string, quantity: number, type: 'ADJUSTMENT' | 'PURCHASE' | 'WASTE', notes?: string) => {
        const payload = {
            sku,
            quantity,
            type,
            referenceId: `POS-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        const response = await api.post(`/api/trpc/pos.stockMove`, payload);
        return response.data;
    },

    // --- Orders ---
    getOrders: async (_context: { tenantId: string; outletId: string }, limit = 50, offset = 0) => {
        const input = encodeURIComponent(JSON.stringify({ limit, offset }));
        const response = await api.get(`/api/trpc/pos.getOrders?input=${input}`);
        return response.data.result.data;
    },

    submitStockCount: async (_context: { tenantId: string; outletId: string }, items: { productId: string; countedQty: number }[], notes?: string) => {
        const payload = { items, notes };
        const response = await api.post(`/api/trpc/pos.createStockCount`, payload);
        return response.data.result.data;
    },

    createStockOrder: async (_context: { tenantId: string; outletId: string }, items: { productId: string; qty: number }[], notes?: string) => {
        const payload = { items, notes };
        const response = await api.post(`/api/trpc/pos.createPurchaseOrder`, payload);
        return response.data.result.data;
    },

    voidOrder: async (_context: { tenantId: string; outletId: string }, orderId: string, reason: string, pin?: string) => {
        const payload = { orderId, reason, pin };
        const response = await api.post(`/api/trpc/pos.voidOrder`, payload);
        return response.data.result.data;
    },

    getDailyStats: async (_context: { tenantId: string; outletId: string }, date: string) => {
        const input = encodeURIComponent(JSON.stringify({ date }));
        const response = await api.get(`/api/trpc/pos.getDailyStats?input=${input}`);
        return response.data.result.data;
    },

    submitDailyClose: async (_context: { tenantId: string; outletId: string }, data: any) => {
        const response = await api.post(`/api/trpc/pos.submitDailyClose`, data);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: TABLE MANAGEMENT
    // ============================================

    openTable: async (_context: { tenantId: string; outletId: string }, tableNumber: string, customerName?: string) => {
        const payload = { tableNumber, customerName };
        const response = await api.post(`/api/trpc/pos.openTable`, payload);
        return response.data.result.data;
    },

    addItemsToTable: async (_context: { tenantId: string; outletId: string }, orderId: string, items: any[]) => {
        const payload = { orderId, items };
        const response = await api.post(`/api/trpc/pos.addItemsToTable`, payload);
        return response.data.result.data;
    },

    getOpenTables: async (_context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getOpenTables`);
        return response.data.result.data;
    },

    closeTable: async (_context: { tenantId: string; outletId: string }, orderId: string, paymentMethod: string, discount?: number) => {
        const payload = { orderId, paymentMethod, discount };
        const response = await api.post(`/api/trpc/pos.closeTable`, payload);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: KITCHEN DISPLAY
    // ============================================

    getKitchenOrders: async (_context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getKitchenOrders`);
        return response.data.result.data;
    },

    updateKitchenStatus: async (_context: { tenantId: string; outletId: string }, orderId: string, status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => {
        const payload = { orderId, status };
        const response = await api.post(`/api/trpc/pos.updateKitchenStatus`, payload);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: SHIFT MANAGEMENT
    // ============================================

    startShift: async (_context: { tenantId: string; outletId: string }, openingCash: number) => {
        const payload = { openingCash };
        const response = await api.post(`/api/trpc/pos.startShift`, payload);
        return response.data.result.data;
    },

    endShift: async (_context: { tenantId: string; outletId: string }, shiftId: string, closingCash: number, notes?: string) => {
        const payload = { shiftId, closingCash, notes };
        const response = await api.post(`/api/trpc/pos.endShift`, payload);
        return response.data.result.data;
    },

    getActiveShift: async (_context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getActiveShift`);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: HOLD ORDERS
    // ============================================

    holdOrder: async (_context: { tenantId: string; outletId: string }, orderId: string, reason?: string) => {
        const payload = { orderId, reason };
        const response = await api.post(`/api/trpc/pos.holdOrder`, payload);
        return response.data.result.data;
    },

    resumeOrder: async (_context: { tenantId: string; outletId: string }, orderId: string) => {
        const payload = { orderId };
        const response = await api.post(`/api/trpc/pos.resumeOrder`, payload);
        return response.data.result.data;
    },

    getHeldOrders: async (_context: { tenantId: string; outletId: string }) => {
        const response = await api.get(`/api/trpc/pos.getHeldOrders`);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: DISCOUNTS
    // ============================================

    validateCoupon: async (_context: { tenantId: string; outletId: string }, code: string, orderTotal: number) => {
        const payload = { code, orderTotal };
        const response = await api.post(`/api/trpc/pos.validateCoupon`, payload);
        return response.data.result.data;
    },

    // ============================================
    // ENTERPRISE: PAYMENTS (Split Bill)
    // ============================================

    addPayment: async (_context: { tenantId: string; outletId: string }, orderId: string, amount: number, method: string, reference?: string) => {
        const payload = { orderId, amount, method, reference };
        const response = await api.post(`/api/trpc/pos.addPayment`, payload);
        return response.data.result.data;
    },

    getOrderPayments: async (_context: { tenantId: string; outletId: string }, orderId: string) => {
        const input = encodeURIComponent(JSON.stringify(orderId));
        const response = await api.get(`/api/trpc/pos.getOrderPayments?input=${input}`);
        return response.data.result.data;
    }
};

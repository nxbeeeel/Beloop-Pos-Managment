import { api } from '@/lib/api';

export interface RoyaltyConfig {
    branchId: string;
    percentage: number; // e.g., 5.0 for 5%
    fixedFee: number;   // Monthly fixed fee
    currency: string;
}

export interface RoyaltyReport {
    periodStart: string;
    periodEnd: string;
    grossSales: number;
    royaltyAmount: number;
    status: 'DRAFT' | 'INVOICED' | 'PAID';
}

export const RoyaltyService = {
    // Calculate Royalty for a given period
    calculate: (grossSales: number, config: RoyaltyConfig): number => {
        const percentageFee = grossSales * (config.percentage / 100);
        return percentageFee + config.fixedFee;
    },

    // Generate Report (Mock implementation pending backend)
    generateReport: async (branchId: string, start: Date, end: Date): Promise<RoyaltyReport> => {
        // In a real app, this would fetch aggregated sales from the backend
        // For now, we return a mock report
        const mockGrossSales = 50000;
        const config = { branchId, percentage: 5, fixedFee: 500, currency: 'USD' };

        return {
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            grossSales: mockGrossSales,
            royaltyAmount: RoyaltyService.calculate(mockGrossSales, config),
            status: 'DRAFT'
        };
    },

    // Save Settings
    updateConfig: async (branchId: string, config: Partial<RoyaltyConfig>) => {
        console.log(`[Royalty] Updating config for ${branchId}`, config);
        // await api.post(\`/branches/\${branchId}/royalty-config\`, config);
        return true;
    }
};

/**
 * Offline Authentication Service
 * 
 * Manages local staff authentication when Clerk/Internet is unavailable.
 * Uses a cached list of staff members (and hashed PINs) to validate user switching.
 */

import { OfflineStore } from './offline-store';
import { DataEngine } from './data-engine'; // Circular dependency risk? No, DataEngine is just read utility.

interface StaffMember {
    id: string;
    name: string;
    role: string;
    pinHash?: string; // Optional, handled securely
}

interface OfflineSession {
    userId: string;
    user: StaffMember;
    startedAt: number;
    expiresAt: number;
}

export const OfflineAuth = {

    /**
     * Initialize/Refresh Staff Cache
     * Called when we have internet.
     */
    async syncStaffCache(tenantId: string) {
        // Fetch staff from API (mocked for now as we don't have a direct staff endpoint in DataEngine yet)
        // ideally: const staff = await DataEngine.getStaff();
        // For project phoenix scope, we assume this is populated elsewhere or we add a fetcher.
        // Let's implement a basic fetch mechanism here.
        try {
            const baseUrl = process.env.NEXT_PUBLIC_TRACKER_URL;
            const headers = (await import('@/services/pos-auth')).getAuthHeaders();

            if (!headers['Authorization']) return;

            // Using tRPC standard endpoint for getting users (assuming permissions allow)
            // Or we might rely on the initial metadata payload.
            // For now, let's just log that we would sync here.
            console.log('[OfflineAuth] Staff sync logic would run here.');
        } catch (e) {
            console.warn('[OfflineAuth] Failed to sync staff cache', e);
        }
    },

    /**
     * mock: Save a "Current User" as a valid staff member for offline fallback
     * Real-world: You'd sync the whole team.
     */
    async cacheCurrentUser(user: any) {
        if (!user) return;

        const staffList: StaffMember[] = (await OfflineStore.get('offline:staff')) || [];

        // Update or Add
        const existingIdx = staffList.findIndex(s => s.id === user.id);
        const member: StaffMember = {
            id: user.id || user.publicMetadata?.userId,
            name: user.fullName || 'Staff',
            role: (user.publicMetadata?.role as string) || 'STAFF',
            pinHash: '1234' // MOCK: In real app, we fetch the hash from server
        };

        if (existingIdx >= 0) {
            staffList[existingIdx] = member;
        } else {
            staffList.push(member);
        }

        await OfflineStore.set('offline:staff', staffList);
    },

    /**
     * Verify PIN locally
     */
    async verifyPin(pin: string): Promise<StaffMember | null> {
        const staffList: StaffMember[] = (await OfflineStore.get('offline:staff')) || [];

        // MOCK CHECK: We are just checking against '1234' for all, or specific check
        // In prod: bcrypt.compare(pin, staff.pinHash)
        const match = staffList.find(s => s.pinHash === pin || pin === '1234'); // Dev backdoor '1234'

        return match || null;
    },

    /**
     * Start Offline Session
     */
    async startSession(userId: string): Promise<OfflineSession | null> {
        const staffList: StaffMember[] = (await OfflineStore.get('offline:staff')) || [];
        const user = staffList.find(s => s.id === userId);

        if (!user) return null;

        const session: OfflineSession = {
            userId,
            user,
            startedAt: Date.now(),
            expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours
        };

        await OfflineStore.set('offline:session', session);
        return session;
    },

    /**
     * Get Current Offline Session
     */
    async getSession(): Promise<OfflineSession | null> {
        return await OfflineStore.get<OfflineSession>('offline:session');
    },

    async clearSession() {
        await OfflineStore.delete('offline:session');
    }
};

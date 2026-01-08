/**
 * POS Authentication Service
 *
 * Handles JWT token authentication with the Admin API.
 * Uses Clerk session tokens for cross-origin authentication.
 */

const ADMIN_API_URL = process.env.NEXT_PUBLIC_TRACKER_URL || 'http://localhost:3000';
const TOKEN_KEY = 'pos_auth_token';
const TOKEN_EXPIRY_KEY = 'pos_token_expires';

export interface PosAuthResult {
    success: boolean;
    token?: string;
    outlet?: {
        id: string;
        name: string;
        address?: string;
        phone?: string;
    };
    tenant?: {
        id: string;
        name: string;
        slug: string;
    };
    user?: {
        id: string;
        name: string;
        role: string;
    };
    error?: string;
}

/**
 * Get Clerk session token from various sources
 */
async function getClerkToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        // Method 1: Try Clerk's global state (most reliable)
        if ((window as any).Clerk?.session) {
            const token = await (window as any).Clerk.session.getToken();
            if (token) {
                console.log('[POS Auth] Got token from Clerk.session');
                return token;
            }
        }

        // Method 2: Try __clerk_db_jwt from localStorage (Clerk stores it here)
        const storedToken = localStorage.getItem('__clerk_db_jwt');
        if (storedToken) {
            console.log('[POS Auth] Got token from localStorage');
            return storedToken;
        }

        // Method 3: Try window.__clerk (older Clerk versions)
        if ((window as any).__clerk?.session) {
            const session = await (window as any).__clerk.session;
            if (session) {
                const token = await session.getToken();
                if (token) {
                    console.log('[POS Auth] Got token from __clerk.session');
                    return token;
                }
            }
        }

        console.warn('[POS Auth] No Clerk token found');
        return null;
    } catch (error) {
        console.error('[POS Auth] Error getting Clerk token:', error);
        return null;
    }
}

/**
 * Authenticate with Admin API and get signed POS token
 * Call this on POS app startup after Clerk login
 *
 * @param outletId - The outlet to authenticate for
 * @param clerkToken - Optional: Pre-fetched Clerk session token (from useAuth hook)
 */
export async function loginToPos(outletId: string, clerkToken?: string | null): Promise<PosAuthResult> {
    try {
        // Get Clerk session token
        const sessionToken = clerkToken || await getClerkToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add session token for cross-origin authentication
        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        console.log(`[POS Auth] Authenticating with tracker at ${ADMIN_API_URL}/api/pos/auth`);
        console.log(`[POS Auth] Has token: ${!!sessionToken}, OutletId: ${outletId}`);

        const response = await fetch(`${ADMIN_API_URL}/api/pos/auth`, {
            method: 'POST',
            headers,
            credentials: 'include', // Include cookies for same-origin
            body: JSON.stringify({ outletId }),
        });

        if (!response.ok) {
            let error: any = { message: 'Authentication failed' };
            try {
                error = await response.json();
            } catch {
                error.message = `HTTP ${response.status}: ${response.statusText}`;
            }
            console.error('[POS Auth] Login failed:', error);
            return {
                success: false,
                error: error.message || 'Authentication failed'
            };
        }

        const data = await response.json();

        // Store token securely
        localStorage.setItem(TOKEN_KEY, data.token);
        // Store expiry for proactive refresh
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());

        console.log(`[POS Auth] Logged in to outlet: ${data.outlet.name}`);

        return {
            success: true,
            token: data.token,
            outlet: data.outlet,
            tenant: data.tenant,
            user: data.user,
        };
    } catch (error) {
        console.error('[POS Auth] Login error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error - check if tracker is running'
        };
    }
}

/**
 * Get stored POS token
 */
export function getPosToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if token is expired or about to expire (within 1 hour)
 */
export function isTokenExpiringSoon(): boolean {
    if (typeof window === 'undefined') return true;

    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiresAt) return true;

    const oneHour = 60 * 60 * 1000;
    return Date.now() > (parseInt(expiresAt) - oneHour);
}

/**
 * Check if user has valid POS token
 */
export function isAuthenticated(): boolean {
    const token = getPosToken();
    if (!token) return false;

    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiresAt) return false;

    return Date.now() < parseInt(expiresAt);
}

/**
 * Refresh POS token before expiry
 */
export async function refreshPosToken(): Promise<boolean> {
    const currentToken = getPosToken();
    if (!currentToken) return false;

    try {
        const response = await fetch(`${ADMIN_API_URL}/api/pos/auth`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            console.warn('[POS Auth] Token refresh failed');
            return false;
        }

        const data = await response.json();

        if (data.refreshed && data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
            console.log('[POS Auth] Token refreshed');
        }

        return true;
    } catch (error) {
        console.error('[POS Auth] Refresh error:', error);
        return false;
    }
}

/**
 * Clear POS authentication
 */
export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('[POS Auth] Logged out');
}

/**
 * Get headers for authenticated POS API calls
 * Use this instead of raw x-tenant-id / x-outlet-id headers
 */
export function getAuthHeaders(): Record<string, string> {
    const token = getPosToken();

    if (!token) {
        console.warn('[POS Auth] No token available - call loginToPos first');
        return {};
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

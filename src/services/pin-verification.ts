/**
 * PIN Verification Service for BEloop POS
 * Connects to backend security router for real PIN validation
 */

import { getPosToken } from './pos-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface PinVerificationResult {
    success: boolean;
    locked?: boolean;
    lockedUntil?: string;
    remainingMinutes?: number;
    remainingAttempts?: number;
    error?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

/**
 * Verify a user's PIN and get their info if valid
 */
export async function verifyStaffPin(pin: string, action: string = 'STAFF_LOGIN'): Promise<PinVerificationResult & { user?: User }> {
    try {
        const token = getPosToken();

        if (!token) {
            return {
                success: false,
                error: 'Not authenticated. Please restart POS.',
            };
        }

        // Call backend security.verifyPin
        const response = await fetch(`${API_URL}/api/trpc/security.verifyPin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                json: {
                    pin,
                    action,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData?.error?.message || 'PIN verification failed',
            };
        }

        const data = await response.json();
        const result = data.result?.data?.json;

        if (!result) {
            return {
                success: false,
                error: 'Invalid response from server',
            };
        }

        // If PIN is valid, fetch user info
        if (result.success) {
            // Get current user info from context
            // In a real implementation, you'd fetch the actual user details
            // For now, we'll get it from the POS token payload
            const userInfo = await getUserFromToken(token);

            return {
                success: true,
                user: userInfo,
            };
        }

        return result;
    } catch (error) {
        console.error('[PIN Verification] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Get user info from POS token
 * This decodes the JWT to get user metadata
 */
async function getUserFromToken(token: string): Promise<User | undefined> {
    try {
        // Decode JWT (basic base64 decode - in production use a proper JWT library)
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));

        return {
            id: decoded.userId || decoded.sub,
            name: decoded.userName || decoded.name || 'Unknown User',
            role: decoded.role || 'STAFF',
        };
    } catch (error) {
        console.error('[getUserFromToken] Error:', error);
        return undefined;
    }
}

/**
 * Check if user has a PIN set
 */
export async function hasPin(): Promise<boolean> {
    try {
        const token = getPosToken();

        if (!token) {
            return false;
        }

        const response = await fetch(`${API_URL}/api/trpc/security.hasPin`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.result?.data?.json?.hasPin || false;
    } catch (error) {
        console.error('[hasPin] Error:', error);
        return false;
    }
}

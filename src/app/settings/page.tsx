'use client';

import { usePOSStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    const { tenantId, outletId, outlet } = usePOSStore();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">System configuration and diagnostics.</p>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Connected Tenant ID</Label>
                                <div className="p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
                                    {tenantId || 'Not Configured'}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Connected Outlet ID</Label>
                                <div className="p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
                                    {outletId || 'Not Configured'}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Outlet Name (From API)</Label>
                                <div className="p-3 bg-gray-100 rounded-md text-sm">
                                    {outlet?.name || 'Loading or Not Connected...'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-xs text-gray-400">
                        <p>Version: 1.0.0</p>
                        <p>Environment: {process.env.NODE_ENV}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

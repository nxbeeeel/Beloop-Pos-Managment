'use client';

import { usePOSStore } from '@/lib/store';

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
                    <div className="border rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold leading-none tracking-tight">System Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Connected Tenant ID</label>
                                <div className="p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
                                    {tenantId || 'Not Configured'}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Connected Outlet ID</label>
                                <div className="p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
                                    {outletId || 'Not Configured'}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Outlet Name (From API)</label>
                                <div className="p-3 bg-gray-100 rounded-md text-sm">
                                    {outlet?.name || 'Loading or Not Connected...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-400">
                        <p>Version: 1.0.0</p>
                        <p>Environment: {process.env.NODE_ENV}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { usePOSStore } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft, Calculator, CheckCircle, AlertOctagon, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function ClosingPage() {
    const { outlet, tenantId, outletId } = usePOSStore();
    const [step, setStep] = useState<'COUNT' | 'REVIEW' | 'SUCCESS'>('COUNT');

    // Cash Denominations
    const [counts, setCounts] = useState<Record<string, number>>({
        '2000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0
    });

    const [onlineTotal, setOnlineTotal] = useState('');
    const [systemStats, setSystemStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const calculateTotalCash = () => {
        return Object.entries(counts).reduce((sum, [denom, count]) => sum + (Number(denom) * count), 0);
    };

    const totalDeclaredCash = calculateTotalCash();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        if (!tenantId || !outletId) return;
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            const data = await POSExtendedService.getDailyStats({ tenantId, outletId }, new Date().toISOString().split('T')[0]);
            setSystemStats(data);
        } catch (e) {
            console.error("Failed to load stats");
        }
    };

    const handleCloseDay = async () => {
        if (!tenantId || !outletId) {
            toast.error("Session missing info. Please logout and login.");
            return;
        }
        setIsLoading(true);
        try {
            const { POSExtendedService } = await import('@/services/pos-extended');
            const success = await POSExtendedService.submitDailyClose({ tenantId, outletId }, {
                date: new Date().toISOString(),
                declaredCash: totalDeclaredCash,
                declaredOnline: Number(onlineTotal) || 0,
                denominations: counts,
                notes: `Closed by Staff at ${new Date().toLocaleTimeString()}`
            });

            if (success) {
                setStep('SUCCESS');
                toast.success("Day closed successfully!");
            } else {
                toast.error("Failed to close day. Try again.");
            }
        } catch (e) {
            toast.error("Error submitting closure.");
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Day Closed!</h1>
                        <p className="text-gray-500">Z-Report has been generated and synced.</p>
                    </div>
                    <Link href="/">
                        <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                            Return to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <button className="p-2 hover:bg-white rounded-full transition-colors" aria-label="Back to Home">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">End of Day Closing (Z-Report)</h1>
                </div>

                {step === 'COUNT' && (
                    <div className="grid gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calculator size={20} className="text-rose-500" />
                                Cash Verification
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(counts).map((denom) => (
                                    <div key={denom} className="flex items-center gap-3">
                                        <div className="w-16 font-mono font-bold text-gray-500 text-right">₹{denom}</div>
                                        <span className="text-gray-300">x</span>
                                        <input
                                            type="number"
                                            className="flex-1 border rounded-lg p-2 font-mono text-center focus:ring-2 focus:ring-rose-500 outline-none"
                                            value={counts[denom] || ''}
                                            onChange={(e) => setCounts({ ...counts, [denom]: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                        <div className="w-20 font-mono font-bold text-gray-900 text-right">
                                            ₹{(Number(denom) * (counts[denom] || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-6 border-t flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Total Cash in Drawer</span>
                                <span className="text-3xl font-bold text-gray-900">₹{totalDeclaredCash.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Other Payments</h2>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 text-gray-600">Card/UPI Total (Optional Verification)</label>
                                <input
                                    type="number"
                                    className="w-48 border rounded-lg p-2 font-mono text-right focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={onlineTotal}
                                    onChange={(e) => setOnlineTotal(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('REVIEW')}
                            className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
                        >
                            Next: Review & Submit
                        </button>
                    </div>
                )}

                {step === 'REVIEW' && systemStats && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 text-center">Closing Summary</h2>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">System Expected</div>
                                    <div className="text-2xl font-bold text-gray-900">₹{systemStats.systemTotal.toLocaleString()}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Declared Count</div>
                                    <div className="text-2xl font-bold text-blue-600">₹{(totalDeclaredCash + Number(onlineTotal)).toLocaleString()}</div>
                                </div>
                                <div className={`p-4 rounded-xl ${(totalDeclaredCash - systemStats.systemCash) < 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                                    }`}>
                                    <div className="text-sm opacity-80 mb-1">Cash Variance</div>
                                    <div className="text-2xl font-bold">
                                        {(totalDeclaredCash - systemStats.systemCash) > 0 ? '+' : ''}
                                        ₹{(totalDeclaredCash - systemStats.systemCash).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                                <div className="flex justify-between">
                                    <span>Total Orders</span>
                                    <span className="font-mono">{systemStats.orderCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>System Cash</span>
                                    <span className="font-mono">₹{systemStats.systemCash.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>System Online</span>
                                    <span className="font-mono">₹{systemStats.systemCard + systemStats.systemUPI}</span>
                                </div>
                            </div>
                        </div>

                        {(totalDeclaredCash - systemStats.systemCash) !== 0 && (
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex gap-3 text-yellow-800">
                                <AlertOctagon className="shrink-0" />
                                <div>
                                    <p className="font-bold">Discrepancy Detected</p>
                                    <p className="text-sm">There is a cash variance of ₹{(totalDeclaredCash - systemStats.systemCash).toLocaleString()}. This will be logged for audit.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('COUNT')}
                                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                            >
                                Back to Count
                            </button>
                            <button
                                onClick={handleCloseDay}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                            >
                                {isLoading ? 'Submitting...' : 'Confirm & Close Day'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

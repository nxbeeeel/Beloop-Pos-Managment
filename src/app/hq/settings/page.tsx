'use client';

import { useState } from 'react';
import { Save, Building2, DollarSign, Percent } from 'lucide-react';

export default function FranchiseSettings() {
    const [royaltyRate, setRoyaltyRate] = useState(5.0);
    const [fixedFee, setFixedFee] = useState(500);

    const handleSave = () => {
        alert('Franchise settings saved successfully!');
        // Call RoyaltyService.updateConfig here
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-900">Franchise Settings</h1>
                <p className="text-slate-500 mt-2">Configure global royalty rules and fees for franchise partners.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Building2 className="text-rose-500" size={20} />
                        Default Royalty Configuration
                    </h2>
                </div>

                <div className="p-8 space-y-8">
                    {/* Percentage Fee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Royalty Percentage</label>
                            <p className="text-xs text-slate-500">Percentage of Gross Sales taken as royalty.</p>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative max-w-xs">
                                <input
                                    type="number"
                                    value={royaltyRate}
                                    onChange={(e) => setRoyaltyRate(parseFloat(e.target.value))}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none font-medium"
                                />
                                <Percent className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Fixed Fee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Monthly Fixed Fee</label>
                            <p className="text-xs text-slate-500">Base fee charged regardless of sales volume.</p>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative max-w-xs">
                                <input
                                    type="number"
                                    value={fixedFee}
                                    onChange={(e) => setFixedFee(parseFloat(e.target.value))}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none font-medium"
                                />
                                <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 active:scale-[0.98]"
                    >
                        <Save size={20} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [config, setConfig] = useState({
        apiUrl: '',
        apiKey: '',
        branchId: '',
    });
    const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

    useEffect(() => {
        // Load from localStorage on mount
        const storedConfig = localStorage.getItem('beloop-config');
        if (storedConfig) {
            setConfig(JSON.parse(storedConfig));
        }
    }, []);

    const handleSave = async () => {
        setStatus('SAVING');
        try {
            // Save to localStorage (Simulating backend config save)
            localStorage.setItem('beloop-config', JSON.stringify(config));

            // Test Connection
            // await api.get('/sync/health'); 

            setStatus('SUCCESS');
        } catch (error) {
            setStatus('ERROR');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Settings</h1>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Beloop API URL
                        </label>
                        <input
                            type="text"
                            value={config.apiUrl}
                            onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                            placeholder="https://api.beloop.io"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                        </label>
                        <input
                            type="password"
                            value={config.apiKey}
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Branch ID
                        </label>
                        <input
                            type="text"
                            value={config.branchId}
                            onChange={(e) => setConfig({ ...config, branchId: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={status === 'SAVING'}
                            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                        >
                            {status === 'SAVING' ? 'Saving...' : 'Save Configuration'}
                        </button>
                        {status === 'SUCCESS' && (
                            <p className="text-green-600 text-center mt-2 font-medium">Saved Successfully!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

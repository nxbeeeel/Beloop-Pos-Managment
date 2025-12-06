'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect back to home after 2 seconds
        const timer = setTimeout(() => {
            router.push('/');
        }, 2000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Setup Complete</h1>
                <p className="text-slate-500">Redirecting you to the POS...</p>
            </div>
        </div>
    );
}

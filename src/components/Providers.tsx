'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, useEffect } from 'react';
import { createIDBPersister } from '@/lib/persister';
import { SyncService } from '@/services/sync';
import { Toaster } from 'sonner';

const persister = createIDBPersister();

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 60 * 24, // 24 hours
                staleTime: 1000 * 60 * 5, // 5 minutes
            },
        },
    }));

    // Sync pending orders when coming back online
    useEffect(() => {
        const handleOnline = () => {
            console.log('[Offline Mode] Back online! Syncing pending orders...');
            SyncService.processQueue();
        };

        window.addEventListener('online', handleOnline);

        // Also attempt to sync on app load
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            SyncService.processQueue();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
            <Toaster />
        </PersistQueryClientProvider>
    );
}


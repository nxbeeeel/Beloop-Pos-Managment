'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-bold">Something went wrong!</h2>
            <p className="text-gray-500">{error.message}</p>
            <button
                className="rounded bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}

'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex h-screen flex-col items-center justify-center gap-4">
                    <h2 className="text-xl font-bold">Global Application Error</h2>
                    <p className="text-gray-500">{error.message}</p>
                    <button
                        className="rounded bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}

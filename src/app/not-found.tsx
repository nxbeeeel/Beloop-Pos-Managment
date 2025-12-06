import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-bold">404 - Page Not Found</h2>
            <p className="text-gray-500">Could not find requested resource</p>
            <Link href="/" className="text-rose-600 hover:underline">
                Return Home
            </Link>
        </div>
    );
}

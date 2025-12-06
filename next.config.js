/** @type {import('next').NextConfig} */
// Force rebuild timestamp: 2025-12-01
const nextConfig = {
    transpilePackages: ['lucide-react'],
    async rewrites() {
        return [
            {
                source: '/api/trpc/:path*',
                destination: 'https://beloop-restaurant-management.vercel.app/api/trpc/:path*',
            },
        ];
    },
};

module.exports = nextConfig;

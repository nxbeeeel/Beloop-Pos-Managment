const nextConfig = {
    transpilePackages: ['lucide-react'],
    output: process.env.VERCEL ? undefined : 'export',
    images: {
        unoptimized: true,
    },

    // Performance Optimizations
    reactStrictMode: true,

    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            'date-fns',
        ],
    },

    // Turbopack configuration (Next.js 16+ default)
    // Turbopack automatically handles code splitting and optimization
    turbopack: {},

    // Rewrites don't work in static export. API calls must use absolute URLs.
    // ensure NEXT_PUBLIC_TRACKER_URL is set in .env.production
};

module.exports = nextConfig;

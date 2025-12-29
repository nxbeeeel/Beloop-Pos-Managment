const nextConfig = {
    transpilePackages: ['lucide-react'],
    output: 'export',
    images: {
        unoptimized: true,
    },
    // Rewrites don't work in static export. API calls must use absolute URLs.
    // ensure NEXT_PUBLIC_TRACKER_URL is set in .env.production
};

module.exports = nextConfig;

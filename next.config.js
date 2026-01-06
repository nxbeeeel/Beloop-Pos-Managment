const nextConfig = {
    transpilePackages: ['lucide-react'],
    output: process.env.VERCEL ? undefined : 'export',
    images: {
        unoptimized: true,
    },

    // Performance Optimizations
    reactStrictMode: true,
    swcMinify: true,

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

    // Webpack optimizations
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Aggressive code splitting for client bundle
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        // React core
                        react: {
                            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            name: 'react-vendor',
                            priority: 10,
                        },
                        // React Query
                        reactQuery: {
                            test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
                            name: 'react-query-vendor',
                            priority: 9,
                        },
                        // Zustand & state management
                        state: {
                            test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
                            name: 'state-vendor',
                            priority: 8,
                        },
                        // UI libraries
                        ui: {
                            test: /[\\/]node_modules[\\/](@radix-ui|class-variance-authority|clsx|tailwind-merge)[\\/]/,
                            name: 'ui-vendor',
                            priority: 7,
                        },
                        // Other vendor code
                        commons: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'commons',
                            minChunks: 2,
                            priority: 5,
                        },
                    },
                },
            };
        }

        return config;
    },

    // Rewrites don't work in static export. API calls must use absolute URLs.
    // ensure NEXT_PUBLIC_TRACKER_URL is set in .env.production
};

module.exports = nextConfig;

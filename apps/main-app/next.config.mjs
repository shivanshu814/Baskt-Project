/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['@monorepo/ui'],
	experimental: {
		serverActions: true,
	},
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'@monorepo/ui': require.resolve('@monorepo/ui'),
		};
		return config;
	},
};

export default nextConfig;

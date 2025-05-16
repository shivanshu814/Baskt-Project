/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['@baskt/ui'],
	experimental: {
		serverActions: true,
	},
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'@baskt/ui': require.resolve('@baskt/ui'),
		};
		return config;
	},
};

export default nextConfig;

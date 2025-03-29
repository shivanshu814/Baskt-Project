/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['@monorepo/ui'],
};

module.exports = nextConfig;

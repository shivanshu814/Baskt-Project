/** @format */

import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['index.tsx'],
	format: ['esm', 'cjs'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ['react'],
	target: 'es2020',
});

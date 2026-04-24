import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: [
		'default/index.ts',
		'v3/index.ts',
		'v3/future.ts',
		'v4/index.ts',
		'v4/future.ts',
	],
	unbundle: true,
	format: ['esm', 'cjs'],
	platform: 'neutral',
	target: 'node16',
	report: false,
	deps: {
		skipNodeModulesBundle: true,
	},
	copy: [
		{ from: '../../LICENSE', to: '.' },
		{ from: '../../README.md', to: '.' },
	],
	outExtensions({ format }) {
		return {
			js: format === 'esm' || format === 'es' ? '.mjs' : '.js',
		};
	},
});

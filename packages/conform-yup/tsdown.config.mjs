import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['index.ts'],
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

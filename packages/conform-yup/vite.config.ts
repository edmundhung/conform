import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig({
	plugins: [dts({ include: ['src'] })],
	build: {
		copyPublicDir: false,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es', 'cjs'],
			fileName: 'index',
		},
		outDir: 'lib',
		rollupOptions: {
			external: Array.from(
				new Set([
					...Object.keys(pkg['dependencies'] ?? {}),
					...Object.keys(pkg['peerDependencies'] ?? {}),
				]),
			),
		},
	},
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupReplace from '@rollup/plugin-replace';

export default defineConfig({
	plugins: [
		rollupReplace({
			preventAssignment: true,
			values: {
				__DEV__: JSON.stringify(true),
				'process.env.NODE_ENV': JSON.stringify('development'),
			},
		}),
		react(),
	],
});

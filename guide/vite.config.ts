import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [cloudflare(), reactRouter()],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
});

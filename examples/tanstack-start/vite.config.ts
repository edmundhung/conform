import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [tanstackStart(), viteReact()],
});

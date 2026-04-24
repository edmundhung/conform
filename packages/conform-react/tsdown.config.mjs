import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsdown';

const useClientEntries = new Set([
	'future/forms.mjs',
	'future/forms.js',
	'future/hooks.mjs',
	'future/hooks.js',
]);

async function prependUseClient(filePath) {
	const content = await fs.readFile(filePath, 'utf8');

	if (content.startsWith("'use client';")) {
		return;
	}

	await fs.writeFile(filePath, `'use client';\n${content}`);
}

export default defineConfig({
	entry: ['index.ts', 'future/index.ts'],
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
	hooks: {
		async 'build:done'({ chunks }) {
			for (const chunk of chunks) {
				if (!useClientEntries.has(chunk.fileName)) {
					continue;
				}

				await prependUseClient(path.join('dist', chunk.fileName));
			}
		},
	},
});

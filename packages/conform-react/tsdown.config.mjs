import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsdown';

const formats = ['esm', 'cjs'];
const useClientEntryBases = ['future/forms', 'future/hooks'];

function outExtensions({ format }) {
	return {
		js: format === 'esm' || format === 'es' ? '.mjs' : '.js',
	};
}

const useClientEntries = new Set(
	formats.flatMap((format) => {
		const { js = '.js' } = outExtensions({ format });

		return useClientEntryBases.map((entry) => `${entry}${js}`);
	}),
);

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
	format: formats,
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
	outExtensions,
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

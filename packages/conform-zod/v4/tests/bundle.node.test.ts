import nodeResolve from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import { expect, test } from 'vitest';

test.each(['v3', 'v4'])(
	'getConstraints does not bundle the Zod runtime (%s)',
	async (version) => {
		const entry = '\0constraint-entry';
		const bundle = await rollup({
			input: entry,
			plugins: [
				{
					name: 'constraint-entry',
					resolveId(id) {
						return id === entry ? entry : null;
					},
					load(id) {
						return id === entry
							? `export { getConstraints } from '@conform-to/zod/${version}/future';`
							: null;
					},
				},
				nodeResolve(),
			],
		});

		try {
			const { output } = await bundle.generate({ format: 'esm' });
			const chunks = output.filter((file) => file.type === 'chunk');
			const entryChunk = chunks.find((chunk) => chunk.isEntry);
			const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules));

			expect(entryChunk?.exports).toContain('getConstraints');
			expect(
				chunks.flatMap((chunk) => [...chunk.imports, ...chunk.dynamicImports]),
			).toEqual([]);
			expect(
				modules.filter((id) => /[/\\]node_modules[/\\]zod[/\\]/.test(id)),
			).toEqual([]);
		} finally {
			await bundle.close();
		}
	},
	10_000,
);

import { fileURLToPath } from 'node:url';
import nodeResolve from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import { expect, test } from 'vitest';

test('getConstraints does not bundle the Zod runtime', async () => {
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
						? "export { getConstraints } from '@conform-to/zod/v4/future';"
						: null;
				},
			},
			nodeResolve(),
		],
	});

	try {
		const { output } = await bundle.generate({ format: 'esm' });
		const chunks = output.filter((file) => file.type === 'chunk');
		const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules));

		expect(chunks).toHaveLength(1);
		expect(chunks.flatMap((chunk) => chunk.imports)).toEqual([]);
		expect(modules).toContain(
			fileURLToPath(new URL('../../dist/v4/constraint.mjs', import.meta.url)),
		);
		expect(modules).not.toContain(
			fileURLToPath(new URL('../../dist/v4/coercion.mjs', import.meta.url)),
		);
		expect(
			modules.filter((id) => /[/\\]node_modules[/\\]zod[/\\]/.test(id)),
		).toEqual([]);
	} finally {
		await bundle.close();
	}
}, 10_000);

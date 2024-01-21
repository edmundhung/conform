import path from 'node:path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage(name) {
	let sourceDir = `packages/${name}`;
	let outputDir = `${sourceDir}`;

	/** @type {import("rollup").RollupOptions} */
	let ESM = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: `${sourceDir}/index.ts`,
		output: {
			dir: outputDir,
			format: 'esm',
			preserveModules: true,
			entryFileNames: '[name].mjs',
		},
		plugins: [
			babel({
				babelHelpers: 'bundled',
				exclude: /node_modules/,
				extensions: ['.ts', '.tsx'],
			}),
			nodeResolve({
				extensions: ['.ts', '.tsx'],
			}),
			copy({
				targets: [
					{ src: `README`, dest: sourceDir },
					{ src: `LICENSE`, dest: sourceDir },
				],
			}),
		],
	};

	/** @type {import("rollup").RollupOptions} */
	let CJS = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: `${sourceDir}/index.ts`,
		output: {
			dir: outputDir,
			format: 'cjs',
			preserveModules: true,
			exports: 'auto',
		},
		plugins: [
			babel({
				babelHelpers: 'bundled',
				exclude: /node_modules/,
				extensions: ['.ts', '.tsx'],
			}),
			nodeResolve({
				extensions: ['.ts', '.tsx'],
			}),
		],
	};

	return [ESM, CJS];
}

export default function rollup() {
	const packages = [
		// Base
		'conform-dom',
		'conform-validitystate',

		// Schema resolver
		'conform-zod',
		'conform-yup',

		// View adapter
		'conform-react',
	];

	return packages.flatMap(configurePackage);
}

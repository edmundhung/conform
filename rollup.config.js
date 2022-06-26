import path from 'node:path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage(name) {
	let sourceDir = `packages/${name}`;
	let outputDir = `${sourceDir}`;

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
			copy({
				targets: [{ src: `LICENSE`, dest: sourceDir }],
			}),
		],
	};

	/** @type {import("rollup").RollupOptions} */
	let ESM = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: `${sourceDir}/index.ts`,
		output: {
			dir: `${outputDir}/module`,
			format: 'esm',
			preserveModules: true,
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

	return [CJS, ESM];
}

export default function rollup() {
	let builds = [
		// Base
		...configurePackage('conform-dom'),

		// Validator integration
		...configurePackage('conform-zod'),

		// View integration
		...configurePackage('conform-react'),
		// ...configurePackage('conform-remix-react'),
	];

	return builds;
}

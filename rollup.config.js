import path from 'path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage(name) {
	let sourceDir = `packages/${name}`;
	let outputDir = `build/${name}`;

	/** @type {import("rollup").RollupOptions} */
	let CJS = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: `${sourceDir}/index.tsx`,
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
				targets: [
					{ src: `LICENSE`, dest: outputDir },
					{ src: `${sourceDir}/package.json`, dest: outputDir },
					{ src: `${sourceDir}/README.md`, dest: outputDir },
				],
			}),
		],
	};

	/** @type {import("rollup").RollupOptions} */
	let ESM = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: `${sourceDir}/index.tsx`,
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
		...configurePackage('react-form-validity'),
		...configurePackage('remix-form-validity'),
	];

	return builds;
}

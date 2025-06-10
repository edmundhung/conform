import path from 'node:path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage() {
	let sourceDir = '.';
	let outputDir = './dist';

	/** @type {import("rollup").RollupOptions} */
	let ESM = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: [`${sourceDir}/index.ts`, `${sourceDir}/future/index.ts`],
		output: {
			dir: outputDir,
			format: 'esm',
			preserveModules: true,
			entryFileNames: '[name].mjs',
		},
		plugins: [
			babel({
				babelrc: false,
				configFile: false,
				presets: [
					[
						'@babel/preset-env',
						{
							targets: {
								node: '16',
								esmodules: true,
							},
						},
					],
					['@babel/preset-react', { runtime: 'automatic' }],
					'@babel/preset-typescript',
				],
				plugins: [],
				babelHelpers: 'bundled',
				exclude: /node_modules/,
				extensions: ['.ts', '.tsx'],
			}),
			nodeResolve({
				extensions: ['.ts', '.tsx'],
			}),
			copy({
				targets: [
					{ src: `../../LICENSE`, dest: sourceDir },
					{ src: `../../README.md`, dest: sourceDir }
				],
			}),
		],
	};

	/** @type {import("rollup").RollupOptions} */
	let CJS = {
		external(id) {
			return !id.startsWith('.') && !path.isAbsolute(id);
		},
		input: [`${sourceDir}/index.ts`, `${sourceDir}/future/index.ts`],
		output: {
			dir: outputDir,
			format: 'cjs',
			preserveModules: true,
			exports: 'auto',
		},
		plugins: [
			babel({
				babelrc: false,
				configFile: false,
				presets: [
					[
						'@babel/preset-env',
						{
							targets: {
								node: '16',
								esmodules: true,
							},
						},
					],
					['@babel/preset-react', { runtime: 'automatic' }],
					'@babel/preset-typescript',
				],
				plugins: [],
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
	return configurePackage();
}

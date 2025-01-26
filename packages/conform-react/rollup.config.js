import path from 'node:path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import preserveDirectives from "rollup-plugin-preserve-directives";

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage() {
	let sourceDir = path.resolve('.', 'src');
	let outputDir = path.resolve('.', 'dist');

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
				targets: [{ src: `../../README`, dest: sourceDir }],
			}),
			preserveDirectives({
				include: ["./src/hooks.ts"],
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
			preserveDirectives({
				include: ["./src/hooks.ts"],
			}),
		],
	};

	return [ESM, CJS];
}

export default function rollup() {
	return configurePackage();
}

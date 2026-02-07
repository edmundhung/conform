import fs from 'node:fs';
import path from 'node:path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

/** @returns {import("rollup").RollupOptions[]} */
function configurePackage() {
	let sourceDir = '.';
	let outputDir = './dist';
	let addDirectivePlugin = {
		name: 'use-client',
		writeBundle() {
			const filesToModify = [
				'future/hooks.mjs',
				'future/hooks.js',
				'future/forms.mjs',
				'future/forms.js'
			];
			
			filesToModify.forEach(file => {
				const filePath = `${outputDir}/${file}`;

				if (fs.existsSync(filePath)) {
					const content = fs.readFileSync(filePath, 'utf8');
					
					// Only add if not already present
					if (!content.startsWith("'use client';")) {
						fs.writeFileSync(filePath, `'use client';\n${content}`);
						// eslint-disable-next-line no-console
						console.log(`✓ Added 'use client' to ${filePath}`);
					}
				}
			});
		}
	};

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
			addDirectivePlugin,
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
			addDirectivePlugin,
		],
	};

	return [ESM, CJS];
}

export default function rollup() {
	return configurePackage();
}

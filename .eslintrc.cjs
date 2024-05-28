/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	ignorePatterns: ['node_modules/', '**.d.ts'],
	extends: ['eslint:recommended'],
	rules: {
		'no-console': 'error',
		'no-mixed-spaces-and-tabs': 'off',
	},
	overrides: [
		{
			files: ['.eslintrc.cjs'],
			env: {
				node: true,
			},
		},
		{
			files: ['**/*.{ts,tsx}'],
			plugins: ['@typescript-eslint', 'import'],
			parser: '@typescript-eslint/parser',
			env: {
				commonjs: true,
				es6: true,
			},
			settings: {
				'import/internal-regex': '^~/',
				'import/resolver': {
					node: {
						extensions: ['.ts', '.tsx'],
					},
					typescript: {
						alwaysTryTypes: true,
						project: [
							'./tsconfig.json',
							'./packages/*/tsconfig.json',
							'./playground/tsconfig.json',
						],
					},
				},
			},
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
				'import/no-unresolved': 'off',
				'@typescript-eslint/ban-types': 'off',
			},
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:import/recommended',
				'plugin:import/typescript',
			],
		},
		{
			files: ['./packages/conform-react/**/*.{js,jsx,ts,tsx}'],
			plugins: ['react', 'jsx-a11y'],
			env: {
				browser: true,
				es6: true,
			},
			extends: [
				'plugin:react/recommended',
				'plugin:react/jsx-runtime',
				'plugin:react-hooks/recommended',
				'plugin:jsx-a11y/recommended',
			],
			settings: {
				react: {
					version: 'detect',
				},
				'import/resolver': {
					typescript: {},
				},
			},
		},
	],
};

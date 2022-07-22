let plugin = require('tailwindcss/plugin');

module.exports = {
	content: ['./app/**/*.tsx', './app/**/*.ts'],
	theme: {
		extend: {},
	},
	plugins: [
		plugin(function ({ addVariant }) {
			addVariant('touched', '&[data-touched="true"]');
		}),
	],
};

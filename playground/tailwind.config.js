let form = require('@tailwindcss/forms');
let plugin = require('tailwindcss/plugin');

module.exports = {
	content: ['./app/**/*.tsx', './app/**/*.ts'],
	theme: {
		extend: {},
	},
	plugins: [
		form,
		plugin(function ({ addVariant }) {
			addVariant('touched', '&[data-conform-touched="true"]');
		}),
	],
};

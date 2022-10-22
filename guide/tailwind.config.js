module.exports = {
	content: ['./app/**/*.tsx', './app/**/*.ts'],
	theme: {
		extend: {
			screens: {
				'3xl': '1600px',
			},
		},
	},
	plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};

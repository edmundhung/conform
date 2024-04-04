import forms from '@tailwindcss/forms';
import { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
	content: ['./app/**/*.{js,jsx,ts,tsx}'],
	plugins: [
		forms,
		plugin(function ({ addVariant }) {
			addVariant('touched', '&[data-conform-touched="true"]');
		}),
	],
} satisfies Config;

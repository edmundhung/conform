import type { Config } from 'tailwindcss';
import form from '@tailwindcss/forms';

export default {
	content: ['./app/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [form],
} satisfies Config;

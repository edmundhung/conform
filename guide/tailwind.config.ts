import type { Config } from 'tailwindcss';
import typeography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

export default {
	content: ['./app/**/*.{js,jsx,ts,tsx}'],
	plugins: [typeography, forms],
} satisfies Config;

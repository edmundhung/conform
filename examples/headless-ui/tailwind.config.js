import tailwindCssForms from '@tailwindcss/forms';
import headlessui from '@headlessui/tailwindcss';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [tailwindCssForms, headlessui],
};

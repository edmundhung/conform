export const styles = {
	fieldset: 'bg-white border drop-shadow rounded-lg p-8 m-4',
	label: 'text-sm font-medium text-slate-700',
	input: `
        peer mt-1 block w-full px-3 py-2 bg-white border
        border-slate-300 rounded-md text-sm shadow-sm 
        focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
        touched:invalid:border-pink-500 touched:invalid:text-pink-600
        touched:focus:invalid:border-pink-500 touched:focus:invalid:ring-pink-500
    `,
	errorMessage: 'my-2 text-pink-600 text-sm peer-valid:invisible',
};

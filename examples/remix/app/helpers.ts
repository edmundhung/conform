export const styles = {
	header: 'p-8',
	result: 'border-l-4 border-emerald-500 pl-4 py-2 mt-4',
	block: 'block',
	card: 'bg-white border drop-shadow rounded-lg p-8 space-y-4',
	list: 'space-y-4',
	label: 'text-sm font-medium text-slate-700',
	row: 'flex items-end gap-4',
	rowContent: 'flex-1',
	input: `
        peer mt-1 block w-full px-3 py-2 bg-white border
        border-slate-300 rounded-md text-sm shadow-sm 
        focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
    `,
	invalidInput: `
        peer mt-1 block w-full px-3 py-2 bg-white border
        border-slate-300 rounded-md text-sm shadow-sm 
        focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
        invalid:border-pink-500 invalid:text-pink-600
        focus:invalid:border-pink-500 focus:invalid:ring-pink-500
    `,
	optionLabel: `
        flex flex-row-reverse
    `,
	option: `
        flex-1 capitalize text-sm
    `,
	invalidOption: `
        flex-1 capitalize text-sm peer-invalid:text-pink-600
    `,
	optionInput: `
        peer
    `,
	buttonPrimary: `
        mt-4 relative w-full flex justify-center py-2 px-4 border border-transparent text-sm
        font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
    `,
	buttonSecondary: `
        relative flex justify-center py-2 px-4 border border-transparent text-sm
        font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500
        disabled:opacity-50 disabled:hover:bg-slate-600
    `,
	buttonWarning: `
        h-9 w-9 relative flex justify-center items-center border border-transparent text-sm
        font-medium rounded-md text-white bg-red-600 hover:bg-red-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        disabled:opacity-50 disabled:hover:bg-red-600
    `,
	errorMessage: 'my-2 text-pink-600 text-sm peer-valid:invisible',
};

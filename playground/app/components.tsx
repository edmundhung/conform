import type { FormResult } from '@conform-to/dom';
import type { FieldsetHTMLAttributes, ReactElement } from 'react';

interface FieldProps {
	label: string;
	error?: string;
	children: ReactElement;
}

export function Field({ label, error, children }: FieldProps) {
	return (
		<label className="block">
			<div className="block text-sm font-medium text-gray-700">{label}</div>
			{children}
			<p className="mt-1 text-pink-600 text-sm peer-valid:invisible">{error}</p>
		</label>
	);
}

interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
	title: string;
	description?: string;
	result?: FormResult<T>;
}

export function Fieldset({
	title,
	description,
	result,
	...props
}: FieldsetProps) {
	return (
		<>
			<aside className="flex flex-col">
				<header className="px-4 lg:px-0">
					<h3 className="text-lg font-medium leading-6 text-gray-900">
						{title}
					</h3>
					<p className="mt-1 mb-2 text-sm text-gray-600">{description}</p>
				</header>
				{result?.state === 'accepted' ? (
					<details open={true}>
						<summary>Result</summary>
						<pre className="m-4 border-l-4 border-emerald-500 pl-4 py-2 mt-4">
							{JSON.stringify(result.value, null, 2)}
						</pre>
					</details>
				) : null}
			</aside>
			<main className="shadow lg:rounded-md lg:overflow-hidden">
				<fieldset
					className="mt-5 lg:mt-0 lg:col-span-2 px-4 py-5 bg-white space-y-4 lg:p-6"
					{...props}
				/>
				<footer className="px-4 py-3 bg-gray-50 flex flex-row-reverse lg:px-6 gap-2">
					<button
						type="submit"
						className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Submit
					</button>
					<button
						type="reset"
						className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Reset
					</button>
				</footer>
			</main>
		</>
	);
}

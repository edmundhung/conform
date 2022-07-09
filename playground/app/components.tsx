import type { FormResult } from '@conform-to/dom';
import type { ReactElement } from 'react';

interface FieldProps {
	label: string;
	inline?: boolean;
	error?: string;
	children: ReactElement;
}

export function Field({ label, inline, error, children }: FieldProps) {
	return (
		<label className="mb-4 block">
			<div
				className={
					inline
						? 'flex flex-row justify-between items-center gap-8 whitespace-nowrap'
						: ''
				}
			>
				<div className="block text-sm font-medium text-gray-700">{label}</div>
				{children}
			</div>
			<p className="my-1 text-pink-600 text-sm peer-valid:invisible">{error}</p>
		</label>
	);
}

interface PlaygroundProps<T> {
	title: string;
	description?: string;
	form?: string;
	result?: FormResult<T>;
	children: ReactElement;
}

export function Playground<T>({
	title,
	description,
	form,
	result,
	children,
}: PlaygroundProps<T>) {
	return (
		<div className="lg:grid lg:grid-cols-2 lg:gap-6" data-playground={title}>
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
			<div>
				<main className="shadow lg:rounded-md lg:overflow-hidden">
					<div className="mt-5 lg:mt-0 lg:col-span-2 px-4 py-5 bg-white lg:p-6">
						{children}
					</div>
					{form ? (
						<footer className="px-4 py-3 bg-gray-50 flex flex-row-reverse lg:px-6 gap-2">
							<button
								type="submit"
								className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								form={form}
							>
								Submit
							</button>
							<button
								type="reset"
								className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								form={form}
							>
								Reset
							</button>
						</footer>
					) : null}
				</main>
			</div>
		</div>
	);
}

import type { FieldConfig, Submission } from '@conform-to/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface PlaygroundProps {
	title: string;
	description?: string;
	form?: string;
	state?: Submission;
	children: ReactNode;
}

export function Playground({
	title,
	description,
	form,
	state,
	children,
}: PlaygroundProps) {
	const [submission, setSubmission] = useState(state ?? null);

	useEffect(() => {
		setSubmission(state ?? null);
	}, [state]);

	return (
		<section
			className="lg:grid lg:grid-cols-2 lg:gap-6 py-8"
			data-playground={title}
		>
			<aside className="flex flex-col">
				<header className="px-4 lg:px-0">
					<h3 className="text-lg font-medium leading-6 text-gray-900">
						{title}
					</h3>
					<p className="mt-1 mb-2 text-sm text-gray-600">{description}</p>
				</header>
				{submission ? (
					<details open={true}>
						<summary>Submission</summary>
						<pre
							className={`m-4 border-l-4 overflow-x-scroll ${
								submission.error.length > 0
									? 'border-pink-600'
									: 'border-emerald-500'
							} pl-4 py-2 mt-4`}
						>
							{JSON.stringify(submission, null, 2)}
						</pre>
					</details>
				) : null}
			</aside>
			<div>
				<main className="shadow lg:rounded-md lg:overflow-hidden">
					<div className="mt-5 lg:mt-0 lg:col-span-2 px-4 py-5 bg-white lg:p-6">
						{children}
					</div>
					<footer className="px-4 py-3 bg-gray-50 flex flex-row lg:px-6 gap-2">
						<button
							type="reset"
							className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							onClick={() => setSubmission(null)}
							form={form}
						>
							Reset
						</button>
						<button
							type="submit"
							className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							onClick={() => setSubmission(null)}
							form={form}
						>
							Submit
						</button>
					</footer>
				</main>
			</div>
		</section>
	);
}

interface FieldProps {
	label: string;
	inline?: boolean;
	error?: string;
	config?: FieldConfig<any>;
	children: ReactNode;
}

export function Field({ label, inline, error, config, children }: FieldProps) {
	return (
		<div className="mb-4">
			<div
				className={
					inline
						? 'flex flex-row justify-between items-center gap-8 whitespace-nowrap'
						: ''
				}
			>
				<label
					htmlFor={config?.id}
					className="block text-sm font-medium text-gray-700"
				>
					{label}
				</label>
				{children}
			</div>
			<p id={config?.errorId} className="my-1 text-pink-600 text-sm">
				{error}
			</p>
		</div>
	);
}

interface AlertProps {
	message: string;
}

export function Alert({ message }: AlertProps) {
	return (
		<label
			className={
				message
					? 'flex gap-4 bg-red-100 text-red-500 text-sm p-4 mb-4 rounded'
					: 'hidden'
			}
		>
			<span>❌</span>
			<p>{message}</p>
		</label>
	);
}

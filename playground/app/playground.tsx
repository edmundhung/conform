import { type ActionFunction } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { parse as baseParse, type Submission } from '@conform-to/dom';
import { useState, useEffect, type ReactNode } from 'react';

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const form = formData.get('playground');

	if (form) {
		formData.delete('playground');
	}

	return {
		form,
		entries: Array.from(formData),
	};
};

interface FieldProps {
	label: string;
	inline?: boolean;
	error?: string;
	children: ReactNode;
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
			<p className="my-1 text-pink-600 text-sm">{error}</p>
		</label>
	);
}

interface PlaygroundProps {
	title: string;
	description?: string;
	form: string;
	parse?: (
		payload: URLSearchParams | FormData,
	) => Submission<Record<string, unknown>>;
	children: ReactNode;
}

export function Playground({
	title,
	description,
	form,
	parse = baseParse,
	children,
}: PlaygroundProps) {
	const actionData = useActionData();
	const [payload, setPayload] = useState<URLSearchParams | null>(() => {
		if (actionData && form === actionData.form) {
			return new URLSearchParams(actionData.entries);
		}

		return null;
	});

	useEffect(() => {
		if (!actionData || actionData.form !== form) {
			return;
		}

		setPayload(new URLSearchParams(actionData.entries));
	}, [actionData, form]);

	const submission = payload ? parse(payload) : null;

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
							className={`m-4 border-l-4 ${
								submission.state === 'rejected'
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
					<input type="hidden" name="playground" value={form} form={form} />
					<div className="mt-5 lg:mt-0 lg:col-span-2 px-4 py-5 bg-white lg:p-6">
						{children}
					</div>
					{form ? (
						<footer className="px-4 py-3 bg-gray-50 flex flex-row-reverse lg:px-6 gap-2">
							<button
								type="submit"
								className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								onClick={() => setPayload(null)}
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
		</section>
	);
}

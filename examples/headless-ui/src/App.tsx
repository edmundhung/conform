import { coerceFormValue } from '@conform-to/zod/v3/future';
import { useState } from 'react';
import { z } from 'zod';
import {
	ExampleListBox,
	ExampleCombobox,
	ExampleSwitch,
	ExampleRadioGroup,
} from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		owner: z.array(z.string()).min(1),
		assignee: z.string(),
		enabled: z.boolean(),
		color: z.string(),
	}),
);

const options = [
	{ label: 'Durward Reynolds', value: '1' },
	{ label: 'Kenton Towne', value: '2' },
	{ label: 'Therese Wunsch', value: '3' },
	{ label: 'Benedict Kessler', value: '4' },
	{ label: 'Katelyn Rohan', value: '5' },
];

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const { form, fields, intent } = useForm(schema, {
		defaultValue: {
			owner: searchParams.getAll('owner'),
			assignee: searchParams.get('assignee'),
			enabled: searchParams.get('enabled'),
			color: searchParams.get('color'),
		},
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<main className="max-w-lg mx-auto py-8 px-4">
			<form
				className="space-y-8 divide-y divide-gray-200"
				{...form.props}
				onChange={() => setSubmittedValue(null)}
			>
				<div className="space-y-8">
					<div>
						<h3 className="text-lg font-medium leading-6 text-gray-900">
							Headless UI Example
						</h3>
						<p className="mt-4 text-gray-500">
							This example shows you how to integrate Conform with Headless UI.
							When the form is submitted, the search params will be updated with
							the form data and is set as the default value of the form.
						</p>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
						<div className="sm:col-span-6">
							<label className="block text-sm font-medium text-gray-700">
								Owner (List box)
							</label>
							<div className="mt-1">
								<ExampleListBox
									options={options}
									{...fields.owner.listBoxProps}
									// Equivalent to:
									// name={fields.owner.name}
									// defaultValue={fields.owner.defaultOptions}
								/>
							</div>
							<p className="mt-2 text-sm text-red-500">{fields.owner.errors}</p>
						</div>

						<div className="sm:col-span-6">
							<label className="block text-sm font-medium text-gray-700">
								Assigned to (Combobox)
							</label>
							<div className="mt-1">
								<ExampleCombobox
									options={options}
									{...fields.assignee.comboboxProps}
									// Equivalent to:
									// name={fields.assignee.name}
									// defaultValue={fields.assignee.defaultValue}
								/>
							</div>
							<p className="mt-2 text-sm text-red-500">
								{fields.assignee.errors}
							</p>
						</div>

						<div className="sm:col-span-6">
							<label className="block text-sm font-medium text-gray-700">
								Enabled (Switch)
							</label>
							<div className="mt-1">
								<ExampleSwitch
									{...fields.enabled.switchProps}
									// Equivalent to:
									// name={fields.enabled.name}
									// defaultChecked={fields.enabled.defaultChecked}
								/>
							</div>
							<p className="mt-2 text-sm text-red-500">
								{fields.enabled.errors}
							</p>
						</div>

						<div className="sm:col-span-6">
							<label className="block text-sm font-medium text-gray-700">
								Color (Radio Group)
							</label>
							<div className="mt-1">
								<ExampleRadioGroup
									{...fields.color.radioGroupProps}
									// Equivalent to:
									// name={fields.color.name}
									// defaultValue={fields.color.defaultValue}
								/>
							</div>
							<p className="mt-2 text-sm text-red-500">{fields.color.errors}</p>
						</div>
					</div>

					{submittedValue ? (
						<div className="text-sm">
							<h4 className="mb-2">Value submitted</h4>
							<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
						</div>
					) : null}
				</div>

				<div className="pt-5">
					<div className="flex justify-end">
						<button
							type="button"
							className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							onClick={() => intent.reset()}
						>
							Reset
						</button>
						<button
							type="submit"
							className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
						>
							Save
						</button>
					</div>
				</div>
			</form>
		</main>
	);
}

import { coerceFormValue } from '@conform-to/zod/v4/future';
import {
	Description,
	Field,
	Fieldset,
	Input,
	Label,
	Legend,
	Select,
	Textarea,
} from '@headlessui/react';
import { useState } from 'react';
import { z } from 'zod';
import {
	ExampleCheckbox,
	ExampleCombobox,
	ExampleListBox,
	ExampleRadioGroup,
	ExampleSwitch,
} from './components';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		owner: z.array(z.string()).min(1),
		assignee: z.string().min(1),
		enabled: z.boolean().optional().default(false),
		color: z.string().min(1),
		project: z.string().min(1),
		notes: z.string().optional(),
		priority: z.enum(['low', 'normal', 'high']),
		notifications: z.boolean().optional().default(false),
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
			project: searchParams.get('project'),
			notes: searchParams.get('notes'),
			priority: searchParams.get('priority') ?? 'normal',
			notifications: searchParams.get('notifications'),
		},
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only: emulate a GET request by storing the submitted FormData in the URL.
			const url = new URL(document.URL);
			const nextSearchParams = new URLSearchParams(
				Array.from(formData).filter(
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = nextSearchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(nextSearchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<main className="mx-auto max-w-xl px-4 py-8">
			<form
				className="space-y-8 divide-y divide-gray-200"
				{...form.props}
				onChange={() => setSubmittedValue(null)}
			>
				<div className="space-y-8">
					<div>
						<h1 className="text-lg font-medium text-gray-900">
							Headless UI Example
						</h1>
						<p className="mt-4 text-gray-500">
							This example integrates Conform with Headless UI v2 using custom
							metadata and useControl. Saving updates the URL and sets the
							values that Discard changes restores.
						</p>
					</div>

					<Fieldset className="space-y-6">
						<Legend className="text-base font-semibold text-gray-900">
							Headless UI controls
						</Legend>

						<Field>
							<Label
								htmlFor={fields.owner.id}
								className="block text-sm font-medium text-gray-700"
							>
								Owner (Listbox)
							</Label>
							<ExampleListBox
								options={options}
								{...fields.owner.listBoxProps}
								// Equivalent to:
								// id={fields.owner.id}
								// name={fields.owner.name}
								// defaultValue={fields.owner.defaultOptions}
								// aria-invalid={fields.owner.ariaInvalid}
								// aria-describedby={fields.owner.ariaDescribedBy}
							/>
							<Description
								id={fields.owner.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.owner.errors}
							</Description>
						</Field>

						<Field>
							<Label
								htmlFor={fields.assignee.id}
								className="block text-sm font-medium text-gray-700"
							>
								Assigned to (Combobox)
							</Label>
							<ExampleCombobox
								options={options}
								{...fields.assignee.comboboxProps}
								// Equivalent to:
								// id={fields.assignee.id}
								// name={fields.assignee.name}
								// defaultValue={fields.assignee.defaultValue}
								// aria-invalid={fields.assignee.ariaInvalid}
								// aria-describedby={fields.assignee.ariaDescribedBy}
							/>
							<Description
								id={fields.assignee.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.assignee.errors}
							</Description>
						</Field>

						<Field>
							<Label
								htmlFor={fields.enabled.id}
								className="block text-sm font-medium text-gray-700"
							>
								Enabled (Switch)
							</Label>
							<div className="mt-1">
								<ExampleSwitch
									{...fields.enabled.switchProps}
									// Equivalent to:
									// id={fields.enabled.id}
									// name={fields.enabled.name}
									// defaultChecked={fields.enabled.defaultChecked}
									// aria-invalid={fields.enabled.ariaInvalid}
									// aria-describedby={fields.enabled.ariaDescribedBy}
								/>
							</div>
							<Description
								id={fields.enabled.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.enabled.errors}
							</Description>
						</Field>

						<Field className="flex items-start gap-3">
							<ExampleCheckbox
								{...fields.notifications.checkboxProps}
								// Equivalent to:
								// id={fields.notifications.id}
								// name={fields.notifications.name}
								// defaultChecked={fields.notifications.defaultChecked}
								// aria-invalid={fields.notifications.ariaInvalid}
								// aria-describedby={fields.notifications.ariaDescribedBy}
							/>
							<div>
								<Label
									htmlFor={fields.notifications.id}
									className="text-sm font-medium text-gray-700"
								>
									Send notifications (Checkbox)
								</Label>
								<Description
									id={fields.notifications.errorId}
									className="mt-2 text-sm text-red-600"
								>
									{fields.notifications.errors}
								</Description>
							</div>
						</Field>

						<div>
							<p className="block text-sm font-medium text-gray-700">
								Color (RadioGroup)
							</p>
							<ExampleRadioGroup
								aria-label="Color (RadioGroup)"
								{...fields.color.radioGroupProps}
								// Equivalent to:
								// id={fields.color.id}
								// name={fields.color.name}
								// defaultValue={fields.color.defaultValue}
								// aria-invalid={fields.color.ariaInvalid}
								// aria-errormessage={fields.color.ariaDescribedBy}
							/>
							<p
								id={fields.color.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.color.errors}
							</p>
						</div>
						<Field>
							<Label
								htmlFor={fields.project.id}
								className="block text-sm font-medium text-gray-700"
							>
								Project name
							</Label>
							<Description
								id={fields.project.descriptionId}
								className="text-sm text-gray-500"
							>
								A short name used in the submitted FormData.
							</Description>
							<Input
								{...fields.project.inputProps}
								// Equivalent to:
								// id={fields.project.id}
								// name={fields.project.name}
								// defaultValue={fields.project.defaultValue}
								// required={fields.project.required}
								// invalid={fields.project.invalid}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm data-focus:border-indigo-500 data-focus:ring-1 data-focus:ring-indigo-500 data-focus:outline-none sm:text-sm"
							/>
							<Description
								id={fields.project.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.project.errors}
							</Description>
						</Field>

						<Field>
							<Label
								htmlFor={fields.notes.id}
								className="block text-sm font-medium text-gray-700"
							>
								Notes
							</Label>
							<Textarea
								{...fields.notes.textareaProps}
								// Equivalent to:
								// id={fields.notes.id}
								// name={fields.notes.name}
								// defaultValue={fields.notes.defaultValue}
								// required={fields.notes.required}
								// invalid={fields.notes.invalid}
								rows={3}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm data-focus:border-indigo-500 data-focus:ring-1 data-focus:ring-indigo-500 data-focus:outline-none sm:text-sm"
							/>
							<Description
								id={fields.notes.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.notes.errors}
							</Description>
						</Field>

						<Field>
							<Label
								htmlFor={fields.priority.id}
								className="block text-sm font-medium text-gray-700"
							>
								Priority
							</Label>
							<Select
								{...fields.priority.selectProps}
								// Equivalent to:
								// id={fields.priority.id}
								// name={fields.priority.name}
								// defaultValue={fields.priority.defaultValue}
								// required={fields.priority.required}
								// invalid={fields.priority.invalid}
								className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm data-focus:border-indigo-500 data-focus:ring-1 data-focus:ring-indigo-500 data-focus:outline-none sm:text-sm"
							>
								<option value="low">Low</option>
								<option value="normal">Normal</option>
								<option value="high">High</option>
							</Select>
							<Description
								id={fields.priority.errorId}
								className="mt-2 text-sm text-red-600"
							>
								{fields.priority.errors}
							</Description>
						</Field>
					</Fieldset>

					{submittedValue ? (
						<div className="text-sm">
							<h2 className="mb-2 font-medium">Value submitted</h2>
							<pre data-testid="submitted-value">
								{JSON.stringify(submittedValue, null, 2)}
							</pre>
						</div>
					) : null}
				</div>

				<div className="pt-5">
					<div className="flex justify-end">
						<button
							type="button"
							className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
							onClick={() => intent.reset()}
						>
							Discard changes
						</button>
						<button
							type="submit"
							className="ml-3 inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Save to URL
						</button>
					</div>
				</div>
			</form>
		</main>
	);
}

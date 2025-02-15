import { getMetadata, isInput, isTouched, useFormControl } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { useRef } from 'react';
import { z } from 'zod';
import {
	ExampleListBox,
	ExampleCombobox,
	ExampleSwitch,
	ExampleRadioGroup,
} from './form';

const schema = coerceZodFormData(
	z.object({
		owner: z.array(z.string()).min(1),
		assignee: z.string(),
		enabled: z.boolean(),
		color: z.string(),
	}),
);

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, handleSubmit, intent } = useFormControl(formRef, {
		onValidate(value) {
			return resolveZodResult(schema.safeParse(value));
		},
		onSubmit(event, { value }) {
			event.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const { fields } = getMetadata(state, {
		defaultValue: {
			owner: ['2', '4'],
			assignee: '1',
			enabled: true,
			color: 'Pink',
		},
	});

	return (
		<main className="max-w-lg mx-auto py-8 px-4">
			<form
				className="space-y-8 divide-y divide-gray-200"
				ref={formRef}
				onSubmit={handleSubmit}
				onBlur={(event) => {
					if (isInput(event.target) && !isTouched(state, event.target.name)) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (isInput(event.target) && isTouched(state, event.target.name)) {
						intent.validate(event.target.name);
					}
				}}
				noValidate
			>
				<div className="space-y-8 divide-y divide-gray-200">
					<div>
						<div>
							<h3 className="text-lg font-medium leading-6 text-gray-900">
								Headless UI Example
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								This shows you how to integrate Conform with headless-ui
								components, such as ListBox, Combobox, Switch and RadioGroup.
							</p>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
							<div className="sm:col-span-6">
								<label className="block text-sm font-medium text-gray-700">
									Owner (List box)
								</label>
								<div className="mt-1">
									<ExampleListBox
										name={fields.owner.name}
										defaultValue={fields.owner.defaultSelected}
									/>
								</div>
								<p className="mt-2 text-sm text-red-500">
									{fields.owner.errors}
								</p>
							</div>

							<div className="sm:col-span-6">
								<label className="block text-sm font-medium text-gray-700">
									Assigned to (Combobox)
								</label>
								<div className="mt-1">
									<ExampleCombobox
										name={fields.assignee.name}
										defaultValue={fields.assignee.defaultValue}
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
										name={fields.enabled.name}
										defaultChecked={fields.enabled.defaultValue === 'on'}
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
										name={fields.color.name}
										defaultValue={fields.color.defaultValue}
									/>
								</div>
								<p className="mt-2 text-sm text-red-500">
									{fields.color.errors}
								</p>
							</div>
						</div>
					</div>
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

import {
	type FieldName,
	FormProvider,
	useForm,
	useField,
	useInputControl,
	parse,
} from '@conform-to/react';
import { Listbox, Combobox, Switch, RadioGroup } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

export default function Example() {
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parse(formData, {
				resolve(value) {
					const error: Record<string, string[]> = {};

					if (!value.owner) {
						error.owner = ['Please select an owner'];
					}

					if (!value.assignee) {
						error.assignee = ['Please select an assignee'];
					}

					if (!value.enabled) {
						error.enabled = ['Please enable the switch'];
					}

					if (!value.color) {
						error.color = ['Please select a color'];
					}

					if (Object.entries(error).length > 0) {
						return { error };
					}

					return { value };
				},
			});
		},
	});

	return (
		<main className="max-w-lg mx-auto py-8 px-4">
			<FormProvider context={form.context}>
				<form
					className="space-y-8 divide-y divide-gray-200"
					id={form.id}
					onSubmit={form.onSubmit}
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
										<ExampleListBox name={fields.owner.name} />
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
										<ExampleCombobox name={fields.assignee.name} />
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
										<ExampleSwitch name={fields.enabled.name} />
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
										<ExampleRadioGroup name={fields.color.name} />
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
								type="reset"
								className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
			</FormProvider>
		</main>
	);
}

const people = [
	{ id: 1, name: 'Durward Reynolds' },
	{ id: 2, name: 'Kenton Towne' },
	{ id: 3, name: 'Therese Wunsch' },
	{ id: 4, name: 'Benedict Kessler' },
	{ id: 5, name: 'Katelyn Rohan' },
];

function classNames(...classes: Array<string | boolean>): string {
	return classes.filter(Boolean).join(' ');
}

function ExampleListBox(props: { name: FieldName<string[]> }) {
	const [meta] = useField(props.name);
	const control = useInputControl(meta);
	const value =
		typeof control.value === 'undefined'
			? []
			: Array.isArray(control.value)
			? control.value
			: [control.value];

	return (
		<Listbox value={value} onChange={control.change} multiple>
			<div className="relative mt-1">
				<Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
					<span className="block truncate">
						{value.length === 0
							? 'Please select'
							: value
									.map((id) => people.find((p) => p.id.toString() === id)?.name)
									.join(', ')}
					</span>
					<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
						<ChevronUpDownIcon
							className="h-5 w-5 text-gray-400"
							aria-hidden="true"
						/>
					</span>
				</Listbox.Button>
				<Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
					{people.map((person) => (
						<Listbox.Option
							key={person.id}
							className={({ active }) =>
								classNames(
									active ? 'text-white bg-indigo-600' : 'text-gray-900',
									'relative cursor-default select-none py-2 pl-3 pr-9',
								)
							}
							value={`${person.id}`}
						>
							{({ selected, active }) => (
								<>
									<span
										className={classNames(
											selected ? 'font-semibold' : 'font-normal',
											'block truncate',
										)}
									>
										{person.name}
									</span>

									{selected ? (
										<span
											className={classNames(
												active ? 'text-white' : 'text-indigo-600',
												'absolute inset-y-0 right-0 flex items-center pr-4',
											)}
										>
											<CheckIcon className="h-5 w-5" aria-hidden="true" />
										</span>
									) : null}
								</>
							)}
						</Listbox.Option>
					))}
				</Listbox.Options>
			</div>
		</Listbox>
	);
}

function ExampleCombobox(props: { name: FieldName<string> }) {
	const [query, setQuery] = useState('');
	const [meta] = useField(props.name);
	const control = useInputControl(meta);
	const filteredPeople = !control.value
		? people
		: people.filter((person) =>
				person.name.toLowerCase().includes(query.toLowerCase()),
		  );

	return (
		<Combobox
			as="div"
			value={control.value ?? ''}
			onChange={control.change}
			nullable
		>
			<div className="relative mt-1">
				<Combobox.Input
					className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
					onChange={(event) => setQuery(event.target.value)}
					displayValue={(personId: string) =>
						people.find((p) => `${p.id}` === personId)?.name ?? ''
					}
				/>
				<Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
					<ChevronUpDownIcon
						className="h-5 w-5 text-gray-400"
						aria-hidden="true"
					/>
				</Combobox.Button>

				{filteredPeople.length > 0 && (
					<Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
						{filteredPeople.map((person) => (
							<Combobox.Option
								key={person.id}
								value={`${person.id}`}
								className={({ active }) =>
									classNames(
										'relative cursor-default select-none py-2 pl-3 pr-9',
										active ? 'bg-indigo-600 text-white' : 'text-gray-900',
									)
								}
							>
								{({ active, selected }) => (
									<>
										<span
											className={classNames(
												'block truncate',
												selected && 'font-semibold',
											)}
										>
											{person.name}
										</span>

										{selected && (
											<span
												className={classNames(
													'absolute inset-y-0 right-0 flex items-center pr-4',
													active ? 'text-white' : 'text-indigo-600',
												)}
											>
												<CheckIcon className="h-5 w-5" aria-hidden="true" />
											</span>
										)}
									</>
								)}
							</Combobox.Option>
						))}
					</Combobox.Options>
				)}
			</div>
		</Combobox>
	);
}

function ExampleSwitch(props: { name: FieldName<boolean> }) {
	const [meta] = useField(props.name);
	const control = useInputControl(meta);

	return (
		<Switch
			checked={control.value === 'on'}
			onChange={(state) => control.change(state ? 'on' : '')}
			className={classNames(
				control.value ? 'bg-indigo-600' : 'bg-gray-200',
				'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
			)}
		>
			<span className="sr-only">Use setting</span>
			<span
				aria-hidden="true"
				className={classNames(
					control.value ? 'translate-x-5' : 'translate-x-0',
					'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
				)}
			/>
		</Switch>
	);
}

function ExampleRadioGroup(props: { name: FieldName<string> }) {
	const [meta] = useField(props.name);
	const control = useInputControl(meta);
	const colors = [
		{ name: 'Pink', bgColor: 'bg-pink-500', selectedColor: 'ring-pink-500' },
		{
			name: 'Purple',
			bgColor: 'bg-purple-500',
			selectedColor: 'ring-purple-500',
		},
		{ name: 'Blue', bgColor: 'bg-blue-500', selectedColor: 'ring-blue-500' },
		{ name: 'Green', bgColor: 'bg-green-500', selectedColor: 'ring-green-500' },
		{
			name: 'Yellow',
			bgColor: 'bg-yellow-500',
			selectedColor: 'ring-yellow-500',
		},
	];

	return (
		<RadioGroup value={control.value ?? ''} onChange={control.change}>
			<div className="mt-4 flex items-center space-x-3">
				{colors.map((color) => (
					<RadioGroup.Option
						key={color.name}
						value={color.name}
						className={({ active, checked }) =>
							classNames(
								color.selectedColor,
								active && checked ? 'ring ring-offset-1' : '',
								!active && checked ? 'ring-2' : '',
								'-m-0.5 relative p-0.5 rounded-full flex items-center justify-center cursor-pointer focus:outline-none',
							)
						}
					>
						<RadioGroup.Label as="span" className="sr-only">
							{color.name}
						</RadioGroup.Label>
						<span
							aria-hidden="true"
							className={classNames(
								color.bgColor,
								'h-8 w-8 border border-black border-opacity-10 rounded-full',
							)}
						/>
					</RadioGroup.Option>
				))}
			</div>
		</RadioGroup>
	);
}

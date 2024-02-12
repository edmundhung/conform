import {
	type FieldName,
	FormProvider,
	useForm,
	useField,
	unstable_useControl as useControl,
	useInputControl,
	getFormProps,
	getSelectProps,
	getInputProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import * as Checkbox from '@radix-ui/react-checkbox';

const schema = z.object({
	color: z.enum(['red', 'green', 'blue'], {
		required_error: 'Color is required',
	}),
	languages: z.string().array().min(1, 'Languages is required'),
	tos: z.boolean({ required_error: 'Please accept the terms of service' }),
	options: z.array(z.string()).min(1, 'At least one option is required'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		manualSetup: url.searchParams.get('manualSetup') === 'yes',
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const { manualSetup, noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		id: 'example',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<Playground title="Custom Inputs" result={lastResult}>
					<Field label="Headless ListBox (Single)" meta={fields.color}>
						<CustomSelect
							name={fields.color.name}
							options={['red', 'green', 'blue']}
							placeholder="Select a color"
							manualSetup={manualSetup}
						/>
					</Field>
					<Field label="Headless ListBox (Multiple)" meta={fields.languages}>
						<CustomSelect
							name={fields.languages.name}
							options={['English', 'Spanish', 'French']}
							placeholder="Select languages"
							multiple
							manualSetup={manualSetup}
						/>
					</Field>
					<Field label="Radix Checkbox (Single)" meta={fields.tos}>
						<CustomCheckbox
							label="I accept the terms of service"
							name={fields.tos.name}
							manualSetup={manualSetup}
						/>
					</Field>
					<Field label="Radix Checkbox (Multiple)" meta={fields.options}>
						<CustomMultipleCheckbox
							name={fields.options.name}
							options={['a', 'b', 'c', 'd']}
							manualSetup={manualSetup}
						/>
					</Field>
				</Playground>
			</Form>
		</FormProvider>
	);
}

function classNames(...classes: Array<string | boolean>): string {
	return classes.filter(Boolean).join(' ');
}

function CustomSelect({
	name,
	options,
	placeholder,
	multiple,
	manualSetup,
}: {
	name: FieldName<string | string[]>;
	placeholder: string;
	options: string[];
	multiple?: boolean;
	manualSetup: boolean;
}) {
	const [field] = useField(name);
	const buttonRef = useRef<HTMLButtonElement>(null);
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const control = manualSetup ? useControl(field) : useInputControl(field);
	const value =
		typeof control.value === 'string' ? [control.value] : control.value ?? [];

	return (
		<Listbox
			value={control.value ?? (multiple ? [] : '')}
			onChange={control.change}
			multiple={multiple}
		>
			{manualSetup ? (
				<>
					{multiple ? (
						<select
							className="sr-only"
							aria-hidden
							tabIndex={-1}
							{...getSelectProps(field)}
							multiple
						>
							<option value="" />
							{options.map((option) => (
								<option key={option} value={option} />
							))}
						</select>
					) : (
						<input
							className="sr-only"
							aria-hidden
							tabIndex={-1}
							{...getInputProps(field, { type: 'text' })}
						/>
					)}
				</>
			) : null}
			<div className="relative mt-1">
				<Listbox.Button
					className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
					ref={buttonRef}
				>
					<span className="block truncate">
						{value.length === 0 ? placeholder : value.join(', ')}
					</span>
					<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
						<ChevronUpDownIcon
							className="h-5 w-5 text-gray-400"
							aria-hidden="true"
						/>
					</span>
				</Listbox.Button>
				<Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
					{options.map((option) => (
						<Listbox.Option
							key={option}
							className={({ active }) =>
								classNames(
									active ? 'text-white bg-indigo-600' : 'text-gray-900',
									'relative cursor-default select-none py-2 pl-3 pr-9',
								)
							}
							value={option}
						>
							{({ selected, active }) => (
								<>
									<span
										className={classNames(
											selected ? 'font-semibold' : 'font-normal',
											'block truncate',
										)}
									>
										{option}
									</span>

									{option !== '' && selected ? (
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

function CustomCheckbox({
	name,
	label,
	manualSetup,
}: {
	name: FieldName<boolean>;
	label: string;
	manualSetup: boolean;
}) {
	const [field] = useField(name);
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const control = manualSetup ? useControl(field) : useInputControl(field);

	return (
		<div className="flex items-center py-2">
			<Checkbox.Root
				type="button"
				className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white outline-none shadow-[0_0_0_2px_black]"
				id={field.id}
				name={manualSetup ? field.name : undefined}
				checked={control.value === 'on'}
				onCheckedChange={(state) => control.change(state.valueOf() ? 'on' : '')}
				onBlur={control.blur}
			>
				<Checkbox.Indicator>
					<CheckIcon className="w-4 h-4" />
				</Checkbox.Indicator>
			</Checkbox.Root>
			<label htmlFor={field.id} className="pl-[15px] text-[15px] leading-none">
				{label}
			</label>
		</div>
	);
}

function CustomMultipleCheckbox({
	name,
	options,
	manualSetup,
}: {
	name: FieldName<string[]>;
	options: string[];
	manualSetup: boolean;
}) {
	const [field] = useField(name);
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const control = manualSetup ? useControl(field) : useInputControl(field);
	const value =
		typeof control.value === 'string' ? [control.value] : control.value ?? [];

	return (
		<div className="py-2 space-y-4">
			{options.map((option) => (
				<div key={option} className="flex items-center">
					<Checkbox.Root
						type="button"
						className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white outline-none shadow-[0_0_0_2px_black]"
						id={`${field.id}-${option}`}
						name={manualSetup ? field.name : undefined}
						value={option}
						checked={value.includes(option)}
						onCheckedChange={(state) =>
							control.change(
								state.valueOf()
									? value.concat(option)
									: value.filter((item) => item !== option),
							)
						}
						onBlur={control.blur}
					>
						<Checkbox.Indicator>
							<CheckIcon className="w-4 h-4" />
						</Checkbox.Indicator>
					</Checkbox.Root>
					<label
						htmlFor={`${field.id}-${option}`}
						className="pl-[15px] text-[15px] leading-none"
					>
						{option}
					</label>
				</div>
			))}
		</div>
	);
}

import { conform, useForm, useInputEvent } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import * as Checkbox from '@radix-ui/react-checkbox';

const schema = z.object({
	language: z.string({ required_error: 'Language is required' }),
	tos: z
		.string({ required_error: 'Please accept the terms of service' })
		.transform((value) => value === 'on'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { form, fields } = useForm({
		id: 'example',
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...conform.form(form)}>
			<Playground title="Custom Inputs Form" lastSubmission={lastResult}>
				<Field label="Headless ListBox" config={fields.language}>
					<CustomSelect
						id={fields.language.id}
						name={fields.language.name}
						defaultValue={fields.language.defaultValue}
					/>
				</Field>
				<Field label="Radix Checkbox" config={fields.tos}>
					<CustomCheckbox
						id={fields.tos.id}
						name={fields.tos.name}
						defaultChecked={fields.tos.defaultValue === 'on'}
						label="I accept the terms of service"
					/>
				</Field>
			</Playground>
		</Form>
	);
}

function classNames(...classes: Array<string | boolean>): string {
	return classes.filter(Boolean).join(' ');
}

type CustomSelectProps = {
	id?: string;
	name: string;
	defaultValue?: string;
};

function CustomSelect({ id, name, defaultValue }: CustomSelectProps) {
	const [value, setValue] = useState(defaultValue ?? '');
	const controlRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const control = useInputEvent({
		ref: controlRef,
		onReset: () => setValue(defaultValue ?? ''),
	});

	const options = [
		{ code: '', name: 'Please select' },
		{ code: 'en', name: 'English' },
		{ code: 'de', name: 'Deutsch' },
		{ code: 'jp', name: 'Japanese' },
	];

	return (
		<>
			<input
				ref={controlRef}
				id={id}
				name={name}
				defaultValue={defaultValue}
				className="sr-only"
				aria-hidden={true}
				tabIndex={-1}
				onChange={(event) => setValue(event.target.value)}
				onFocus={() => buttonRef.current?.focus()}
			/>
			<Listbox value={value} onChange={control.change}>
				<div className="relative mt-1">
					<Listbox.Button
						className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
						ref={buttonRef}
					>
						<span className="block truncate">
							{options.find((option) => value === option.code)?.name ??
								'Please select'}
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
								key={option.code}
								className={({ active }) =>
									classNames(
										active ? 'text-white bg-indigo-600' : 'text-gray-900',
										'relative cursor-default select-none py-2 pl-3 pr-9',
									)
								}
								value={option.code}
							>
								{({ selected, active }) => (
									<>
										<span
											className={classNames(
												selected ? 'font-semibold' : 'font-normal',
												'block truncate',
											)}
										>
											{option.name}
										</span>

										{option.code !== '' && selected ? (
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
		</>
	);
}

type CustomCheckboxProps = {
	id?: string;
	name: string;
	value?: string;
	label: string;
	defaultChecked?: boolean;
};

function CustomCheckbox({
	id,
	name,
	value = 'on',
	label,
	defaultChecked,
}: CustomCheckboxProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const control = useInputEvent({
		ref: () => buttonRef.current?.form?.elements.namedItem(name),
	});

	return (
		<div className="flex items-center">
			<Checkbox.Root
				ref={buttonRef}
				type="button"
				className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white outline-none shadow-[0_0_0_2px_black]"
				id={id}
				name={name}
				value={value}
				defaultChecked={defaultChecked}
				onCheckedChange={(state) => control.change(Boolean(state.valueOf()))}
				onFocus={control.focus}
				onBlur={control.blur}
			>
				<Checkbox.Indicator>
					<CheckIcon className="w-4 h-4" />
				</Checkbox.Indicator>
			</Checkbox.Root>
			<label htmlFor={id} className="pl-[15px] text-[15px] leading-none">
				{label}
			</label>
		</div>
	);
}

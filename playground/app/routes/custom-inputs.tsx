import {
	type FieldName,
	FormProvider,
	useForm,
	useField,
	useInputControl,
	getFormProps,
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
	language: z.string({ required_error: 'Language is required' }),
	tos: z.boolean({ required_error: 'Please accept the terms of service' }),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { form, fieldset } = useForm({
		id: 'example',
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<Playground title="Custom Inputs Form" result={lastResult}>
					<Field label="Headless ListBox" meta={fieldset.language}>
						<CustomSelect name={fieldset.language.name} />
					</Field>
					<Field label="Radix Checkbox" meta={fieldset.tos}>
						<div className="flex items-center">
							<CustomCheckbox name={fieldset.tos.name} />
							<label
								htmlFor={fieldset.tos.id}
								className="pl-[15px] text-[15px] leading-none"
							>
								I accept the terms of service
							</label>
						</div>
					</Field>
				</Playground>
			</Form>
		</FormProvider>
	);
}

function classNames(...classes: Array<string | boolean>): string {
	return classes.filter(Boolean).join(' ');
}

function CustomSelect({ name }: { name: FieldName<string> }) {
	const { field } = useField({ name });
	const buttonRef = useRef<HTMLButtonElement>(null);
	const control = useInputControl(field);
	const options = [
		{ code: '', name: 'Please select' },
		{ code: 'en', name: 'English' },
		{ code: 'de', name: 'Deutsch' },
		{ code: 'jp', name: 'Japanese' },
	];

	return (
		<Listbox value={control.value} onChange={control.change}>
			<div className="relative mt-1">
				<Listbox.Button
					className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
					ref={buttonRef}
				>
					<span className="block truncate">
						{options.find((option) => control.value === option.code)?.name ??
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
	);
}

function CustomCheckbox({ name }: { name: FieldName<boolean> }) {
	const { field } = useField({ name });
	const control = useInputControl(field);

	return (
		<Checkbox.Root
			type="button"
			className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white outline-none shadow-[0_0_0_2px_black]"
			id={field.id}
			name={name}
			checked={control.value === 'on'}
			onCheckedChange={(state) => control.change(state.valueOf() ? 'on' : '')}
			onBlur={control.blur}
		>
			<Checkbox.Indicator>
				<CheckIcon className="w-4 h-4" />
			</Checkbox.Indicator>
		</Checkbox.Root>
	);
}

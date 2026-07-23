import { useControl } from '@conform-to/react/future';
import {
	Checkbox,
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
	Radio,
	RadioGroup,
	Switch,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useRef, useState } from 'react';

type ValidationProps = {
	id?: string;
	'aria-invalid'?: boolean;
	'aria-describedby'?: string;
};

type ExampleListBoxProps = ValidationProps & {
	name: string;
	defaultValue?: string[];
	options: Array<{ label: string; value: string }>;
};

export function ExampleListBox({
	id,
	name,
	defaultValue,
	options,
	'aria-invalid': invalid,
	...validationProps
}: ExampleListBoxProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			buttonRef.current?.focus();
		},
	});
	const selectedOptions = control.options ?? [];

	return (
		<Listbox
			value={selectedOptions}
			onChange={(value) => control.change(value)}
			invalid={invalid}
			multiple
		>
			<select
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
				multiple
			>
				{options.map((option) => (
					<option key={option.value} value={option.value} />
				))}
			</select>
			<div
				className="relative mt-1"
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				<ListboxButton
					ref={buttonRef}
					id={id}
					aria-invalid={invalid}
					{...validationProps}
					className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm data-focus:border-indigo-500 data-focus:ring-1 data-focus:ring-indigo-500 data-focus:outline-none sm:text-sm"
				>
					<span className="block truncate">
						{selectedOptions.length === 0
							? 'Please select'
							: selectedOptions
									.map(
										(value) =>
											options.find((item) => item.value === value)?.label,
									)
									.filter(Boolean)
									.join(', ')}
					</span>
					<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
						<ChevronUpDownIcon
							className="size-5 text-gray-400"
							aria-hidden="true"
						/>
					</span>
				</ListboxButton>
				<ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
					{options.map((option) => (
						<ListboxOption
							key={option.value}
							value={option.value}
							className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
						>
							<span className="block truncate group-data-selected:font-semibold">
								{option.label}
							</span>
							<span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-focus:text-white group-data-selected:flex">
								<CheckIcon className="size-5" aria-hidden="true" />
							</span>
						</ListboxOption>
					))}
				</ListboxOptions>
			</div>
		</Listbox>
	);
}

type ExampleComboboxProps = ValidationProps & {
	name: string;
	defaultValue?: string;
	options: Array<{ label: string; value: string }>;
};

export function ExampleCombobox({
	id,
	name,
	defaultValue,
	options,
	'aria-invalid': invalid,
	...validationProps
}: ExampleComboboxProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState('');
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});
	const filteredOptions =
		query === ''
			? options
			: options.filter((option) =>
					option.label.toLowerCase().includes(query.toLowerCase()),
				);

	return (
		<Combobox
			value={control.value || null}
			onChange={(value: string | null) => control.change(value ?? '')}
			onClose={() => setQuery('')}
			invalid={invalid}
		>
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
			<div className="relative mt-1">
				<ComboboxInput
					ref={inputRef}
					id={id}
					aria-invalid={invalid}
					{...validationProps}
					className="w-full rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 shadow-sm data-focus:border-indigo-500 data-focus:ring-1 data-focus:ring-indigo-500 data-focus:outline-none sm:text-sm"
					onChange={(event) => setQuery(event.target.value)}
					onBlur={() => control.blur()}
					displayValue={(value: string | null) =>
						options.find((option) => option.value === value)?.label ?? ''
					}
				/>
				<ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
					<ChevronUpDownIcon
						className="size-5 text-gray-400"
						aria-hidden="true"
					/>
				</ComboboxButton>
				{filteredOptions.length > 0 ? (
					<ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
						{filteredOptions.map((option) => (
							<ComboboxOption
								key={option.value}
								value={option.value}
								className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
							>
								<span className="block truncate group-data-selected:font-semibold">
									{option.label}
								</span>
								<span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-focus:text-white group-data-selected:flex">
									<CheckIcon className="size-5" aria-hidden="true" />
								</span>
							</ComboboxOption>
						))}
					</ComboboxOptions>
				) : null}
			</div>
		</Combobox>
	);
}

type ExampleSwitchProps = ValidationProps & {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function ExampleSwitch({
	id,
	name,
	value,
	defaultChecked,
	...validationProps
}: ExampleSwitchProps) {
	const switchRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<>
			<input
				type="checkbox"
				name={name}
				value={value}
				defaultChecked={defaultChecked}
				ref={control.register}
				hidden
			/>
			<Switch
				ref={switchRef}
				id={id}
				{...validationProps}
				checked={control.checked ?? false}
				onChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out data-checked:bg-indigo-600 data-focus:ring-2 data-focus:ring-indigo-500 data-focus:ring-offset-2 data-focus:outline-none"
			>
				<span
					aria-hidden="true"
					className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-5"
				/>
			</Switch>
		</>
	);
}

type ExampleCheckboxProps = ValidationProps & {
	name: string;
	defaultChecked?: boolean;
};

export function ExampleCheckbox({
	id,
	name,
	defaultChecked,
	...validationProps
}: ExampleCheckboxProps) {
	const checkboxRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultChecked,
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<input
				type="checkbox"
				name={name}
				defaultChecked={defaultChecked}
				ref={control.register}
				hidden
			/>
			<Checkbox
				ref={checkboxRef}
				id={id}
				{...validationProps}
				checked={control.checked ?? false}
				onChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="group mt-0.5 flex size-5 items-center justify-center rounded border border-gray-300 bg-white data-checked:border-indigo-600 data-checked:bg-indigo-600 data-focus:ring-2 data-focus:ring-indigo-500 data-focus:ring-offset-2 data-focus:outline-none"
			>
				<svg
					className="hidden size-4 fill-white group-data-checked:block"
					viewBox="0 0 14 14"
				>
					<path
						d="M3 8l2.5 2.5L11 4.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					/>
				</svg>
			</Checkbox>
		</>
	);
}

const colors = [
	{ name: 'Pink', color: 'bg-pink-500', ring: 'data-checked:ring-pink-500' },
	{
		name: 'Purple',
		color: 'bg-purple-500',
		ring: 'data-checked:ring-purple-500',
	},
	{ name: 'Blue', color: 'bg-blue-500', ring: 'data-checked:ring-blue-500' },
	{ name: 'Green', color: 'bg-green-500', ring: 'data-checked:ring-green-500' },
	{
		name: 'Yellow',
		color: 'bg-yellow-500',
		ring: 'data-checked:ring-yellow-500',
	},
];

type ExampleRadioGroupProps = ValidationProps & {
	name: string;
	defaultValue?: string;
	'aria-label'?: string;
	'aria-errormessage'?: string;
};

export function ExampleRadioGroup({
	id,
	name,
	defaultValue,
	...validationProps
}: ExampleRadioGroupProps) {
	const groupRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				groupRef.current?.querySelector<HTMLElement>('[data-checked]') ??
				groupRef.current?.querySelector<HTMLElement>('[role="radio"]');

			item?.focus();
		},
	});

	return (
		<RadioGroup
			ref={groupRef}
			id={id}
			{...validationProps}
			value={control.value ?? ''}
			onChange={(value: string) => control.change(value)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					control.blur();
				}
			}}
			className="mt-4 flex items-center gap-3"
		>
			<input
				name={name}
				ref={control.register}
				defaultValue={defaultValue}
				hidden
			/>
			{colors.map((color) => (
				<Radio
					key={color.name}
					value={color.name}
					aria-label={color.name}
					className={`-m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 data-checked:ring-2 data-focus:outline-2 data-focus:outline-offset-2 ${color.ring}`}
				>
					<span
						aria-hidden="true"
						className={`size-8 rounded-full border border-black/10 ${color.color}`}
					/>
				</Radio>
			))}
		</RadioGroup>
	);
}

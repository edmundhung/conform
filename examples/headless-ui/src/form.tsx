import { useControl } from '@conform-to/react';
import { Listbox, Combobox, Switch, RadioGroup } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

function classNames(...classes: Array<string | boolean>): string {
	return classes.filter(Boolean).join(' ');
}

type ExampleListBoxProps = {
	name: string;
	defaultValue?: string[];
	options: Array<{ label: string; value: string }>;
};

export function ExampleListBox({
	name,
	defaultValue,
	options,
}: ExampleListBoxProps) {
	const control = useControl({ defaultValue });

	return (
		<Listbox
			value={control.options ?? []}
			onChange={(value) => control.change(value)}
			multiple
		>
			<select ref={control.register} name={name} hidden multiple />
			<div className="relative mt-1" onBlur={() => control.blur()}>
				<Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
					<span className="block truncate">
						{!control.options || control.options.length === 0
							? 'Please select'
							: control.options
									.map((value) => options.find((o) => o.value === value)?.label)
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
					{options.map((option) => (
						<Listbox.Option
							key={option.value}
							className={({ active }) =>
								classNames(
									active ? 'text-white bg-indigo-600' : 'text-gray-900',
									'relative cursor-default select-none py-2 pl-3 pr-9',
								)
							}
							value={option.value}
						>
							{({ selected, active }) => (
								<>
									<span
										className={classNames(
											selected ? 'font-semibold' : 'font-normal',
											'block truncate',
										)}
									>
										{option.label}
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

type ExampleComboboxProps = {
	name: string;
	defaultValue?: string;
	options: Array<{ label: string; value: string }>;
};

export function ExampleCombobox({
	name,
	defaultValue,
	options,
}: ExampleComboboxProps) {
	const [query, setQuery] = useState('');
	const control = useControl({ defaultValue });
	const filteredOptions = !control.value
		? options
		: options.filter((option) =>
				option.label.toLowerCase().includes(query.toLowerCase()),
			);

	return (
		<Combobox
			as="div"
			value={control.value ?? null}
			onChange={(value) => control.change(value ?? '')}
			onBlur={() => control.blur()}
			nullable
		>
			<div className="relative mt-1">
				<input name={name} ref={control.register} hidden />
				<Combobox.Input
					className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
					onChange={(event) => setQuery(event.target.value)}
					displayValue={(item) =>
						options.find((option) => option.value === item)?.label ?? ''
					}
				/>
				<Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
					<ChevronUpDownIcon
						className="h-5 w-5 text-gray-400"
						aria-hidden="true"
					/>
				</Combobox.Button>

				{filteredOptions.length > 0 && (
					<Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
						{filteredOptions.map((option) => (
							<Combobox.Option
								key={option.value}
								value={option.value}
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
											{option.label}
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

type ExampleSwitchProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function ExampleSwitch({
	name,
	value,
	defaultChecked,
}: ExampleSwitchProps) {
	const control = useControl({ defaultChecked, value });

	return (
		<>
			<input
				type="checkbox"
				className="hidden"
				name={name}
				ref={control.register}
				hidden
			/>
			<Switch
				checked={control.checked}
				onChange={(state) => control.change(state)}
				onBlur={() => control.blur()}
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
		</>
	);
}

type ExampleRadioGroupProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleRadioGroup({
	name,
	defaultValue,
}: ExampleRadioGroupProps) {
	const input = useControl({
		defaultValue,
	});
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
		<RadioGroup
			value={input.value ?? ''}
			onChange={(value) => input.change(value)}
			onBlur={() => input.blur()}
		>
			<input name={name} ref={input.register} hidden />
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

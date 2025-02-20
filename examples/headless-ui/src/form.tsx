import { useInput } from 'conform-react';
import { Listbox, Combobox, Switch, RadioGroup } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

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

type ExampleListBoxProps = {
	name: string;
	defaultValue?: string[];
};

export function ExampleListBox({ name, defaultValue }: ExampleListBoxProps) {
	const input = useInput(defaultValue);

	return (
		<Listbox
			value={input.selected ?? []}
			onChange={(value) => input.change(value)}
			multiple
		>
			<select
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				defaultValue={defaultValue}
				multiple
			>
				{defaultValue?.map((item) => <option key={item} value={item} />)}
			</select>
			<div className="relative mt-1" onBlur={() => input.blur()}>
				<Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
					<span className="block truncate">
						{!input.selected || input.selected.length === 0
							? 'Please select'
							: input.selected
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

type ExampleComboboxProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleCombobox({ name, defaultValue }: ExampleComboboxProps) {
	const [query, setQuery] = useState('');
	const input = useInput(defaultValue);
	const filteredPeople = !input.value
		? people
		: people.filter((person) =>
				person.name.toLowerCase().includes(query.toLowerCase()),
			);

	return (
		<Combobox
			as="div"
			value={input.value ?? ''}
			onChange={(value) => input.change(value ?? '')}
			onBlur={() => input.blur()}
			nullable
		>
			<div className="relative mt-1">
				<input
					{...input.visuallyHiddenProps}
					name={name}
					ref={input.register}
					defaultValue={defaultValue}
				/>
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

type ExampleSwitchProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function ExampleSwitch({
	name,
	value = 'on',
	defaultChecked,
}: ExampleSwitchProps) {
	const input = useInput(defaultChecked ? value : '');

	return (
		<>
			<input
				type="checkbox"
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultChecked={defaultChecked}
			/>
			<Switch
				checked={input.value === value}
				onChange={(state) => input.change(state ? value : '')}
				onBlur={() => input.blur()}
				className={classNames(
					input.value ? 'bg-indigo-600' : 'bg-gray-200',
					'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
				)}
			>
				<span className="sr-only">Use setting</span>
				<span
					aria-hidden="true"
					className={classNames(
						input.value ? 'translate-x-5' : 'translate-x-0',
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
	const input = useInput(defaultValue);
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
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
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

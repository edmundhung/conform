import { useControl } from '@conform-to/react';
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from '@radix-ui/react-icons';
import * as RadixSelect from '@radix-ui/react-select';
import * as RadixToggleGroup from '@radix-ui/react-toggle-group';
import * as RadixSwitch from '@radix-ui/react-switch';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import * as RadixSlider from '@radix-ui/react-slider';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import clsx from 'clsx';
import { type ElementRef, useRef } from 'react';

type ExampleSelectProps = {
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder?: string;
	defaultValue?: string;
};

export function ExampleSelect({
	name,
	items,
	placeholder,
	defaultValue,
}: ExampleSelectProps) {
	const selectRef = useRef<ElementRef<typeof RadixSelect.Trigger>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			selectRef.current?.focus();
		},
	});

	return (
		<>
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
			<RadixSelect.Root
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<RadixSelect.Trigger
					ref={selectRef}
					className="w-1/2 inline-flex items-center justify-between rounded-md px-4 py-2 gap-1 bg-white hover:bg-amber-700/30 focus:ring-2 focus:ring-amber-500 data-[placeholder]:text-neutral-400 outline-none"
				>
					<RadixSelect.Value placeholder={placeholder} />
					<RadixSelect.Icon>
						<ChevronDownIcon />
					</RadixSelect.Icon>
				</RadixSelect.Trigger>
				<RadixSelect.Portal>
					<RadixSelect.Content
						position="popper"
						side="bottom"
						sideOffset={5}
						className="overflow-hidden bg-white rounded-md shadow-md w-[--radix-select-trigger-width]"
					>
						<RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-amber-700 cursor-default">
							<ChevronUpIcon />
						</RadixSelect.ScrollUpButton>
						<RadixSelect.Viewport className="p-1">
							<RadixSelect.Group>
								{items.map((item) => {
									return (
										<RadixSelect.Item
											value={item.value}
											id={item.value}
											key={item.value}
											className="rounded-md flex items-center h-8 pr-4 pl-6 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-amber-100"
										>
											<RadixSelect.ItemText>{item.name}</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator className="absolute left-0 w-6 inline-flex items-center justify-center">
												<CheckIcon />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>
									);
								})}
							</RadixSelect.Group>
						</RadixSelect.Viewport>
						<RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-amber-700 cursor-default">
							<ChevronDownIcon />
						</RadixSelect.ScrollDownButton>
					</RadixSelect.Content>
				</RadixSelect.Portal>
			</RadixSelect.Root>
		</>
	);
}

type ExampleToggleGroupProps = {
	name: string;
	items: Array<{ label: string; value: string }>;
	defaultValue?: string;
};

export function ExampleToggleGroup({
	name,
	items,
	defaultValue,
}: ExampleToggleGroupProps) {
	const toggleGroupRef = useRef<ElementRef<typeof RadixToggleGroup.Root>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			toggleGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
			<RadixToggleGroup.Root
				type="single"
				value={control.value}
				ref={toggleGroupRef}
				className={
					'flex flex-row items-center p-1 gap-0 bg-neutral-200 rounded-lg max-w-md'
				}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				{items.map((item) => (
					<RadixToggleGroup.Item
						key={item.value}
						className="p-1 hover:bg-amber-700/30 color-amber-100 data-[state=on]:bg-amber-800 data-[state=on]:text-white flex grow items-center justify-center bg-transparent first:rounded-l-lg last:rounded-r-lg focus:z-10 focus:ring-2 focus:outline-none  focus:ring-amber-500"
						value={item.value}
						aria-label={item.label}
					>
						{item.label}
					</RadixToggleGroup.Item>
				))}
			</RadixToggleGroup.Root>
		</>
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
	const switchRef = useRef<ElementRef<typeof RadixSwitch.Root>>(null);
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
				ref={control.register}
				name={name}
				defaultChecked={defaultChecked}
				hidden
			/>
			<RadixSwitch.Root
				ref={switchRef}
				checked={control.value === value}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="w-[42px] h-[25px] bg-amber-700/30 rounded-full relative focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-700 outline-none cursor-default"
			>
				<RadixSwitch.Thumb className="block size-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
			</RadixSwitch.Root>
		</>
	);
}

type ExampleSliderProps = {
	name: string;
	max?: number;
	defaultValue?: string;
};

export function ExampleSlider({
	name,
	max = 100,
	defaultValue,
}: ExampleSliderProps) {
	const thumbRef = useRef<ElementRef<typeof RadixSlider.Thumb>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			thumbRef.current?.focus();
		},
	});

	return (
		<div className="flex items-center gap-4">
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
			<RadixSlider.Root
				value={[control.value ? parseFloat(control.value) : 0]}
				className="relative flex items-center select-none touch-none w-full h-5"
				max={max}
				onValueChange={(value) => {
					control.change(value[0].toString());
				}}
				onBlur={() => control.blur()}
				step={1}
			>
				<RadixSlider.Track className="bg-neutral-400 relative grow rounded-full h-1">
					<RadixSlider.Range className="absolute bg-amber-700/40 rounded-full h-full" />
				</RadixSlider.Track>
				<RadixSlider.Thumb
					ref={thumbRef}
					className="block size-5 shadow-md rounded-full bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 border"
				/>
			</RadixSlider.Root>
			<div>{control.value}</div>
		</div>
	);
}

type ExampleRadioGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
};

export function ExampleRadioGroup({
	name,
	items,
	defaultValue,
}: ExampleRadioGroupProps) {
	const radioGroupRef = useRef<ElementRef<typeof RadixRadioGroup.Root>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			radioGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
			<RadixRadioGroup.Root
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadixRadioGroup.Item
								id={item.value}
								value={item.value}
								className={clsx(
									'size-5 rounded-full outline-none cursor-default',
									'border hover:bg-amber-50 focus:ring-amber-500 focus:ring-2',
									'flex items-center justify-center',
									'bg-white',
								)}
							>
								<RadixRadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-2.5 after:rounded-full after:bg-amber-700" />
							</RadixRadioGroup.Item>
							<label htmlFor={item.value}>{item.label}</label>
						</div>
					);
				})}
			</RadixRadioGroup.Root>
		</>
	);
}

type ExampleCheckboxProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function ExampleCheckbox({
	name,
	value,
	defaultChecked,
}: ExampleCheckboxProps) {
	const checkboxRef = useRef<ElementRef<typeof RadixCheckbox.Root>>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<input
				type="checkbox"
				ref={control.register}
				name={name}
				hidden
				defaultChecked={defaultChecked}
				value={value}
			/>
			<RadixCheckbox.Root
				ref={checkboxRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="hover:bg-amber-50 flex size-5 appearance-none items-center justify-center rounded-md bg-white outline-none border focus:ring-amber-500 focus:ring-2"
			>
				<RadixCheckbox.Indicator className="text-amber-900">
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
		</>
	);
}

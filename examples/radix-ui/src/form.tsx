import { useCustomInput } from 'conform-react';
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

type SelectProps = {
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder?: string;
};

export function Select({ name, items, placeholder }: SelectProps) {
	const selectRef = useRef<ElementRef<typeof RadixSelect.Trigger>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					selectRef.current?.focus();
				}}
			/>
			<RadixSelect.Root
				value={input.value ?? ''}
				onValueChange={(value) => input.changed(value)}
				onOpenChange={(open) => {
					if (!open) {
						input.blurred();
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

type ToggleGroupProps = {
	name: string;
	items: Array<{ label: string; value: string }>;
};

export function ToggleGroup({ name, items }: ToggleGroupProps) {
	const toggleGroupRef = useRef<ElementRef<typeof RadixToggleGroup.Root>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/>
			<RadixToggleGroup.Root
				type="single"
				value={input.value}
				ref={toggleGroupRef}
				className={
					'flex flex-row items-center p-1 gap-0 bg-neutral-200 rounded-lg max-w-md'
				}
				onValueChange={(value) => input.changed(value)}
				onBlur={() => input.blurred()}
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

type SwitchProps = {
	name: string;
};

export function Switch({ name }: SwitchProps) {
	const switchRef = useRef<ElementRef<typeof RadixSwitch.Root>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					switchRef.current?.focus();
				}}
			/>
			<RadixSwitch.Root
				ref={switchRef}
				checked={input.value === 'on'}
				onCheckedChange={(checked) => {
					input.changed(checked ? 'on' : '');
				}}
				onBlur={() => input.blurred()}
				className="w-[42px] h-[25px] bg-amber-700/30 rounded-full relative focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-700 outline-none cursor-default"
			>
				<RadixSwitch.Thumb className="block size-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
			</RadixSwitch.Root>
		</>
	);
}

type SliderProps = {
	name: string;
	max?: number;
};

export function Slider({ name, max = 100 }: SliderProps) {
	const thumbRef = useRef<ElementRef<typeof RadixSlider.Thumb>>(null);
	const input = useCustomInput('');

	return (
		<div className="flex items-center gap-4">
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					thumbRef.current?.focus();
				}}
			/>
			<RadixSlider.Root
				value={[input.value === '' ? 0 : parseFloat(input.value)]}
				className="relative flex items-center select-none touch-none w-full h-5"
				max={max}
				onValueChange={(value) => {
					input.changed(value[0].toString());
				}}
				onBlur={() => input.blurred()}
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
			<div>{input.value}</div>
		</div>
	);
}

type RadioGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
};

export function RadioGroup({ name, items }: RadioGroupProps) {
	const radioGroupRef = useRef<ElementRef<typeof RadixRadioGroup.Root>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					radioGroupRef.current?.focus();
				}}
			/>
			<RadixRadioGroup.Root
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={input.value}
				onValueChange={(value) => input.changed(value)}
				onBlur={() => input.blurred()}
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

type CheckboxProps = {
	name: string;
	value?: string;
};

export function Checkbox({ name, value = 'on' }: CheckboxProps) {
	const checkboxRef = useRef<ElementRef<typeof RadixCheckbox.Root>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => {
					checkboxRef.current?.focus();
				}}
			/>
			<RadixCheckbox.Root
				ref={checkboxRef}
				checked={input.value === value}
				onCheckedChange={(checked) => {
					input.changed(checked ? value : '');
				}}
				onBlur={() => input.blurred()}
				className="hover:bg-amber-50 flex size-5 appearance-none items-center justify-center rounded-md bg-white outline-none border focus:ring-amber-500 focus:ring-2"
			>
				<RadixCheckbox.Indicator className="text-amber-900">
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
		</>
	);
}

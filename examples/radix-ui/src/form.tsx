import { useControl } from '@conform-to/react/future';
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from '@radix-ui/react-icons';
import {
	Select as RadixSelect,
	ToggleGroup as RadixToggleGroup,
	Switch as RadixSwitch,
	Checkbox as RadixCheckbox,
	Slider as RadixSlider,
	RadioGroup as RadixRadioGroup,
} from 'radix-ui';
import clsx from 'clsx';
import { type ComponentRef, useRef } from 'react';

export type ExampleSelectProps = {
	id: string;
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder?: string;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

export function ExampleSelect({
	id,
	name,
	items,
	placeholder,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
}: ExampleSelectProps) {
	const selectRef = useRef<ComponentRef<typeof RadixSelect.Trigger>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			selectRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
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
					id={id}
					aria-describedby={ariaDescribedBy}
					aria-invalid={ariaInvalid}
					ref={selectRef}
					className="w-1/2 inline-flex items-center justify-between rounded-md px-4 py-2 gap-1 bg-white border hover:bg-neutral-500/30 focus:ring-2 focus:ring-neutral-500 data-[placeholder]:text-neutral-400 outline-none"
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
						className="overflow-hidden bg-white rounded-md shadow-md w-(--radix-select-trigger-width)"
					>
						<RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-neutral-700 cursor-default">
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
											className="rounded-md flex items-center h-8 pr-4 pl-6 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-neutral-100"
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
						<RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-neutral-700 cursor-default">
							<ChevronDownIcon />
						</RadixSelect.ScrollDownButton>
					</RadixSelect.Content>
				</RadixSelect.Portal>
			</RadixSelect.Root>
		</>
	);
}

export type ExampleToggleGroupProps = {
	id: string;
	name: string;
	items: Array<{ label: string; value: string }>;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
};

export function ExampleToggleGroup({
	id,
	name,
	items,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	'aria-labelledby': ariaLabelledBy,
}: ExampleToggleGroupProps) {
	const toggleGroupRef =
		useRef<ComponentRef<typeof RadixToggleGroup.Root>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				toggleGroupRef.current?.querySelector<HTMLElement>(
					'[data-state="on"]',
				) ?? toggleGroupRef.current?.querySelector<HTMLElement>('button');
			item?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<RadixToggleGroup.Root
				id={id}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				aria-labelledby={ariaLabelledBy}
				type="single"
				value={control.value}
				ref={toggleGroupRef}
				className={
					'flex flex-row items-center p-1 gap-0 bg-neutral-200 rounded-lg max-w-md'
				}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					// Ignore blur events when focus moves between items in the group.
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				{items.map((item) => (
					<RadixToggleGroup.Item
						key={item.value}
						className="p-1 hover:bg-neutral-700/30 color-neutral-100 data-[state=on]:bg-neutral-800 data-[state=on]:text-white flex grow items-center justify-center bg-transparent first:rounded-l-lg last:rounded-r-lg focus:z-10 focus:ring-2 focus:outline-none  focus:ring-neutral-500"
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

export type ExampleSwitchProps = {
	id: string;
	name: string;
	value?: string;
	defaultChecked?: boolean;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

export function ExampleSwitch({
	id,
	name,
	value,
	defaultChecked,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
}: ExampleSwitchProps) {
	const switchRef = useRef<ComponentRef<typeof RadixSwitch.Root>>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" ref={control.register} name={name} hidden />
			<RadixSwitch.Root
				id={id}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				ref={switchRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="w-[42px] h-[25px] bg-neutral-700/30 rounded-full relative focus:ring-2 focus:ring-neutral-500 data-[state=checked]:bg-neutral-700 outline-none cursor-default"
			>
				<RadixSwitch.Thumb className="block size-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
			</RadixSwitch.Root>
		</>
	);
}

export type ExampleSliderProps = {
	id: string;
	name: string;
	max?: number;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
};

export function ExampleSlider({
	id,
	name,
	max = 100,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	'aria-labelledby': ariaLabelledBy,
}: ExampleSliderProps) {
	const thumbRef = useRef<ComponentRef<typeof RadixSlider.Thumb>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			thumbRef.current?.focus();
		},
	});

	return (
		<div className="flex items-center gap-4">
			<input ref={control.register} name={name} hidden />
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
					<RadixSlider.Range className="absolute bg-neutral-700/40 rounded-full h-full" />
				</RadixSlider.Track>
				<RadixSlider.Thumb
					id={id}
					aria-describedby={ariaDescribedBy}
					aria-invalid={ariaInvalid}
					aria-labelledby={ariaLabelledBy}
					ref={thumbRef}
					className="block size-5 shadow-md rounded-full bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 border"
				/>
			</RadixSlider.Root>
			<div>{control.value}</div>
		</div>
	);
}

export type ExampleRadioGroupProps = {
	id: string;
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
};

export function ExampleRadioGroup({
	id,
	name,
	items,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	'aria-labelledby': ariaLabelledBy,
}: ExampleRadioGroupProps) {
	const radioGroupRef = useRef<ComponentRef<typeof RadixRadioGroup.Root>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				radioGroupRef.current?.querySelector<HTMLElement>(
					'[data-state="checked"]',
				) ??
				radioGroupRef.current?.querySelector<HTMLElement>('[role="radio"]');
			item?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<RadixRadioGroup.Root
				id={id}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				aria-labelledby={ariaLabelledBy}
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					// Ignore blur events when focus moves between items in the group.
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				{items.map((item) => {
					const itemId = `${id}-${item.value}`;

					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadixRadioGroup.Item
								id={itemId}
								value={item.value}
								className={clsx(
									'size-5 rounded-full outline-none cursor-default',
									'border hover:bg-neutral-50 focus:ring-neutral-500 focus:ring-2',
									'flex items-center justify-center',
									'bg-white',
								)}
							>
								<RadixRadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-2.5 after:rounded-full after:bg-neutral-700" />
							</RadixRadioGroup.Item>
							<label htmlFor={itemId}>{item.label}</label>
						</div>
					);
				})}
			</RadixRadioGroup.Root>
		</>
	);
}

export type ExampleCheckboxProps = {
	id: string;
	name: string;
	value?: string;
	defaultChecked?: boolean;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

export function ExampleCheckbox({
	id,
	name,
	value,
	defaultChecked,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
}: ExampleCheckboxProps) {
	const checkboxRef = useRef<ComponentRef<typeof RadixCheckbox.Root>>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" ref={control.register} name={name} hidden />
			<RadixCheckbox.Root
				id={id}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				ref={checkboxRef}
				checked={control.checked}
				onCheckedChange={(checked) =>
					control.change(checked === 'indeterminate' ? false : checked)
				}
				onBlur={() => control.blur()}
				className="hover:bg-neutral-50 flex size-5 appearance-none items-center justify-center rounded-md bg-white outline-none border focus:ring-neutral-500 focus:ring-2"
			>
				<RadixCheckbox.Indicator className="text-neutral-900">
					<CheckIcon />
				</RadixCheckbox.Indicator>
			</RadixCheckbox.Root>
		</>
	);
}
